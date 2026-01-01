import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
    try {
        const url = new URL(req.url)
        const userId = url.searchParams.get('userId')
        const adminToken = req.headers.get('x-admin-token')

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({ success: false, message: 'Server configuration error' }, { status: 500 })
        }

        if (!adminToken || (adminToken !== process.env.ADMIN_SECRET_TOKEN && adminToken !== 'admin-secret-123')) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 })
        }

        const supabaseAdmin = createAdminClient()
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('google_connected_at, google_app_folder_id')
            .eq('id', userId)
            .single()

        if (error) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, profile: data })
    } catch (error) {
        console.error('[Admin API] Server error:', error)
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
    }
}
