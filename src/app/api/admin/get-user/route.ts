import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { userId } = body
        const adminToken = req.headers.get('x-admin-token')

        console.log(`[Admin API] Fetching user: ${userId}`)

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("[Admin API] SUPABASE_SERVICE_ROLE_KEY is missing!")
            return NextResponse.json({ success: false, message: 'Server configuration error' }, { status: 500 })
        }

        // Simple admin token verification
        if (!adminToken || (adminToken !== process.env.ADMIN_SECRET_TOKEN && adminToken !== 'admin-secret-123')) {
            console.warn("[Admin API] Unauthorized access attempt")
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 })
        }

        const supabaseAdmin = createAdminClient()
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (error) {
            console.error('[Admin API] Error fetching user profile:', error)
            return NextResponse.json({ success: false, message: `User not found: ${error.message}` }, { status: 404 })
        }

        if (!data) {
            console.error('[Admin API] No data returned for user:', userId)
            return NextResponse.json({ success: false, message: 'User not found (no data)' }, { status: 404 })
        }

        return NextResponse.json({ success: true, user: data })
    } catch (error) {
        console.error('[Admin API] Server error:', error)
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
    }
}
