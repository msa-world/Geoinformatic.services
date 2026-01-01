import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase Client with Service Role Key for Admin operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ADMIN_TOKEN = process.env.ADMIN_SECRET_TOKEN || 'admin-secret-123'

function isAuthenticated(request: NextRequest) {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return false
    }
    const token = authHeader.split(" ")[1]
    return token === ADMIN_TOKEN
}

export async function GET(request: NextRequest) {
    if (!isAuthenticated(request)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const { data: apps, error } = await supabaseAdmin
            .from("job_applications")
            .select(`
            *,
            job:jobs(title, department)
        `)
            .order("applied_at", { ascending: false })

        if (error) throw error

        if (apps && apps.length > 0) {
            const userIds = apps.map((a: any) => a.user_id)
            const { data: profiles } = await supabaseAdmin
                .from("profiles")
                .select("*")
                .in("id", userIds)

            const fullApps = apps.map((app: any) => ({
                ...app,
                profile: profiles?.find((p: any) => p.id === app.user_id)
            }))
            return NextResponse.json(fullApps)
        }

        return NextResponse.json(apps || [])
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    if (!isAuthenticated(request)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { id, status } = body

        if (!id || !status) {
            return NextResponse.json({ message: "ID and Status required" }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from("job_applications")
            .update({ status })
            .eq("id", id)
            .select(`
                *,
                job:jobs(title),
                profile:profiles(full_name, email)
            `)
            .single()

        if (error) throw error

        // --- SEND STATUS EMAIL ---
        try {
            // Robust data fetching for email
            let emailTo = null;
            let userName = 'Candidate';
            let jobTitle = data?.job?.title;

            // 1. Fix Job Title (Manual Fetch if missing)
            if (!jobTitle && data?.job_id) {
                const { data: manualJob } = await supabaseAdmin
                    .from('jobs')
                    .select('title')
                    .eq('id', data.job_id)
                    .single();
                if (manualJob?.title) jobTitle = manualJob.title;
            }
            jobTitle = jobTitle || 'Job Application';

            // 2. Fix Recipient Email (Auth Lookup Priority)
            if (data?.user_id) {
                // Try Auth User first (Most reliable)
                const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(data.user_id);
                if (authUser?.user?.email) {
                    emailTo = authUser.user.email;
                    // Try to get name from metadata if profile name is missing
                    if (!userName || userName === 'Candidate') {
                        userName = authUser.user.user_metadata?.full_name || 'Candidate';
                    }
                }
            }

            // Fallback to Profile Email if Auth failed (e.g. strict config)
            if (!emailTo && data?.profile?.email) {
                emailTo = data.profile.email;
            }

            // Fallback Profile Name
            if (data?.profile?.full_name) {
                userName = data.profile.full_name;
            }

            if (emailTo) {
                console.log(`[Admin] Sending status update email to ${emailTo} (New Status: ${status})`);
                const { sendEmail } = await import('@/lib/email-service');

                await sendEmail({
                    to: emailTo,
                    subject: `Update on your application: ${jobTitle}`,
                    type: 'STATUS_UPDATE',
                    data: {
                        userName: userName,
                        jobTitle: jobTitle,
                        newStatus: status,
                        dashboardLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`
                    }
                });
            } else {
                console.warn(`[Admin] Could not find email for user ${data?.user_id} to send status update.`);
            }
        } catch (emailErr) {
            console.error('[Admin] Failed to send status email:', emailErr);
        }

        return NextResponse.json([data]) // Return array to match previous response format if needed
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}
