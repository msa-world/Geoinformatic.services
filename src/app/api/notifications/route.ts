import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { message: "User ID required", success: false },
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    const adminSupabase = createAdminClient()

    const { data, error: fetchError } = await adminSupabase
      .from("notifications")
      .select("*, messages(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (fetchError) throw fetchError

    return NextResponse.json(
      { notifications: data, success: true },
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error("[MSA] Get notifications error:", error)
    return NextResponse.json(
      { message: "Failed to fetch notifications", success: false },
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
