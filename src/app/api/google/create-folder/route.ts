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
    const { userId, folderName, parentId } = body || {}
    if (!userId || !folderName) return NextResponse.json({ success: false, message: "userId and folderName required" }, { status: 400 })

    const supabase = createAdminClient()
    const { data: profile, error } = await supabase.from("profiles").select("google_refresh_token").eq("id", userId).single()
    if (error || !profile) return NextResponse.json({ success: false, message: "Profile not found" }, { status: 404 })

    const refreshToken = profile.google_refresh_token
    if (!refreshToken) return NextResponse.json({ success: false, message: "User not connected to Google Drive" }, { status: 400 })

    const tokenResp = await refreshAccessToken(refreshToken)
    if (tokenResp.error) {
      console.error("[MSA] refresh token error", tokenResp)
      return NextResponse.json({ success: false, message: "Failed to refresh token" }, { status: 500 })
    }

    const accessToken = tokenResp.access_token

    // Create folder via Drive API
    const metadata: Record<string, any> = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    }
    if (parentId) metadata.parents = [parentId]

    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    })

    const json = await res.json()
    if (!res.ok) {
      console.error('[MSA] create folder error', json)
      return NextResponse.json({ success: false, message: 'Failed to create folder', error: json }, { status: 500 })
    }

    return NextResponse.json({ success: true, folder: json })
  } catch (err) {
    console.error('[MSA] create folder error', err)
    return NextResponse.json({ success: false, message: 'Failed to create folder' }, { status: 500 })
  }
}
