"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { getUserOnce } from "@/lib/supabase/auth-client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import HeaderNavigation from "@/components/sections/header-navigation"
import Footer from "@/components/sections/footer"
import { AlertCircle, CheckCircle, Upload } from "lucide-react"

export default function DocumentsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await getUserOnce()
        if (!user) {
          router.push("/auth/login")
          return
        }

        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        setProfile(profileData)
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "cv_url" | "avatar_url") => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("field", field)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json()

        if (error.code === "BUCKET_NOT_FOUND") {
          throw new Error(
            "Storage is not initialized. Please contact an administrator to set up storage at /admin/setup",
          )
        }

        throw new Error(error.error || "Upload failed")
      }

      const data = await res.json()

      const user = await getUserOnce()
      if (user) {
        const { data: updatedProfile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
        setProfile(updatedProfile)
      }

      setMessage({ type: "success", text: `${field === "cv_url" ? "CV" : "Avatar"} uploaded successfully` })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error("Error uploading file:", error)
      const errorMsg = error instanceof Error ? error.message : "Unknown error"
      setMessage({
        type: "error",
        text: `Failed to upload file: ${errorMsg}`,
      })
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <p className="text-gray-500">Loading documents...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full">
      <HeaderNavigation />
      <main className="w-full py-20">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-8">Upload Documents</h1>

          {message && (
            <div
              className={`flex items-start gap-3 p-4 rounded-lg mb-6 ${
                message.type === "success" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
                {message.text}
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Avatar Upload */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Profile Photo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile?.avatar_url ? (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                    <img
                      src={profile.avatar_url || "/placeholder.svg"}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                    <p className="text-gray-500 text-sm">No photo uploaded</p>
                  </div>
                )}
                <label className="block">
                  <Button disabled={isUploading} className="w-full" asChild>
                    <span className="cursor-pointer gap-2">
                      <Upload className="h-4 w-4" />
                      {isUploading ? "Uploading..." : "Upload Photo"}
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "avatar_url")}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              </CardContent>
            </Card>

            {/* CV Upload */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">CV/Resume</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile?.cv_url ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">CV uploaded</p>
                    <a
                      href={profile.cv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline mt-2 block"
                    >
                      View CV
                    </a>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500 text-sm">No CV uploaded</p>
                  </div>
                )}
                <label className="block">
                  <Button disabled={isUploading} className="w-full" asChild>
                    <span className="cursor-pointer gap-2">
                      <Upload className="h-4 w-4" />
                      {isUploading ? "Uploading..." : "Upload CV"}
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileUpload(e, "cv_url")}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
