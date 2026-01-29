import { createClient } from "./client"

// Lightweight serialized getter for the current authenticated user.
// Prevents multiple components from concurrently calling `supabase.auth.getUser()`
// which can cause many simultaneous refresh-token requests.

type AuthUser = any

let cachedUser: AuthUser | null = null
let cacheExpiresAt = 0
let inflight: Promise<AuthUser | null> | null = null

const CACHE_TTL = 15 * 1000 // 15s - short cache to reduce bursts on navigation

export async function getUserOnce(): Promise<AuthUser | null> {
  const now = Date.now()
  if (cachedUser && now < cacheExpiresAt) return cachedUser
  if (inflight) return inflight

  inflight = (async () => {
    try {
      const supabase = createClient()
      const res = await supabase.auth.getUser()
      const user = res?.data?.user ?? null
      cachedUser = user
      cacheExpiresAt = Date.now() + CACHE_TTL
      return user
    } catch (err) {
      // On error, clear cache so subsequent calls can retry later
      cachedUser = null
      cacheExpiresAt = 0
      return null
    } finally {
      inflight = null
    }
  })()

  return inflight
}

export function clearUserCache() {
  cachedUser = null
  cacheExpiresAt = 0
}

export default { getUserOnce, clearUserCache }
