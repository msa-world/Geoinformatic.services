import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId, message, file_url, file_name } = await request.json()
    const adminToken = request.headers.get("x-admin-token")

    if (!adminToken || !userId || !message) {
      return NextResponse.json(
        { message: "Unauthorized or missing required fields", success: false },
        { status: 401, headers: { "Content-Type": "application/json" } },
      )
    }

    const adminSupabase = createAdminClient()

    // Create message record
    const { data: messageData, error: messageError } = await adminSupabase
      .from("messages")
      .insert({
        sender_id: "admin",
        recipient_id: userId,
        sender_type: "admin",
        content: message,
        file_url: file_url || null,
        file_name: file_name || null,
      })
      .select()
      .single()

    if (messageError) throw messageError

    // Create notification for user
    if (messageData) {
      await adminSupabase.from("notifications").insert({
        user_id: userId,
        message_id: messageData.id,
      })
    }

    console.log("[MSA] Message sent to user:", userId)

    return NextResponse.json(
      { message: "Message sent successfully", success: true },
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error("[MSA] Send message error:", error)
    return NextResponse.json(
      { message: "Failed to send message", success: false },
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
