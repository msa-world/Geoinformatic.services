import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const userId = body?.userId
    if (!userId) return NextResponse.json({ success: false, message: "userId required" }, { status: 400 })

    const state = crypto.randomBytes(16).toString("hex")

    const supabase = createAdminClient()
    await supabase.from("oauth_states").insert({ state, user_id: userId, created_at: new Date().toISOString() })

    const clientId = process.env.GOOGLE_CLIENT_ID || ""
    const redirect = process.env.GOOGLE_OAUTH_REDIRECT || `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/google/oauth/callback`
    // Use a raw space-separated scope string and ensure spaces are encoded as %20
    const scopes = "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file"

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirect,
      access_type: "offline",
      prompt: "consent",
      state,
      include_granted_scopes: "true",
    } as Record<string, string>)

    // Build the final URL and append scope encoded with encodeURIComponent so spaces become %20 (Google requires %20)
    const base = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    const url = `${base}&scope=${encodeURIComponent(scopes)}`

    return NextResponse.json({ success: true, url })
  } catch (err) {
    console.error("[MSA] oauth start error", err)
    return NextResponse.json({ success: false, message: "Failed to start OAuth" }, { status: 500 })
  }
}
