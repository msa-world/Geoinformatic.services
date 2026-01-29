import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase Client with Service Role Key for Admin operations
function getAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

const ADMIN_TOKEN = process.env.ADMIN_SECRET_TOKEN || 'admin-secret-123'

function isAuthenticated(request: NextRequest) {
    const authHeader = request.headers.get("authorization")
    console.log("[API Debug] Auth Header:", authHeader ? "Present" : "Missing")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log("[API Debug] Invalid header format")
        return false
    }
    const token = authHeader.split(" ")[1]
    const isValid = token === ADMIN_TOKEN
    console.log(`[API Debug] Token check: ${isValid ? "PASS" : "FAIL"} (Received: ${token.substring(0, 3)}... Expected: ${ADMIN_TOKEN.substring(0, 3)}...)`)
    return isValid
}

export async function GET(request: NextRequest) {
    if (!isAuthenticated(request)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const supabaseAdmin = getAdminClient()
        const { data, error } = await supabaseAdmin
            .from("jobs")
            .select("*")
            .order("created_at", { ascending: false })

        if (error) throw error

        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    if (!isAuthenticated(request)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await request.json()
        // Start validation if needed

        const supabaseAdmin = getAdminClient()
        const { data, error } = await supabaseAdmin
            .from("jobs")
            .insert([body])
            .select()
            .single()

        if (error) throw error

        // --- SEND JOB ALERT EMAILS (Broadcast) ---
        // Note: In production, this should be a background job (Bull/Redis/Cron)
        try {
            const { data: users } = await supabaseAdmin
                .from("profiles")
                .select("email, full_name")
                .eq("job_alerts_enabled", true)
                .not("email", "is", null)
                .limit(50) // Limit to 50 for safety/demo

            if (users && users.length > 0) {
                const { sendEmail } = await import('@/lib/email-service');

                // Fire and forget (don't await loop completion to speed up response)
                const emailPromises = users.map(user =>
                    sendEmail({
                        to: user.email,
                        subject: `New Job Opportunity: ${data.title}`,
                        type: 'JOB_ALERT',
                        data: {
                            jobTitle: data.title,
                            location: data.location || 'Remote',
                            type: data.type || 'Full-time',
                            jobLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/jobs/${data.id}`
                        }
                    })
                );

                Promise.allSettled(emailPromises).then(results =>
                    console.log(`[JobAlert] Processed ${results.length} emails`)
                );
            }
        } catch (emailErr) {
            console.error('[Admin] Failed to trigger job alerts:', emailErr);
        }

        return NextResponse.json(data)
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
        const { id, ...updates } = body

        if (!id) {
            return NextResponse.json({ message: "Job ID required" }, { status: 400 })
        }

        const supabaseAdmin = getAdminClient()
        const { data, error } = await supabaseAdmin
            .from("jobs")
            .update(updates)
            .eq("id", id)
            .select()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    if (!isAuthenticated(request)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ message: "Job ID required" }, { status: 400 })
        }

        const supabaseAdmin = getAdminClient()
        const { error } = await supabaseAdmin
            .from("jobs")
            .delete()
            .eq("id", id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}
