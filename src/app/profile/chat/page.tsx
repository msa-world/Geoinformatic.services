"use client"

import type React from "react"
import { useRef } from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Send, MessageSquare, Upload, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getUserOnce } from "@/lib/supabase/auth-client"
import HeaderNavigation from "@/components/sections/header-navigation"
import Footer from "@/components/sections/footer"

interface Message {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  file_url: string | null
  file_name: string | null
  sender_type: "admin" | "user"
  created_at: string
}

export default function UserChatPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState("")
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null)
  const messageContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getUserOnce()
        if (!user) {
          router.push("/auth/login")
          return
        }

        setUserId(user.id)
        fetchMessages(user.id)

        const channel = supabase
          .channel(`user-messages-${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "messages",
              filter: `or(and(sender_id=eq.${user.id},recipient_id=eq.admin),and(sender_id=eq.admin,recipient_id=eq.${user.id}))`,
            },
            () => {
              fetchMessages(user.id)
            },
          )
          .subscribe()

        return () => {
          supabase.removeChannel(channel)
        }
      } catch (err) {
        console.error("[MSA] Error:", err)
        setError("Failed to load chat")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [])

  const fetchMessages = async (uid: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${uid},recipient_id.eq.admin),and(sender_id.eq.admin,recipient_id.eq.${uid})`)
        .order("created_at", { ascending: true })

      if (fetchError) {
        console.error("[MSA] Query error:", fetchError)
        // Fallback: fetch all messages and filter locally
        const { data: allData } = await supabase.from("messages").select("*").order("created_at", { ascending: true })

        const filtered = (allData || []).filter(
          (msg: any) =>
            (msg.sender_id === uid && msg.recipient_id === "admin") ||
            (msg.sender_id === "admin" && msg.recipient_id === uid),
        )
        setMessages(filtered)
      } else {
        setMessages(data || [])
      }
    } catch (err) {
      console.error("[MSA] Error fetching messages:", err)
      setError("Failed to load messages")
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    try {
      const fileName = `${userId}-${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from("profiles").upload(`chat/${fileName}`, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from("profiles").getPublicUrl(`chat/${fileName}`)
      setUploadedFile({ name: file.name, url: data.publicUrl })
    } catch (err) {
      console.error("[MSA] Upload error:", err)
      setError("Failed to upload file")
    }
  }

  const handleSendMessage = async () => {
    if ((!messageText.trim() && !uploadedFile) || !userId) return

    try {
      setIsSending(true)

      const { error: insertError } = await supabase.from("messages").insert({
        sender_id: userId,
        recipient_id: "admin",
        content: messageText || `📎 ${uploadedFile?.name}`,
        file_url: uploadedFile?.url || null,
        file_name: uploadedFile?.name || null,
        sender_type: "user",
      })

      if (insertError) {
        console.error("[MSA] Insert error:", insertError)
        const response = await fetch("/api/user/send-message", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user: { id: userId },
            message: messageText || `📎 ${uploadedFile?.name}`,
            file_url: uploadedFile?.url || null,
            file_name: uploadedFile?.name || null,
          }),
        })

        if (!response.ok) throw new Error("Failed to send message")
      }

      setMessageText("")
      setUploadedFile(null)
      fetchMessages(userId)
    } catch (err) {
      console.error("[MSA] Error sending message:", err)
      setError("Failed to send message")
    } finally {
      setIsSending(false)
    }
  }

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight
    }
  }, [messages])

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <p className="text-gray-500">Loading chat...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full">
      <HeaderNavigation />
      <main className="w-full py-20">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="flex items-center gap-3 mb-8">
            <MessageSquare className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-text-primary">Chat with Admin</h1>
              <p className="text-muted-foreground">Send and receive messages</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Messages */}
          <Card className="shadow-lg mb-6 h-96 overflow-hidden flex flex-col">
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" ref={messageContainerRef}>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs px-4 py-3 rounded-lg ${msg.sender_type === "user"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                      }`}
                  >
                    <p className="text-sm break-words">{msg.content}</p>
                    {msg.file_url && (
                      <a
                        href={msg.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs underline mt-2 block hover:opacity-80"
                      >
                        📎 {msg.file_name || "Download"}
                      </a>
                    )}
                    <p className={`text-xs mt-1 ${msg.sender_type === "user" ? "text-blue-100" : "text-gray-500"}`}>
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No messages yet. Start a conversation!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Input with file upload */}
          <Card className="shadow-lg">
            <CardContent className="p-4">
              {uploadedFile && (
                <div className="mb-3 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                  <span className="text-sm">📎 {uploadedFile.name}</span>
                  <button onClick={() => setUploadedFile(null)}>
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              )}
              <div className="flex gap-3">
                <Textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..."
                  rows={3}
                  className="resize-none"
                />
                <div className="flex flex-col gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx"
                    />
                    <Button type="button" variant="outline" size="icon" className="h-full bg-transparent">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </label>
                  <Button
                    onClick={handleSendMessage}
                    disabled={isSending || (!messageText.trim() && !uploadedFile)}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
