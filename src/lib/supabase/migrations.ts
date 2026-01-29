import { createClient } from "@/lib/supabase/server"

/**
 * Initialize database tables and schema
 * This function creates the profiles table and sets up RLS policies
 */
export async function initializeDatabase() {
  const supabase = await createClient()

  try {
    console.log("[MSA] Initializing database schema...")

    // Create profiles table
    const { error: createTableError } = await supabase.rpc("setup_profiles_table", {})

    if (createTableError) {
      console.log("[MSA] profiles table might already exist or RPC not available, attempting direct setup...")

      // Fallback: Try to query the table to see if it exists
      const { error: queryError } = await supabase.from("profiles").select("count", { count: "exact", head: true })

      if (queryError?.code === "PGRST205" || queryError?.code === "42P01") {
        // Table doesn't exist, we need to create it manually via SQL
        console.log("[MSA] profiles table does not exist, user must run migration script")
        return { success: false, message: "Database migration needed. Please run the migration script." }
      }
    }

    console.log("[MSA] Database initialized successfully")
    return { success: true, message: "Database schema is ready" }
  } catch (error) {
    console.error("[MSA] Database initialization error:", error)
    return {
      success: false,
      message: `Database setup error: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

/**
 * Ensure profile exists for a user
 * Creates a basic profile if it doesn't exist
 */
export async function ensureProfileExists(userId: string, email: string, fullName?: string) {
  const supabase = await createClient()

  try {
    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single()

    if (existingProfile) {
      console.log("[MSA] Profile already exists for user:", userId)
      return { success: true, profile: existingProfile }
    }

    // Profile doesn't exist, create one
    if (fetchError?.code === "PGRST205" || fetchError?.code === "42P01") {
      console.log("[MSA] profiles table does not exist yet")
      return { success: false, message: "Database not initialized yet" }
    }

    // Create new profile
    console.log("[MSA] Creating profile for user:", userId)
    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert([
        {
          id: userId,
          email,
          full_name: fullName || "User",
          role: "Other",
        },
      ])
      .select()
      .single()

    if (createError) {
      console.error("[MSA] Error creating profile:", createError)
      return { success: false, message: `Failed to create profile: ${createError.message}` }
    }

    console.log("[MSA] Profile created successfully")
    return { success: true, profile: newProfile }
  } catch (error) {
    console.error("[MSA] ensureProfileExists error:", error)
    return { success: false, message: `Error: ${error instanceof Error ? error.message : "Unknown error"}` }
  }
}
