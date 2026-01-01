import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId } = body || {}
    if (!userId) return NextResponse.json({ success: false, message: "userId required" }, { status: 400 })

    const supabase = createAdminClient()
    const { data: profile, error } = await supabase.from('profiles').select('google_refresh_token').eq('id', userId).single()
    if (error || !profile) return NextResponse.json({ success: false, message: 'Profile not found' }, { status: 404 })

    const refreshToken = profile.google_refresh_token
    // Soft Disconnect: We do NOT revoke the token. We just clear the UI status.
    // The admin still needs access via the refresh token.

    // Clear stored tokens in profiles (PARTIALLY)
    // We keep google_refresh_token and google_scope so admin can still access.
    // We clear google_connected_at to indicate to the UI that the user has "disconnected".
    const { error: updErr } = await supabase.from('profiles').update({
      // google_refresh_token: null, // KEEP THIS
      google_access_token: null, // Clear access token (it expires anyway)
      google_connected_at: null, // This signals "disconnected" to the UI
      // google_scope: null, // KEEP THIS
    }).eq('id', userId)

    if (updErr) {
      console.error('[MSA] clear tokens error', updErr)
      return NextResponse.json({ success: false, message: 'Failed to clear tokens' }, { status: 500 })
    }

    // We do NOT delete from google_accounts anymore, as that might be used for other things or admin access logic if it evolves.
    // Actually, looking at callback, google_accounts is a mirror. 
    // If we want to be consistent, maybe we should leave it alone or just update a status there if it existed.
    // For now, we leave it as is (don't delete).

    return NextResponse.json({ success: true })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[MSA] disconnect error', err)
    return NextResponse.json({ success: false, message: 'Failed to disconnect' }, { status: 500 })
  }
}
