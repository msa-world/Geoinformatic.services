"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { getUserOnce } from "@/lib/supabase/auth-client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import HeaderNavigation from "@/components/sections/header-navigation"
import Footer from "@/components/sections/footer"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUserOnce()
        if (!userData) {
          router.push("/auth/login")
          return
        }
        setUser(userData)
      } catch (error) {
        console.error("Error fetching user:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [])

  const handleChangePassword = async () => {
    // This would typically open a modal or navigate to a password change form
    router.push("/auth/forgot-password")
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return
    }

    try {
      const { error } = await supabase.auth.admin.deleteUser(user?.id || "")
      if (error) throw error

      await supabase.auth.signOut()
      setMessage({ type: "success", text: "Account deleted successfully" })
      setTimeout(() => router.push("/"), 2000)
    } catch (error) {
      console.error("Error deleting account:", error)
      setMessage({ type: "error", text: "Failed to delete account" })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <p className="text-gray-500">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full">
      <HeaderNavigation />
      <main className="w-full py-20">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-8">Account Settings</h1>

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

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Email Address</p>
                <p className="font-semibold text-text-primary">{user?.email}</p>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-text-primary mb-4">Security</h3>
                <Button
                  onClick={handleChangePassword}
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                >
                  Change Password
                </Button>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-red-600 mb-4">Warning..!</h3>
                <Button onClick={handleDeleteAccount} variant="destructive" className="w-full">
                  Delete Account
                </Button>
                <p className="text-xs text-gray-500 mt-2">This action cannot be undone</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
