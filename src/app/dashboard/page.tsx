import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import HeaderNavigation from "@/components/sections/header-navigation"
import Footer from "@/components/sections/footer"
import { AlertCircle } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  let profile = null
  let profileError: string | null = null

  try {
    const { data, error: profileFetchError } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (profileFetchError) {
      if (profileFetchError.code === "PGRST205" || profileFetchError.code === "42P01") {
        profileError = "Database tables not yet initialized. Please run the migration script."
      } else if (profileFetchError.code === "PGRST116") {
        // No row found, create a default one
        console.log("[MSA] No profile found, attempting to create one...")
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert([
            {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || "User",
              role: user.user_metadata?.role || "Other",
            },
          ])
          .select()
          .single()

        if (createError) {
          console.error("[MSA] Error creating profile:", createError)
          profileError = "Could not create profile. Please contact support."
        } else {
          profile = newProfile
        }
      } else {
        console.error("[MSA] Profile fetch error:", profileFetchError)
        profileError = `Error fetching profile: ${profileFetchError.message}`
      }
    } else {
      profile = data
    }
  } catch (err) {
    console.error("[MSA] Dashboard error:", err)
    profileError = "An unexpected error occurred"
  }

  return (
    <div className="min-h-screen w-full">
      <HeaderNavigation />
      <main className="w-full py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          {profileError && (
            <div className="mb-8 flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900">Database Setup Required</h3>
                <p className="text-sm text-yellow-800 mt-1">{profileError}</p>
                {profileError.includes("migration") && (
                  <p className="text-sm text-yellow-800 mt-2">
                    To fix this, run the migration script from your MSA scripts folder:{" "}
                    <code className="bg-yellow-100 px-2 py-1 rounded">scripts/001_create_profiles.sql</code>
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
              Welcome, {profile?.full_name || user.email?.split("@")[0] || "User"}!
            </h1>
            <p className="text-text-secondary">Manage your profile and account settings</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/profile" className="block">
              <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <h3 className="text-lg font-semibold text-text-primary mb-2">Profile</h3>
                <p className="text-text-secondary text-sm">View and edit your profile information</p>
              </div>
            </Link>

            <Link href="/profile/settings" className="block">
              <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <h3 className="text-lg font-semibold text-text-primary mb-2">Settings</h3>
                <p className="text-text-secondary text-sm">Manage your account settings and preferences</p>
              </div>
            </Link>

            <Link href="/profile/documents" className="block">
              <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <h3 className="text-lg font-semibold text-text-primary mb-2">Documents</h3>
                <p className="text-text-secondary text-sm">Upload and manage your CV and documents</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
