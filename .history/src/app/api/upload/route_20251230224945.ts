import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { getServerUser } from "@/lib/supabase/server-auth"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated (use cached server helper)
    const serverSupabase = await createClient()
    const user = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const field = formData.get("field") as "avatar_url" | "cv_url"

    if (!file || !field) {
      return NextResponse.json({ error: "Missing file or field" }, { status: 400 })
    }

    const adminSupabase = createAdminClient()
    const userFolder = user.id
    const fileName = `${userFolder}/${field}-${Date.now()}-${file.name.split(".").pop()}`

    const buffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await adminSupabase.storage
      .from("profiles")
      .upload(fileName, buffer, { contentType: file.type, upsert: true })

    if (uploadError) {
      console.error("[MSA] Upload error:", uploadError)

      if (uploadError.message.includes("not found") || uploadError.message.includes("Bucket")) {
        return NextResponse.json(
          {
            error: "Storage bucket not initialized. Please visit /admin/setup to initialize storage.",
            code: "BUCKET_NOT_FOUND",
          },
          { status: 400 },
        )
      }

      return NextResponse.json({ error: uploadError.message }, { status: 400 })
    }

    // Get public URL
    const { data: urlData } = adminSupabase.storage.from("profiles").getPublicUrl(fileName)
    const publicUrl = urlData.publicUrl

    // Update profile with server client
    const { error: updateError } = await serverSupabase
      .from("profiles")
      .update({ [field]: publicUrl })
      .eq("id", user.id)

    if (updateError) {
      console.error("[MSA] Update error:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
    })
  } catch (error) {
    console.error("[MSA] Upload route error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 500 })
  }
}
