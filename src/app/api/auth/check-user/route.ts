import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body?.email;
    if (!email) {
      return NextResponse.json({ exists: false, message: "Missing email" }, { status: 400 });
    }

    const supabase = await createClient();

    // Check profiles table for existing email
    const { data: profile, error } = await supabase.from("profiles").select("id,email").eq("email", email).maybeSingle();

    if (error) {
      console.error("[MSA] check-user supabase error:", error);
      return NextResponse.json({ exists: false, message: "Error checking user" }, { status: 500 });
    }

    if (profile) {
      return NextResponse.json({ exists: true });
    }

    // As a fallback, check auth.users via admin key is not available here; assume not exists
    return NextResponse.json({ exists: false });
  } catch (err) {
    console.error("[MSA] check-user unexpected error:", err);
    return NextResponse.json({ exists: false, message: "Unexpected error" }, { status: 500 });
  }
}
