import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Return safe, non-secret diagnostics: project URL from env and a sample of profiles
    const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || null

    const { count, error: countError } = await supabase.from("profiles").select("id", { count: "exact", head: true })
    if (countError) {
      console.error("[MSA] Debug: error counting profiles", countError)
    }

    const { data: sample, error: sampleError } = await supabase.from("profiles").select("id,email,full_name").limit(10)
    if (sampleError) {
      console.error("[MSA] Debug: error sampling profiles", sampleError)
    }

    return NextResponse.json({ success: true, projectUrl, profilesCount: count ?? null, sample: sample ?? [] })
  } catch (err) {
    console.error("[MSA] Debug error:", err)
    return NextResponse.json({ success: false, message: "Debug failed" }, { status: 500 })
  }
}
