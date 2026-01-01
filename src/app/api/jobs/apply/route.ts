import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getServerUser } from '@/lib/supabase/server-auth'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { job_id } = body
    if (!job_id) return NextResponse.json({ error: 'job_id required' }, { status: 400 })

    const supabase = await createServerClient()
    const user = await getServerUser()
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

    // Insert application
    const { data, error } = await supabase
      .from('job_applications')
      .insert([{ job_id, user_id: user.id, status: 'PENDING', applied_at: new Date().toISOString() }])
      .select()

    if (error) {
      console.error('Error inserting application:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // --- SEND EMAILS ---
    try {
      // Initialize Admin Client for robust data access (bypass all RLS)
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // 1. Fetch Job Details (Using Admin Client to guarantee access)
      // Note: The column for job owner is 'posted_by', not 'user_id'
      const { data: job, error: jobError } = await supabaseAdmin
        .from('jobs')
        .select('title, posted_by')
        .eq('id', job_id)
        .single();

      if (jobError) {
        console.error('[Apply] Failed to fetch job details:', jobError);
      }

      const jobTitle = job?.title || 'Job Position';

      // 2. Fetch Owner Email directly from Auth (Source of Truth)
      let ownerEmail = 'GEOINFORMATIC.SERVICES@GMAIL.COM'; // User support fallback

      if (job?.posted_by) {
        // Trusted lookup via Auth Admin API
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(job.posted_by);

        if (!userError && userData?.user?.email) {
          ownerEmail = userData.user.email;
          console.log(`[Apply] Found owner email via Auth: ${ownerEmail}`);
        } else {
          console.warn(`[Apply] Failed to fetch owner from Auth:`, userError);

          // Fallback to Profile table
          const { data: ownerProfile } = await supabaseAdmin
            .from('profiles')
            .select('email')
            .eq('id', job.posted_by)
            .single();

          if (ownerProfile?.email) {
            ownerEmail = ownerProfile.email;
            console.log(`[Apply] Found owner email via Profile: ${ownerEmail}`);
          }
        }
      }

      // 3. Import dynamically
      const { sendEmail } = await import('@/lib/email-service');

      // 4. Email to Applicant
      await sendEmail({
        to: user.email!,
        subject: `Application Received: ${jobTitle}`,
        type: 'JOB_APPLICATION_USER',
        data: {
          userName: user.user_metadata?.full_name || 'Candidate',
          jobTitle: jobTitle,
          dashboardLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`
        }
      });

      // 5. Email to Job Owner
      console.log(`[Apply] Sending owner notification to: ${ownerEmail}`);
      await sendEmail({
        to: ownerEmail,
        subject: `New Application: ${jobTitle}`,
        type: 'JOB_APPLICATION_ADMIN',
        data: {
          userName: user.user_metadata?.full_name || 'Candidate',
          userEmail: user.email,
          jobTitle: jobTitle,
          adminLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/jobs`
        }
      });

    } catch (emailErr) {
      console.error('Failed to send application emails:', emailErr);
      // Don't fail the request, just log
    }

    return NextResponse.json({ success: true, application: data?.[0] ?? null })
  } catch (err: any) {
    console.error('Unexpected error in /api/jobs/apply:', err)
    return NextResponse.json({ error: err.message || 'unexpected' }, { status: 500 })
  }
}
