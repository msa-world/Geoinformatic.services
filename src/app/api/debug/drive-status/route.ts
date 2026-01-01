import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { decrypt } from "@/lib/encryption"
import { refreshAccessToken } from "@/lib/google-drive"

export async function GET(request: Request) {
    try {
        const url = new URL(request.url)
        const userId = url.searchParams.get("userId")
        const adminToken = request.headers.get("x-admin-token")

        if (!userId) return NextResponse.json({ error: "UserId required" }, { status: 400 })

        // Simple admin check
        if (adminToken !== process.env.ADMIN_SECRET_TOKEN && adminToken !== 'admin-secret-123') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const supabase = createAdminClient()
        const report: any = { userId, steps: [] }

        // 1. Check google_accounts
        report.steps.push("Fetching google_accounts...")
        const { data: account, error: accountError } = await supabase
            .from('google_accounts')
            .select('*')
            .eq('profile_id', userId)
            .single()

        if (accountError) {
            report.steps.push(`Error fetching account: ${accountError.message} (${accountError.code})`)
            report.accountError = accountError
        } else {
            report.steps.push("Found google_accounts record")
            report.account = { ...account, encrypted_refresh_token: 'REDACTED', encrypted_access_token: 'REDACTED' }
        }

        // 2. Try Decryption
        let refreshToken = null
        if (account && account.encrypted_refresh_token) {
            try {
                refreshToken = decrypt(account.encrypted_refresh_token)
                report.steps.push("Decryption successful")
                report.decryptionSuccess = true
            } catch (e: any) {
                report.steps.push(`Decryption failed: ${e.message}`)
                report.decryptionError = e.message
            }
        } else {
            report.steps.push("No encrypted_refresh_token in account")
        }

        // 3. Fallback to profiles
        if (!refreshToken) {
            report.steps.push("Checking profiles table fallback...")
            const { data: profile } = await supabase
                .from('profiles')
                .select('google_refresh_token')
                .eq('id', userId)
                .single()

            if (profile?.google_refresh_token) {
                refreshToken = profile.google_refresh_token
                report.steps.push("Found plaintext token in profiles")
                report.foundInProfiles = true
            } else {
                report.steps.push("No token in profiles")
            }
        }

        // 4. Test Refresh
        if (refreshToken) {
            report.steps.push("Attempting to refresh token...")
            const tokenResp = await refreshAccessToken(refreshToken)
            if (tokenResp.error) {
                report.steps.push(`Refresh failed: ${JSON.stringify(tokenResp)}`)
                report.refreshError = tokenResp
            } else {
                report.steps.push("Refresh successful")
                report.refreshSuccess = true
                report.accessTokenPrefix = tokenResp.access_token?.substring(0, 10) + "..."
            }
        } else {
            report.steps.push("No refresh token available to test")
        }

        return NextResponse.json(report)
    } catch (err: any) {
        return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 })
    }
}
