"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Send } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getUserOnce } from "@/lib/supabase/auth-client"
import HeaderNavigation from "@/components/sections/header-navigation"
import Footer from "@/components/sections/footer"

interface Message {
  id: string
  sender_id: string
  content: string
  sender_type: string
  created_at: string
  is_read: boolean
}

interface Notification {
  id: string
  message_id: string
  is_read: boolean
  messages: Message
  created_at: string
}

export default function NotificationsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [replyMessage, setReplyMessage] = useState<{ [key: string]: string }>({})
  const [isSending, setIsSending] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getUserOnce()
        if (!user) {
          router.push("/auth/login")
          return
        }

        fetchNotifications(user.id)
      } catch (err) {
        console.error("[MSA] Auth error:", err)
      }
    }

    checkAuth()
  }, [])

  const fetchNotifications = async (userId: string) => {
    try {
      setIsLoading(true)
      const { data, error: fetchError } = await supabase
        .from("notifications")
        .select("*, messages(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError
      setNotifications(data || [])
    } catch (err) {
      console.error("[MSA] Error fetching notifications:", err)
      setError("Failed to load notifications")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReply = async (notificationId: string) => {
    const message = replyMessage[notificationId]?.trim()
    if (!message) return

    try {
      setIsSending((prev) => ({ ...prev, [notificationId]: true }))

      const user = await getUserOnce()
      if (!user) throw new Error("Not authenticated")

      const { error: replyError } = await supabase.from("messages").insert({
        sender_id: user.id,
        recipient_id: "admin",
        sender_type: "user",
        content: message,
      })

      if (replyError) throw replyError

      setReplyMessage((prev) => ({
        ...prev,
        [notificationId]: "",
      }))

      alert("Reply sent successfully!")
    } catch (err) {
      console.error("[MSA] Error sending reply:", err)
      setError("Failed to send reply")
    } finally {
      setIsSending((prev) => ({ ...prev, [notificationId]: false }))
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <p className="text-gray-500">Loading notifications...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full">
      <HeaderNavigation />
      <main className="w-full py-20">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">Messages</h1>
          <p className="text-muted-foreground mb-8">View and respond to admin messages</p>

          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {notifications.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No messages from admin yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <Card key={notification.id} className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg">Message from Admin</CardTitle>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notification.messages.created_at).toLocaleString()}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-800">{notification.messages.content}</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Reply</label>
                      <Textarea
                        value={replyMessage[notification.id] || ""}
                        onChange={(e) =>
                          setReplyMessage((prev) => ({
                            ...prev,
                            [notification.id]: e.target.value,
                          }))
                        }
                        placeholder="Type your reply..."
                        rows={3}
                        className="resize-none"
                      />
                      <Button
                        onClick={() => handleReply(notification.id)}
                        disabled={isSending[notification.id] || !replyMessage[notification.id]?.trim()}
                        className="w-full gap-2"
                      >
                        <Send className="h-4 w-4" />
                        {isSending[notification.id] ? "Sending..." : "Send Reply"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
