"use client"

import { useState } from "react"
import { createAdminClient } from "@/lib/supabase/admin"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader } from "lucide-react"

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{
    type: "success" | "error" | "info"
    message: string
  } | null>(null)

  const initializeStorage = async () => {
    setLoading(true)
    setStatus(null)

    try {
      const adminClient = createAdminClient()

      // Create the profiles bucket
      const { data: existingBuckets } = await adminClient.storage.listBuckets()
      const bucketExists = existingBuckets?.some((b) => b.name === "profiles")

      if (!bucketExists) {
        const { error: bucketError } = await adminClient.storage.createBucket("profiles", {
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

        if (bucketError) {
          throw new Error(`Failed to create bucket: ${bucketError.message}`)
        }

        setStatus({
          type: "success",
          message: "Storage bucket 'profiles' created successfully!",
        })
      } else {
        setStatus({
          type: "info",
          message: "Storage bucket 'profiles' already exists.",
        })
      }
    } catch (error) {
      console.error("[v0] Setup error:", error)
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Setup failed",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Storage Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-600">
              Initialize the storage bucket for user uploads (avatars and CVs). This needs to be done once during setup.
            </p>

            {status && (
              <Alert
                className={
                  status.type === "success"
                    ? "border-green-200 bg-green-50"
                    : status.type === "error"
                      ? "border-red-200 bg-red-50"
                      : "border-blue-200 bg-blue-50"
                }
              >
                <div className="flex gap-2">
                  {status.type === "success" ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : status.type === "error" ? (
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  )}
                  <AlertDescription className={status.type === "error" ? "text-red-700" : ""}>
                    {status.message}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            <Button onClick={initializeStorage} disabled={loading} className="w-full gap-2">
              {loading && <Loader className="h-4 w-4 animate-spin" />}
              {loading ? "Initializing..." : "Initialize Storage"}
            </Button>

            <div className="text-sm text-gray-600 space-y-2">
              <p className="font-semibold">What this does:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Creates a 'profiles' storage bucket</li>
                <li>Sets file size limit to 50MB</li>
                <li>Enables uploads for images and documents</li>
                <li>Makes files publicly accessible</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
