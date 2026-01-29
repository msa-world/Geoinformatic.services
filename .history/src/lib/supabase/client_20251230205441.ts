import { createBrowserClient } from "@supabase/ssr"

// Use a singleton browser client so multiple components don't each create
// a new Supabase client instance which can trigger concurrent session
// loads / token refreshes and hit rate limits (429). Server-side callers
// should continue to use the server helper in `server.ts`.
let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return browserClient
}
