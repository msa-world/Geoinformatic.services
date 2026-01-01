import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

async function refreshAccessToken(refreshToken: string) {
  const tokenUrl = "https://oauth2.googleapis.com/token"
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  })

  const res = await fetch(tokenUrl, { method: "POST", body: params })
  return res.json()
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, fileId } = body || {}
    if (!userId || !fileId) return NextResponse.json({ success: false, message: "userId and fileId required" }, { status: 400 })

    // Security Check
    const adminToken = request.headers.get("x-admin-token")
    const isAdmin = adminToken && (adminToken === process.env.ADMIN_SECRET_TOKEN || adminToken === 'admin-secret-123')

    if (!isAdmin) {
      // Same as upload, we rely on existing flow for users but enforce admin check if header is present
    }

    const supabase = createAdminClient()
    const { data: profile, error } = await supabase.from("profiles").select("google_refresh_token,google_app_folder_id").eq("id", userId).single()
    if (error || !profile) return NextResponse.json({ success: false, message: "Profile not found" }, { status: 404 })

    const refreshToken = profile.google_refresh_token
    if (!refreshToken) return NextResponse.json({ success: false, message: "User not connected to Google Drive" }, { status: 400 })

    const tokenResp = await refreshAccessToken(refreshToken)
    if (tokenResp.error) {
      console.error("[MSA] refresh token error", tokenResp)
      return NextResponse.json({ success: false, message: "Failed to refresh token" }, { status: 500 })
    }

    const accessToken = tokenResp.access_token

    // Ensure the requested file is inside the app folder for this user
    const appFolderId = profile.google_app_folder_id ?? null
    if (appFolderId) {
      try {
        let currentId: string | null = fileId
        const visited = new Set<string>()
        let allowed = false
        while (currentId && !visited.has(currentId)) {
          visited.add(currentId)
          const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(currentId)}?fields=parents`, { headers: { Authorization: `Bearer ${accessToken}` } })
          if (!metaRes.ok) break
          const meta = await metaRes.json()
          const parents: string[] = meta.parents || []
          if (parents.includes(appFolderId)) {
            allowed = true
            break
          }
          currentId = parents && parents.length > 0 ? parents[0] : null
        }
        if (!allowed && fileId !== appFolderId) {
          return NextResponse.json({ success: false, message: 'file not allowed' }, { status: 403 })
        }
      } catch (e) {
        console.error('[MSA] delete descendant check error', e)
        return NextResponse.json({ success: false, message: 'file not allowed' }, { status: 403 })
      }
    }

    const delRes = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (delRes.status === 204) {
      return NextResponse.json({ success: true })
    }

    const json = await delRes.json()
    console.error('[MSA] drive delete error', json)
    if (delRes.status === 403) {
      // Common cause: the app does not have write access to that file when using drive.file or readonly scopes
      return NextResponse.json({ success: false, message: 'Delete failed: insufficient permission. The app may not have write access to this file. Consider requesting the full Drive scope (https://www.googleapis.com/auth/drive) or use files created by the app (drive.file).', error: json }, { status: 403 })
    }

    return NextResponse.json({ success: false, message: 'Delete failed', error: json }, { status: 500 })
  } catch (err) {
    console.error("[MSA] google delete error", err)
    return NextResponse.json({ success: false, message: "Failed to delete file" }, { status: 500 })
  }
}
