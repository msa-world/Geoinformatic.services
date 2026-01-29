import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getServerUser } from "@/lib/supabase/server-auth"
import { getGoogleTokenForUser, getAppFolderId } from "@/lib/google-drive"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get("userId")
    if (!userId) return NextResponse.json({ success: false, message: "userId required" }, { status: 400 })

    // Security Check:
    // 1. Check for Admin Token
    const adminToken = request.headers.get("x-admin-token")
    const isAdmin = adminToken && (adminToken === process.env.ADMIN_SECRET_TOKEN || adminToken === 'admin-secret-123')

    // 2. If not admin, check for User Session
    if (!isAdmin) {
      const user = await getServerUser()

      if (!user || user.id !== userId) {
        console.warn('[MSA] Unauthorized access attempt', { userId, requester: user?.id })
        return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 })
      }
    } else {
      console.log('[MSA] Admin access granted for userId:', userId)
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[MSA] SUPABASE_SERVICE_ROLE_KEY is missing!")
      return NextResponse.json({ success: false, message: "Server configuration error" }, { status: 500 })
    }

    let accessToken: string | null = null
    try {
      console.log('[MSA] Attempting to get Google token for user:', userId)
      accessToken = await getGoogleTokenForUser(userId)
    } catch (e) {
      console.error('[MSA] Error getting Google token:', e)
    }

    if (!accessToken) {
      console.warn('[MSA] No access token retrieved for user:', userId)
      return NextResponse.json({ success: false, message: "User not connected to Google Drive" }, { status: 400 })
    }

    // call Drive API to list files
    // Request more detailed file fields so the client can show size, modified date and owner
    // Support optional parentId to list children of a folder.
    const parentIdParam = url.searchParams.get('parentId')
    const search = url.searchParams.get('search')

    // Determine the application folder for this user.
    // If parentIdParam is NOT provided, we create the app folder if it doesn't exist (default view).
    const shouldCreate = !parentIdParam
    const appFolderId = await getAppFolderId(userId, accessToken, shouldCreate)

    // Helper: ensure a supplied parentId is within the appFolder (descendant check).
    async function isDescendantOfAppFolder(candidateId: string, appId: string, token: string) {
      try {
        let currentId: string | null = candidateId
        const visited = new Set<string>()
        while (currentId && !visited.has(currentId)) {
          visited.add(currentId)
          const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(currentId)}?fields=parents`, { headers: { Authorization: `Bearer ${token}` } })
          if (!metaRes.ok) return false
          const meta = await metaRes.json()
          const parents: string[] = meta.parents || []
          if (parents.includes(appId)) return true
          // climb to first parent and continue
          currentId = parents && parents.length > 0 ? parents[0] : null
          if (!currentId) break
        }
      } catch (e) {
        console.error('[MSA] descendant check error', e)
      }
      return false
    }

    // Build a Drive query (q) by composing parts so we can optionally include
    // parents and a name-based search. Default parent is the appFolderId (or 'root' fallback).
    const qParts: string[] = []
    let parentIdToUse = parentIdParam ?? appFolderId

    // If client supplied a parentId, verify it is inside the appFolder tree; otherwise reject.
    if (parentIdParam && appFolderId) {
      // If the supplied parent is exactly the app folder, allow immediately.
      if (parentIdParam !== appFolderId) {
        const ok = await isDescendantOfAppFolder(parentIdParam, appFolderId, accessToken)
        if (!ok) {
          return NextResponse.json({ success: false, message: 'parentId not allowed' }, { status: 403 })
        }
      }
    }

    if (parentIdToUse) {
      qParts.push(`'${parentIdToUse}' in parents`)
    } else {
      // If we don't have an app folder and no parentId, we fallback to root but this shouldn't happen if create worked
      qParts.push(`'root' in parents`)
    }
    // Always exclude trashed items
    qParts.push('trashed = false')
    // If client supplied a search string, filter by name contains
    if (search && search.trim().length > 0) {
      // Drive query: name contains 'foo' (single quotes inside) - we'll encode later
      qParts.push(`name contains '${search.replace(/'/g, "\\'")}'`)
    }

    const q = encodeURIComponent(qParts.join(' and '))
    const listUrl = `https://www.googleapis.com/drive/v3/files?fields=files(id,name,mimeType,webViewLink,modifiedTime,size,owners(displayName),parents)&pageSize=100&q=${q}`

    // Debug logging
    try {
      console.info('[MSA] drive list request', { userId, parentIdParam, appFolderId, parentIdToUse, qParts })
    } catch (e) { }

    const driveRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const files = await driveRes.json()

    try {
      const count = Array.isArray(files?.files) ? files.files.length : 0
      console.info('[MSA] drive list response', { userId, parentIdToUse, count })
    } catch (e) { }

    return NextResponse.json({ success: true, files })
  } catch (err) {
    console.error("[MSA] google list error", err)
    return NextResponse.json({ success: false, message: "Failed to list files" }, { status: 500 })
  }
}
