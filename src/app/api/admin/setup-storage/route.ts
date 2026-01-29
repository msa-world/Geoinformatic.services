import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const adminSupabase = createAdminClient()

    const { data: buckets, error: listError } = await adminSupabase.storage.listBuckets()

    if (listError) {
      console.error("[MSA] Error listing buckets:", listError)
      return NextResponse.json({ message: "Failed to check buckets" }, { status: 500 })
    }

    const bucketExists = buckets?.some((b) => b.name === "profiles")

    if (!bucketExists) {
      const { error: createError } = await adminSupabase.storage.createBucket("profiles", {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
      })

      if (createError && !createError.message.includes("already exists")) {
        console.error("[MSA] Error creating bucket:", createError)
        throw new Error("Failed to create storage bucket")
      }
    }

    console.log("[MSA] Storage bucket initialized successfully")

    return NextResponse.json({
      success: true,
      message: "Storage bucket initialized successfully",
    })
  } catch (error) {
    console.error("[MSA] Setup storage error:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to initialize storage" },
      { status: 500 },
    )
  }
}
