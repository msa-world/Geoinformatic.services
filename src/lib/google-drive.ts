import { createAdminClient } from "@/lib/supabase/admin"
import { decrypt } from "@/lib/encryption"

export async function refreshAccessToken(refreshToken: string) {
    const tokenUrl = "https://oauth2.googleapis.com/token"
    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        refresh_token: refreshToken,
        grant_type: "refresh_token",
    })

    const res = await fetch(tokenUrl, { method: "POST", body: params })
    return res.json()
}

export async function getGoogleTokenForUser(userId: string) {
    const supabase = createAdminClient()

    // 1. Try google_accounts (Encrypted)
    const { data: account, error: accountError } = await supabase
        .from('google_accounts')
        .select('encrypted_refresh_token')
        .eq('profile_id', userId)
        .single()

    if (accountError && accountError.code !== 'PGRST116') {
        console.error('[GoogleDrive] Error fetching google_account:', accountError)
    }

    let refreshToken = null;

    if (account && account.encrypted_refresh_token) {
        try {
            refreshToken = decrypt(account.encrypted_refresh_token)
            console.log('[GoogleDrive] Found encrypted refresh token in google_accounts')
        } catch (e) {
            console.error('[GoogleDrive] Decryption failed for user', userId, e)
        }
    }

    // 2. Fallback to profiles (Plaintext)
    if (!refreshToken) {
        console.log('[GoogleDrive] No token in google_accounts, checking profiles...')
        const { data: profile } = await supabase
            .from('profiles')
            .select('google_refresh_token')
            .eq('id', userId)
            .single()
        refreshToken = profile?.google_refresh_token
        if (refreshToken) console.log('[GoogleDrive] Found plaintext refresh token in profiles')
    }

    if (!refreshToken) {
        console.warn('[GoogleDrive] No refresh token found for user', userId)
        return null
    }

    const tokenResp = await refreshAccessToken(refreshToken)
    if (tokenResp.error) {
        console.error("[GoogleDrive] refresh token error", tokenResp)
        return null
    }

    console.log('[GoogleDrive] Successfully refreshed access token')
    return tokenResp.access_token as string
}

export async function getAppFolderId(userId: string, accessToken: string, createIfMissing = false) {
    const supabase = createAdminClient()
    const { data: profile } = await supabase.from('profiles').select('google_app_folder_id').eq('id', userId).single()

    if (profile?.google_app_folder_id) return profile.google_app_folder_id

    if (!createIfMissing) return null

    // Create/Find logic
    try {
        const folderName = "GEOINFORMATIC"
        const qSearch = encodeURIComponent(`name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`)
        const listUrl = `https://www.googleapis.com/drive/v3/files?fields=files(id,name)&q=${qSearch}&pageSize=1`
        const listRes = await fetch(listUrl, { headers: { Authorization: `Bearer ${accessToken}` } })
        const listJson = await listRes.json()

        let appFolderId = null
        if (listJson && listJson.files && listJson.files.length > 0) {
            appFolderId = listJson.files[0].id
        } else {
            const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: folderName, mimeType: 'application/vnd.google-apps.folder' }),
            })
            const createJson = await createRes.json()
            appFolderId = createJson?.id ?? null
        }

        if (appFolderId) {
            await supabase.from('profiles').update({ google_app_folder_id: appFolderId }).eq('id', userId)
        }
        return appFolderId
    } catch (err) {
        console.error('[GoogleDrive] ensure app folder error', err)
        return null
    }
}
