import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { job_id, coverLetter } = body
    if (!job_id) return NextResponse.json({ error: 'job_id required' }, { status: 400 })

    const supabase = await createServerClient()

    // get user from cookies/session server-side
    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr) {
      console.error('Error getting user in server apply route:', userErr)
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }
    if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

    // check existing application
    const { data: existing, error: existingErr } = await supabase
      .from('job_applications')
      .select('id')
      .eq('user_id', user.id)
      .eq('job_id', job_id)
      .maybeSingle()

    if (existingErr) {
      console.error('Error checking existing application:', existingErr)
      return NextResponse.json({ error: existingErr.message }, { status: 500 })
    }
    if (existing) return NextResponse.json({ error: 'already_applied' }, { status: 409 })

    const { data, error } = await supabase
      .from('job_applications')
      .insert([{ job_id, user_id: user.id, status: 'PENDING', applied_at: new Date().toISOString(), cover_letter: coverLetter }])

    if (error) {
      console.error('Error inserting application:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, application: data?.[0] ?? null })
  } catch (err: any) {
    console.error('Unexpected error in /api/jobs/apply:', err)
    return NextResponse.json({ error: err.message || 'unexpected' }, { status: 500 })
  }
}
