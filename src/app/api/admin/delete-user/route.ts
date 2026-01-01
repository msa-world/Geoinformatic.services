import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    const adminToken = request.headers.get("x-admin-token")

    if (!adminToken || !userId) {
      return NextResponse.json(
        { message: "Unauthorized or missing user ID", success: false },
        { status: 401, headers: { "Content-Type": "application/json" } },
      )
    }

    const adminSupabase = createAdminClient()

    // Delete user's profile
    const { error: profileError } = await adminSupabase.from("profiles").delete().eq("id", userId)

    if (profileError && profileError.code !== "PGRST116") throw profileError

    // Delete user's messages
    await adminSupabase.from("messages").delete().or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)

    // Delete user's notifications
    await adminSupabase.from("notifications").delete().eq("user_id", userId)

    // Additional updates can be added here if needed

    console.log("[MSA] User deleted successfully:", userId)

    return NextResponse.json(
      { message: "User deleted successfully", success: true },
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error("[MSA] Delete user error:", error)
    return NextResponse.json(
      { message: "Failed to delete user", success: false },
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
