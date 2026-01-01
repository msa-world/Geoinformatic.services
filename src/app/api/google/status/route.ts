import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    if (!userId) return NextResponse.json({ success: false, message: 'userId required' }, { status: 400 })

    const supabase = createAdminClient()
    const { data: profile, error } = await supabase.from('profiles').select('google_refresh_token,google_scope,google_connected_at').eq('id', userId).single()
    if (error) return NextResponse.json({ success: false, message: 'Profile not found' }, { status: 404 })

    return NextResponse.json({
      success: true,
      connected: !!profile.google_connected_at,
      has_refresh_token: !!profile.google_refresh_token,
      google_scope: profile.google_scope ?? null,
      google_connected_at: profile.google_connected_at ?? null,
    })
  } catch (err) {
    console.error('[MSA] google status error', err)
    return NextResponse.json({ success: false, message: 'Failed to get status' }, { status: 500 })
  }
}
