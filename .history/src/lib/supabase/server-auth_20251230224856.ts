import { cookies } from "next/headers"
import { createClient as createServerClient } from "./server"

type Cached = { user: any | null; expiresAt: number }

// Simple in-process cache keyed by a partial session cookie value.
// This reduces duplicate server-side calls to Supabase's auth.getUser() which
// may trigger refresh-token requests if the access token is expired. Cache is
// short-lived and per-process only (ok for dev and reduces burst traffic).
const CACHE_TTL = 5 * 1000 // 5 seconds
const cache = new Map<string, Cached>()
const inflight = new Map<string, Promise<any>>()

async function getKeyFromCookies() {
  try {
    const cs = await cookies()
    const refresh = cs.get("sb-refresh-token")?.value
    const access = cs.get("sb-access-token")?.value
    return refresh || access || "anon"
  } catch (e) {
    return "anon"
  }
}

export async function getServerUser() {
  const key = await getKeyFromCookies()
  const now = Date.now()

  const existing = cache.get(key)
  if (existing && now < existing.expiresAt) return existing.user
  if (inflight.has(key)) return inflight.get(key)!

  const p = (async () => {
    try {
      const supabase = await createServerClient()
      const { data, error } = await supabase.auth.getUser()
      if (error) {
        // On error, don't cache a user; return null
        return null
      }
      const user = data?.user ?? null
      cache.set(key, { user, expiresAt: Date.now() + CACHE_TTL })
      return user
    } catch (e) {
      return null
    } finally {
      inflight.delete(key)
    }
  })()

  inflight.set(key, p)
  return p
}

export function clearServerUserCacheForKey(keyPart: string) {
  cache.delete(keyPart)
}

export default { getServerUser, clearServerUserCacheForKey }
