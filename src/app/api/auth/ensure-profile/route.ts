import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Ensure profile exists for logged-in user
 * Called after successful authentication to create a profile if needed
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, email, fullName } = await request.json()

    if (!userId || !email) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    console.log("[MSA] API: Ensuring profile exists for user:", userId)

    // Check if profile already exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single()

    if (existingProfile) {
      console.log("[MSA] API: Profile already exists")
      return NextResponse.json({ success: true, message: "Profile already exists", profile: existingProfile })
    }

    // If table doesn't exist or other fetch error, log but don't fail
    // The trigger should have created the profile automatically
    if (fetchError) {
      console.log(
        "[MSA] API: Could not check profile - table may not exist yet or trigger will create it",
        fetchError.code,
      )
      // Return success anyway - the trigger or manual creation will handle it
      return NextResponse.json({
        success: true,
        message: "User authenticated. Profile creation handled by database trigger.",
        profile: null,
        note: "Run the SQL migration script if you see profile-related errors",
      })
    }

    // Create new profile
    console.log("[MSA] API: Creating profile for user:", userId)

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
      console.log("[MSA] API: Error creating profile (non-fatal):", createError.message)
      // Even if profile creation fails, authentication succeeded
      // The user can still proceed - profile might be created by trigger
      return NextResponse.json({
        success: true,
        message: "User authenticated. Profile may be created by database trigger.",
        profile: null,
      })
    }

    console.log("[MSA] API: Profile created successfully")
    return NextResponse.json({ success: true, message: "Profile created", profile: newProfile })
  } catch (error) {
    console.error("[MSA] API: Unexpected error:", error)
    // Don't block login on profile creation errors
    return NextResponse.json(
      {
        success: true,
        message: "User authenticated. Profile creation deferred.",
      },
      { status: 200 },
    )
  }
}
