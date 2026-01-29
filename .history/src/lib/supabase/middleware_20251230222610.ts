import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  // Quick path check: only call Supabase auth for routes we consider protected.
  // This avoids calling `supabase.auth.getUser()` on every single request
  // (assets, public pages, APIs) which can generate many token-refresh calls
  // and hit Supabase rate limits. We only need user info for protected pages.
  const pathname = request.nextUrl.pathname
  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/gis-") ||
    pathname.startsWith("/spatial-") ||
    pathname.startsWith("/topographical-") ||
    pathname.startsWith("/georeferencing-") ||
    pathname.startsWith("/remote-sensing-") ||
    pathname.startsWith("/cadastral-") ||
    pathname.startsWith("/web")

  // If this is a public page, do not call Supabase and allow the request.
  if (isPublic) {
    return NextResponse.next({ request })
  }

  // Protected route: create server Supabase client and verify user.
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Redirect to login for protected routes
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
