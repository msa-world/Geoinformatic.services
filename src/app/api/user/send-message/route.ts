import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const {
      data: { user },
    } = await request.json()

    if (!user?.id) {
      return NextResponse.json(
        { message: "Unauthorized", success: false },
        { status: 401, headers: { "Content-Type": "application/json" } },
      )
    }

    const { message, file_url, file_name } = await request.json()
    const adminSupabase = createAdminClient()

    const { data: messageData, error: messageError } = await adminSupabase
      .from("messages")
      .insert({
        sender_id: user.id,
        recipient_id: "admin",
        sender_type: "user",
        content: message,
        file_url: file_url || null,
        file_name: file_name || null,
      })
      .select()
      .single()

    if (messageError) throw messageError

    if (messageData) {
      await adminSupabase.from("notifications").insert({
        user_id: user.id,
        message_id: messageData.id,
      })
    }

    console.log("[MSA] User message sent by:", user.id)

    return NextResponse.json(
      { message: "Message sent successfully", success: true },
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error("[MSA] User send message error:", error)
    return NextResponse.json(
      { message: "Failed to send message", success: false },
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
