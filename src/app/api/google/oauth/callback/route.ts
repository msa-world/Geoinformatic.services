import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { encrypt } from "@/lib/encryption"

async function exchangeCodeForToken(code: string) {
  const tokenUrl = "https://oauth2.googleapis.com/token"
  const params = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT || "",
    grant_type: "authorization_code",
  })

  const res = await fetch(tokenUrl, { method: "POST", body: params })
  const data = await res.json()
  return data
}

async function getGoogleUserInfo(accessToken: string) {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return res.json()
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get("code")
    const state = url.searchParams.get("state")

    console.log("[MSA] OAuth Callback hit. Code present:", !!code, "State:", state)

    if (!code || !state) {
      console.error("[MSA] Missing code or state")
      return NextResponse.redirect(new URL("/", request.url))
    }

    const supabase = createAdminClient()
    const { data: stateRow, error: stateError } = await supabase.from("oauth_states").select("user_id").eq("state", state).single()

    if (stateError || !stateRow) {
      console.error("[MSA] Invalid state or state not found:", state, stateError)
      return NextResponse.redirect(new URL("/", request.url))
    }

    const userId = stateRow.user_id
    console.log("[MSA] State verified for userId:", userId)

    const tokenData = await exchangeCodeForToken(code)
    if (tokenData?.error) {
      console.error("[MSA] Token exchange error", tokenData)
      return NextResponse.redirect(new URL("/", request.url))
    }

    console.log("[MSA] Token exchanged successfully. Scope:", tokenData.scope)

    // Fetch user info for google_accounts
    let userInfo: any = {}
    try {
      userInfo = await getGoogleUserInfo(tokenData.access_token)
      console.log("[MSA] Fetched Google user info:", userInfo.email)
    } catch (e) {
      console.error("[MSA] Failed to fetch google user info", e)
    }

    // Encrypt tokens
    const encryptedRefreshToken = tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null
    const encryptedAccessToken = tokenData.access_token ? encrypt(tokenData.access_token) : null

    // Upsert into google_accounts
    const { data: existingAccount } = await supabase.from('google_accounts').select('id').eq('profile_id', userId).single()

    const accountData = {
      profile_id: userId,
      google_id: userInfo.id || null,
      google_email: userInfo.email || null,
      encrypted_refresh_token: encryptedRefreshToken,
      encrypted_access_token: encryptedAccessToken,
      token_expires_at: tokenData.expires_in ? new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString() : null,
      scope: tokenData.scope,
      connected_at: new Date().toISOString(),
    }

    let dbError = null
    if (existingAccount) {
      const { error } = await supabase.from('google_accounts').update(accountData).eq('id', existingAccount.id)
      dbError = error
    } else {
      const { error } = await supabase.from('google_accounts').insert(accountData)
      dbError = error
    }

    if (dbError) {
      console.error("[MSA] Error updating google_accounts:", dbError)
    } else {
      console.log("[MSA] Successfully updated google_accounts")
    }

    // store refresh token and other metadata in profiles (Legacy/Fallback)
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        google_refresh_token: tokenData.refresh_token ?? null,
        google_access_token: tokenData.access_token ?? null,
        google_connected_at: new Date().toISOString(),
        google_scope: tokenData.scope ?? null,
      })
      .eq("id", userId)

    if (profileError) console.error("[MSA] Error updating profiles fallback:", profileError)

    // Ensure an application-scoped folder exists for this user and store its id
    try {
      const accessToken = tokenData.access_token
      if (accessToken) {
        const folderName = "GEOINFORMATIC"
        // Search for existing folder with this name
        const q = encodeURIComponent(`name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`)
        const listUrl = `https://www.googleapis.com/drive/v3/files?fields=files(id,name)&q=${q}&pageSize=1`
        const listRes = await fetch(listUrl, { headers: { Authorization: `Bearer ${accessToken}` } })
        const listJson = await listRes.json()
        let folderId: string | null = null
        if (listJson && listJson.files && listJson.files.length > 0) {
          folderId = listJson.files[0].id
        } else {
          // create the folder in the user's Drive
          const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: folderName, mimeType: 'application/vnd.google-apps.folder' }),
          })
          const createJson = await createRes.json()
          folderId = createJson?.id ?? null
        }

        if (folderId) {
          await supabase.from('profiles').update({ google_app_folder_id: folderId }).eq('id', userId)
          console.log("[MSA] App folder ensured:", folderId)
        }
      }
    } catch (err) {
      console.error('[MSA] ensure app folder error', err)
    }

    // cleanup state
    await supabase.from("oauth_states").delete().eq("state", state)

    console.log("[MSA] OAuth flow complete. Redirecting...")
    // redirect to a confirmation page or profile
    return NextResponse.redirect(new URL("/profile?google_connected=1", request.url))
  } catch (err) {
    console.error("[MSA] oauth callback error", err)
    return NextResponse.redirect(new URL("/", request.url))
  }
}
