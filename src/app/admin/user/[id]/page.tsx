"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, CheckCircle, LogOut, Send, Download, X, HardDrive } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: string
  phone_number: string
  company: string
  location: string
  bio: string
  avatar_url: string
  cv_url: string
  created_at: string
}

export default function AdminUserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const checkAdmin = () => {
      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        router.push("/auth/admin-login")
        return
      }

      fetchUserProfile(userId)
    }

    checkAdmin()
  }, [userId])

  const fetchUserProfile = async (profileId: string) => {
    try {
      setIsLoading(true)
      const adminToken = localStorage.getItem("adminToken")

      const response = await fetch("/api/admin/get-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken || "",
        },
        body: JSON.stringify({ userId: profileId }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch user")
      }

      if (data.user) {
        setUser(data.user)
      } else {
        setError("User not found")
      }
    } catch (err) {
      console.error("[v0] Error fetching user:", err)
      setError("Failed to load user profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim() || !user) return

    setIsSending(true)
    setError("")

    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch("/api/admin/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token || "",
        },
        body: JSON.stringify({
          userId: user.id,
          message: message.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to send message")
      }

      setSuccess("Message sent successfully!")
      setMessage("")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("[v0] Error sending message:", err)
      setError(err instanceof Error ? err.message : "Failed to send message")
    } finally {
      setIsSending(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("adminToken")
    localStorage.removeItem("adminUsername")
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <p className="text-gray-500">Loading user profile...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">User Profile Not Found</h2>
          <p className="text-gray-500 mb-6">{error || "Could not fetch user details."}</p>

          <div className="flex flex-col gap-3">
            <Button onClick={() => fetchUserProfile(userId)} variant="outline">
              Retry
            </Button>
            <Link href={`/admin/user/${userId}/drive`} target="_blank">
              <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                <HardDrive className="h-4 w-4" />
                Force View User Drive
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="ghost" className="w-full">
                Back to Users
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/users">
              <Button variant="outline" className="gap-2 bg-transparent">
                <X className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-text-primary">User Details</h1>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="gap-2 bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url || "/placeholder.svg"}
                      alt={user.full_name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 font-bold">{user.full_name?.charAt(0) || "U"}</span>
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold">{user.full_name || "No name"}</h2>
                    <p className="text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="font-semibold">{user.role || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Company</p>
                    <p className="font-semibold">{user.company || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-semibold">{user.phone_number || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-semibold">{user.location || "-"}</p>
                  </div>
                </div>

                {user.bio && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Bio</p>
                    <p className="text-sm">{user.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Documents & Drive</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {user.cv_url ? (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <p className="text-sm font-semibold text-blue-900">CV/Resume</p>
                      <p className="text-xs text-blue-700">Available for download</p>
                    </div>
                    <a href={user.cv_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No CV uploaded</p>
                )}

                <div className="pt-4 border-t mt-4">
                  <h4 className="text-sm font-semibold mb-2">Google Drive Access</h4>
                  <Link href={`/admin/user/${user.id}/drive`} target="_blank">
                    <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                      <HardDrive className="h-4 w-4" />
                      View User Drive
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Send Message Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Send Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                rows={6}
                className="resize-none"
              />
              <Button onClick={handleSendMessage} disabled={isSending || !message.trim()} className="w-full gap-2">
                <Send className="h-4 w-4" />
                {isSending ? "Sending..." : "Send Message"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
