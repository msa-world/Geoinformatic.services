import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { jobId } = body

        if (!jobId) {
            return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
        }

        // 1. Fetch Job Details
        const { data: job, error: jobError } = await supabaseAdmin
            .from("jobs")
            .select("*")
            .eq("id", jobId)
            .single()

        if (jobError || !job) {
            console.error("Job not found:", jobError)
            return NextResponse.json({ error: "Job not found" }, { status: 404 })
        }

        console.log(`[JobAlert] Processing alerts for job: ${job.title} (${job.id})`)

        // 2. Fetch Subscribers (Users with job_alerts_enabled = true)
        const { data: users, error: usersError } = await supabaseAdmin
            .from("profiles")
            .select("email, full_name")
            .eq("job_alerts_enabled", true)
            .not("email", "is", null)
            .limit(100) // Safety limit

        if (usersError) {
            console.error("Error fetching subscribers:", usersError)
            return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 })
        }

        if (!users || users.length === 0) {
            console.log("[JobAlert] No subscribers found.")
            return NextResponse.json({ success: true, count: 0 })
        }

        console.log(`[JobAlert] Found ${users.length} subscribers. Sending emails...`)

        // 3. Send Emails
        const { sendEmail } = await import('@/lib/email-service')

        const emailPromises = users.map(user =>
            sendEmail({
                to: user.email,
                subject: `New Job: ${job.title}`,
                type: 'JOB_ALERT',
                data: {
                    userName: user.full_name || 'Job Seeker',
                    jobTitle: job.title,
                    location: job.location || 'Remote',
                    type: job.type || 'Full-time',
                    jobLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/jobs` // Direct to jobs page as detail page might not be static
                }
            }).catch(err => console.error(`Failed to email ${user.email}:`, err))
        )

        // Don't await full completion if we want fast response, but for now we await to debug
        await Promise.allSettled(emailPromises)

        return NextResponse.json({ success: true, count: users.length })

    } catch (error: any) {
        console.error("Error in job alert route:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
