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
    if (!userId) return NextResponse.json({ success: false, message: "userId required" }, { status: 400 })

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

    // Call Drive About API to get storageQuota
    const aboutRes = await fetch("https://www.googleapis.com/drive/v3/about?fields=storageQuota", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    const aboutJson = await aboutRes.json()
    if (!aboutRes.ok) {
      console.error('[MSA] drive about error', aboutJson)
      return NextResponse.json({ success: false, message: 'Failed to fetch storage info', error: aboutJson }, { status: 500 })
    }

    // storageQuota contains usage and limit (strings of bytes). Return as-is so client can parse.
    return NextResponse.json({ success: true, storageQuota: aboutJson.storageQuota ?? null })
  } catch (err) {
    console.error('[MSA] google storage error', err)
    return NextResponse.json({ success: false, message: 'Failed to get storage info' }, { status: 500 })
  }
}
