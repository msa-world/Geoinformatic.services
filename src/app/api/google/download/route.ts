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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get("userId")
    const fileId = url.searchParams.get("fileId")
    if (!userId || !fileId) return NextResponse.json({ success: false, message: "userId and fileId required" }, { status: 400 })

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
        // climb parents until we either find the appFolderId or reach root
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
        console.error('[MSA] download descendant check error', e)
        return NextResponse.json({ success: false, message: 'file not allowed' }, { status: 403 })
      }
    }

    // Fetch file metadata first to handle Google Workspace native docs (Docs/Sheets/Slides)
    const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const metaJson = await metaRes.json()
    if (!metaRes.ok) {
      console.error('[MSA] drive metadata error', metaJson)
      return NextResponse.json({ success: false, message: 'Failed to fetch file metadata', error: metaJson }, { status: 500 })
    }

    const mimeType = metaJson.mimeType as string | undefined

    if (mimeType && mimeType.startsWith('application/vnd.google-apps.')) {
      // These are Google Docs/Sheets/Slides and must be exported
      let exportMime = 'application/pdf'
      if (mimeType === 'application/vnd.google-apps.spreadsheet') {
        exportMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // xlsx
      } else if (mimeType === 'application/vnd.google-apps.presentation') {
        exportMime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation' // pptx
      } else if (mimeType === 'application/vnd.google-apps.document') {
        exportMime = 'application/pdf'
      }

      const exportRes = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=${encodeURIComponent(exportMime)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!exportRes.ok) {
        const json = await exportRes.json()
        console.error('[MSA] drive export error', json)
        return NextResponse.json({ success: false, message: 'Export failed', error: json }, { status: 500 })
      }

      const arrayBuffer = await exportRes.arrayBuffer()
      return new NextResponse(arrayBuffer, {
        headers: {
          'Content-Type': exportMime,
          'Content-Disposition': `attachment; filename="${metaJson.name || 'file'}"`,
        },
      })
    }

    // Regular binary file - download contents
    const driveRes = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!driveRes.ok) {
      const json = await driveRes.json()
      console.error('[MSA] drive download error', json)
      return NextResponse.json({ success: false, message: 'Download failed', error: json }, { status: 500 })
    }

    const contentType = driveRes.headers.get('content-type') || 'application/octet-stream'
    const arrayBuffer = await driveRes.arrayBuffer()

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${metaJson.name || 'file'}"`,
      },
    })
  } catch (err) {
    console.error("[MSA] google download error", err)
    return NextResponse.json({ success: false, message: "Failed to download file" }, { status: 500 })
  }
}
