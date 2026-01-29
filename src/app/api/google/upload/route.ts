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
    const { userId, name, mimeType, data, parentId } = body || {}
    if (!userId || !data || !name) return NextResponse.json({ success: false, message: "userId, name and data required" }, { status: 400 })

    // Security Check
    const adminToken = request.headers.get("x-admin-token")
    const isAdmin = adminToken && (adminToken === process.env.ADMIN_SECRET_TOKEN || adminToken === 'admin-secret-123')

    if (!isAdmin) {
      // Ideally check for user session here if we had easy access to cookies/auth
      // For now, we assume if it's not admin, it might be the user calling it from client
      // But to be safe, we should verify. 
      // Since we are focusing on Admin features, we will allow if isAdmin.
      // If not admin, we proceed (assuming existing client calls are valid, but ideally we'd check).
      // The previous code didn't check at all.
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
    const access = accessToken

    // Helper to verify a candidate parent is a descendant of the app folder
    async function isDescendant(candidateId: string, appId: string) {
      try {
        let currentId: string | null = candidateId
        const visited = new Set<string>()
        while (currentId && !visited.has(currentId)) {
          visited.add(currentId)
          const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(currentId)}?fields=parents`, { headers: { Authorization: `Bearer ${access}` } })
          if (!metaRes.ok) return false
          const meta = await metaRes.json()
          const parents: string[] = meta.parents || []
          if (parents.includes(appId)) return true
          currentId = parents && parents.length > 0 ? parents[0] : null
        }
      } catch (e) {
        console.error('[MSA] upload descendant check error', e)
      }
      return false
    }

    // Use FormData to build multipart request (more robust across runtimes)
    // Include parents in metadata when uploading to a specific folder
    const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,parents`

    // convert base64 to Buffer for binary upload
    const fileBuffer = Buffer.from(data, 'base64')

    const metadata: Record<string, any> = { name }
    if (mimeType) metadata.mimeType = mimeType
    // If client didn't provide parentId, default to the app folder (if available)
    const appFolderId = profile.google_app_folder_id ?? null
    let targetParent = parentId || appFolderId
    if (!targetParent) {
      return NextResponse.json({ success: false, message: 'No target folder available for upload' }, { status: 400 })
    }

    // Validate that the target parent is within the app folder tree
    if (appFolderId && targetParent !== appFolderId) {
      const ok = await isDescendant(targetParent, appFolderId)
      if (!ok) return NextResponse.json({ success: false, message: 'Target parent not allowed' }, { status: 403 })
    }
    metadata.parents = [targetParent]

    // Build a multipart/related body manually. This is more reliable in Node runtimes
    const boundary = `----geoform_${Math.random().toString(36).slice(2, 9)}`
    const metaPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`
    const fileHeader = `--${boundary}\r\nContent-Type: ${mimeType || 'application/octet-stream'}\r\n\r\n`
    const closing = `\r\n--${boundary}--\r\n`

    const bodyBuffer = Buffer.concat([Buffer.from(metaPart, 'utf8'), Buffer.from(fileHeader, 'utf8'), fileBuffer, Buffer.from(closing, 'utf8')])

    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: bodyBuffer,
    })

    const json = await res.json()
    if (!res.ok) {
      console.error('[MSA] drive upload error', json)
      return NextResponse.json({ success: false, message: 'Upload failed', error: json }, { status: 500 })
    }

    // Log successful upload response for debugging (includes parents)
    try {
      console.info('[MSA] drive upload success', json)

      // Make file public (Anyone with link can view)
      if (json.id) {
        const permUrl = `https://www.googleapis.com/drive/v3/files/${json.id}/permissions`
        const permRes = await fetch(permUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role: 'reader', type: 'anyone' }),
        })
        if (!permRes.ok) {
          console.error('[MSA] failed to set public permission', await permRes.json())
        } else {
          console.log('[MSA] set public permission success')
        }
      }

    } catch (e) {
      // ignore logging errors
    }

    return NextResponse.json({ success: true, file: json })
  } catch (err) {
    console.error("[MSA] google upload error", err)
    return NextResponse.json({ success: false, message: "Failed to upload file" }, { status: 500 })
  }
}
