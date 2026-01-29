import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'OPEN')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching jobs (server):', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ jobs: data })
  } catch (err: any) {
    console.error('Unexpected error in /api/jobs/list:', err)
    return NextResponse.json({ error: err.message || 'unexpected' }, { status: 500 })
  }
}
