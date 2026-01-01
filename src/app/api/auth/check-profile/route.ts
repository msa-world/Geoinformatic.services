import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ exists: false, message: "Missing userId" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: profile, error } = await supabase.from("profiles").select("id,email,full_name,role").eq("id", userId).single()

    if (error && error.code === "PGRST116") {
      // table not found or similar - return exists false
      return NextResponse.json({ exists: false, profile: null })
    }

    if (profile) {
      return NextResponse.json({ exists: true, profile })
    }

    return NextResponse.json({ exists: false, profile: null })
  } catch (err) {
    console.error("[MSA] check-profile error", err)
    return NextResponse.json({ exists: false, profile: null })
  }
}
