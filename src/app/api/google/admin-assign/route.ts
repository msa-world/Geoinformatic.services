import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, title, link } = body || {}
    if (!userId || !link) return NextResponse.json({ success: false, message: "userId and link required" }, { status: 400 })

    const supabase = createAdminClient()

    // Insert a notification row so the user sees the assignment
    await supabase.from("notifications").insert({
      user_id: userId,
      message_id: link,
      is_read: false,
    })

    // Optionally, store an assignment mapping in a table (not implemented here)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[MSA] admin assign error", err)
    return NextResponse.json({ success: false, message: "Failed to assign" }, { status: 500 })
  }
}
