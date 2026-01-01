"use client"

import { useRef, useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Send, X, Menu, ChevronLeft, Search, MessageSquare, Ban, BellOff, Bell, MoreVertical, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { toast } from "sonner"

interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  unread_count: number
  is_blocked?: boolean
  is_muted?: boolean
}

interface Message {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  // file_url: string | null // Removed as per request
  // file_name: string | null // Removed as per request
  sender_type: "admin" | "user"
  created_at: string
  deleted_for_admin?: boolean
}

function ChatContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialUserId = searchParams.get("userId")

  const supabase = createClient()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(initialUserId)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const messageContainerRef = useRef<HTMLDivElement | null>(null)

  // Real-time presence state
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    const checkAdmin = () => {
      const adminToken = localStorage.getItem("adminToken")
      const adminUsername = localStorage.getItem("adminUsername")

      if (!adminToken || !adminUsername) {
        router.push("/auth/admin-login")
        return
      }

      fetchUsers()
    }

    checkAdmin()
  }, [])

  // Real-time listener for unread count and presence
  useEffect(() => {
    // Presence Subscription
    const presenceChannel = supabase.channel('online-users')
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState()
        const onlineIds = new Set<string>()
        for (const key in newState) {
          // @ts-ignore
          newState[key].forEach((presence: any) => {
            if (presence.user_id) onlineIds.add(presence.user_id)
          })
        }
        setOnlineUsers(onlineIds)
      })
      .subscribe()

    // Global message listener
    const messageChannel = supabase
      .channel("global-chat-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: "recipient_id=eq.admin",
        },
        () => {
          fetchUsersSilently()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messageChannel)
      supabase.removeChannel(presenceChannel)
    }
  }, [])

  useEffect(() => {
    let result = users

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      result = users.filter(
        (user) =>
          (user.full_name || "").toLowerCase().includes(query) ||
          (user.email || "").toLowerCase().includes(query),
      )
    }

    // Sort: Online First -> Unread -> Recent
    result.sort((a, b) => {
      const aOnline = onlineUsers.has(a.id)
      const bOnline = onlineUsers.has(b.id)
      if (aOnline && !bOnline) return -1
      if (!aOnline && bOnline) return 1

      const aUnread = (a.unread_count || 0) > 0
      const bUnread = (b.unread_count || 0) > 0
      if (aUnread && !bUnread) return -1
      if (!aUnread && bUnread) return 1

      // Default to existing order (which is by last_message_at from API)
      return 0
    })

    setFilteredUsers([...result])
  }, [searchQuery, users, onlineUsers])

  useEffect(() => {
    if (selectedUserId) {
      fetchMessages(selectedUserId)
      markAsRead(selectedUserId)

      const channel = supabase
        .channel(`active-chat-${selectedUserId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
            filter: `or(and(sender_id.eq.${selectedUserId},recipient_id.eq.admin),and(sender_id.eq.admin,recipient_id.eq.${selectedUserId}))`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              fetchMessages(selectedUserId)
              markAsRead(selectedUserId)
            }
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedUserId])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const adminToken = localStorage.getItem("adminToken")
      const response = await fetch("/api/admin/get-users", {
        headers: {
          "x-admin-token": adminToken || "",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      const { users: data } = await response.json()
      setUsers(data || [])
      // setFilteredUsers will be handled by useEffect

      if (initialUserId) {
        setSelectedUserId(initialUserId)
      } else if (data && data.length > 0 && !selectedUserId) {
        setSelectedUserId(data[0].id)
      }
    } catch (err) {
      console.error("[v0] Error fetching users:", err)
      setError("Failed to load users.")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsersSilently = async () => {
    try {
      const adminToken = localStorage.getItem("adminToken")
      const response = await fetch("/api/admin/get-users", {
        headers: {
          "x-admin-token": adminToken || "",
        },
      })
      if (response.ok) {
        const { users: data } = await response.json()
        setUsers(data || [])
      }
    } catch (err) {
      console.error("Silent fetch error:", err)
    }
  }

  const fetchMessages = async (userId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${userId},recipient_id.eq.admin),and(sender_id.eq.admin,recipient_id.eq.${userId})`)
        .order("created_at", { ascending: true })

      if (fetchError) throw fetchError
      setMessages((data || []).filter((m: Message) => !m.deleted_for_admin))
    } catch (err) {
      console.error("[v0] Error fetching messages:", err)
      setError("Failed to load messages")
    }
  }

  const handleDeleteMessage = async (messageId: string, type: 'everyone' | 'me') => {
    try {
      const token = localStorage.getItem("adminToken")
      const res = await fetch("/api/admin/delete-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token || ""
        },
        body: JSON.stringify({ messageId, type })
      })

      if (!res.ok) throw new Error("Failed to delete")

      if (type === 'everyone') {
        setMessages(prev => prev.filter(m => m.id !== messageId))
        toast.success("Message deleted for everyone")
      } else {
        setMessages(prev => prev.filter(m => m.id !== messageId))
        toast.success("Message deleted for you")
      }
    } catch (error) {
      toast.error("Failed to delete message")
    }
  }

  const markAsRead = async (userId: string) => {
    try {
      const token = localStorage.getItem("adminToken")
      await fetch("/api/admin/mark-messages-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token || "",
        },
        body: JSON.stringify({ userId }),
      })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, unread_count: 0 } : u))
    } catch (err) {
      console.error("[Chat] Error in markAsRead:", err)
    }
  }

  const handleSendMessage = async () => {
    if ((!messageText.trim()) || !selectedUserId) return

    // Check if blocked locally first for immediate feedback
    const currentUser = users.find(u => u.id === selectedUserId);
    if (currentUser?.is_blocked) {
      toast.error("This user is blocked. Unblock to send messages.");
      return;
    }

    try {
      setIsSending(true)
      const adminToken = localStorage.getItem("adminToken")

      const response = await fetch("/api/admin/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken || "",
        },
        body: JSON.stringify({
          userId: selectedUserId,
          message: messageText,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.message || "Failed to send message")
        // If the error was due to block, refresh user to get latest state
        if (data.message?.includes("blocked")) fetchUsersSilently();
        return
      }

      setMessageText("")
      setError("")
      fetchMessages(selectedUserId)
    } catch (err) {
      console.error("[v0] Error sending message:", err)
      setError("Failed to send message")
    } finally {
      setIsSending(false)
    }
  }

  const toggleBlock = async (userId: string, currentStatus: boolean) => {
    try {
      const adminToken = localStorage.getItem("adminToken")
      const response = await fetch("/api/admin/toggle-block", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken || "" },
        body: JSON.stringify({ userId, isBlocked: !currentStatus })
      });

      if (response.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_blocked: !currentStatus } : u))
        toast.success(currentStatus ? "User unblocked" : "User blocked");
      }
    } catch (e) {
      toast.error("Failed to update block status");
    }
  }

  const toggleMute = async (userId: string, currentStatus: boolean) => {
    try {
      const adminToken = localStorage.getItem("adminToken")
      const response = await fetch("/api/admin/toggle-mute", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken || "" },
        body: JSON.stringify({ userId, isMuted: !currentStatus })
      });

      if (response.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_muted: !currentStatus } : u))
        toast.success(currentStatus ? "User unmuted" : "User muted");
      }
    } catch (e) {
      toast.error("Failed to update mute status");
    }
  }


  useEffect(() => {
    if (messageContainerRef.current) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        if (messageContainerRef.current) {
          messageContainerRef.current.scrollTo({
            top: messageContainerRef.current.scrollHeight,
            behavior: "smooth"
          })
        }
      }, 100)
    }
  }, [messages])

  if (isLoading) {
    return (
      <div className="flex-1 flex overflow-hidden min-h-0 h-full">
        {/* Sidebar Skeleton */}
        <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col h-full z-10 md:relative">
          <div className="p-4 border-b bg-white flex-shrink-0">
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-4 border-l-4 border-transparent">
                <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Main Chat Skeleton (Hidden on mobile initially or just empty placeholder) */}
        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="w-24 h-24 rounded-[2.5rem]" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </div>
    )
  }

  const selectedUser = users.find((u) => u.id === selectedUserId)
  const isSelectedUserOnline = selectedUserId && onlineUsers.has(selectedUserId)

  return (
    <div className="flex-1 flex overflow-hidden min-h-0 h-full">
      {/* Sidebar - Users List */}
      <div
        className={`${sidebarOpen ? "w-full" : "hidden"} md:w-80 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-10 md:z-0 md:relative md:block h-full min-h-0`}
      >
        {/* Search Bar */}
        <div className="p-4 border-b bg-white flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pb-4 custom-scrollbar">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="h-6 w-6 text-gray-300" />
              </div>
              <p className="text-sm text-muted-foreground">{searchQuery ? "No users found" : "No users available"}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    setSelectedUserId(user.id)
                    setSidebarOpen(false)
                  }}
                  className={`w-full text-left px-4 py-4 border-l-4 transition-all hover:bg-gray-50/80 ${selectedUserId === user.id
                    ? "bg-primary/5 border-primary shadow-inner"
                    : "border-transparent hover:border-gray-200"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.full_name}
                          className="w-12 h-12 rounded-full object-cover border border-gray-100"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-base font-bold">
                          {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Presence Indicator */}
                      {onlineUsers.has(user.id) && (
                        <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
                      )}

                      {user.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white">
                          {user.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold truncate text-gray-900">{user.full_name || "User"}</p>
                          {user.is_muted && <BellOff className="h-3 w-3 text-gray-400" />}
                          {user.is_blocked && <Ban className="h-3 w-3 text-red-500" />}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 truncate font-medium">{user.email}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`${selectedUserId ? "flex" : "hidden"} md:flex md:flex-1 flex-col w-full bg-white h-full overflow-hidden`}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b p-4 flex items-center justify-between shadow-sm z-10 flex-shrink-0">
              <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 hover:bg-black/5 rounded-full transition-colors">
                  <ChevronLeft className="h-6 w-6 text-gray-600" />
                </button>
                <div className="relative">
                  {selectedUser.avatar_url ? (
                    <img
                      src={selectedUser.avatar_url}
                      alt={selectedUser.full_name}
                      className="w-10 h-10 rounded-full object-cover shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base border border-primary/20">
                      {selectedUser.full_name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                  {isSelectedUserOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 leading-tight flex items-center gap-2">
                    {selectedUser.full_name}
                    {selectedUser.is_blocked && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Blocked</span>}
                  </h2>
                  <p className={`text-xs font-semibold tracking-wide ${isSelectedUserOnline ? "text-green-600" : "text-gray-400"}`}>
                    {isSelectedUserOnline ? "Active now" : "Offline"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-gray-500 hover:text-gray-900"
                  title={selectedUser.is_muted ? "Unmute Notifications" : "Mute Notifications"}
                  onClick={() => toggleMute(selectedUser.id, !!selectedUser.is_muted)}
                >
                  {selectedUser.is_muted ? <BellOff className="h-5 w-5 text-orange-500" /> : <Bell className="h-5 w-5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-gray-500 hover:text-red-600"
                  title={selectedUser.is_blocked ? "Unblock User" : "Block User"}
                  onClick={() => toggleBlock(selectedUser.id, !!selectedUser.is_blocked)}
                >
                  <Ban className={`h-5 w-5 ${selectedUser.is_blocked ? "text-red-500 fill-current" : ""}`} />
                </Button>
                <Link href={`/admin/user/${selectedUserId}`}>
                  <Button variant="default" size="sm" className="h-9 px-4 rounded-lg font-semibold shadow-md hover:bg-primary/90 transition-all">
                    View Profile
                  </Button>
                </Link>
              </div>
            </div>

            {/* Messages Area - Independent Scrolling */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 scroll-smooth" ref={messageContainerRef}>
              {error && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 shadow-sm transition-all animate-in fade-in slide-in-from-top-4 sticky top-0 z-10">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                  <button onClick={() => setError("")} className="ml-auto hover:bg-red-100 p-1 rounded-full"><X className="h-4 w-4" /></button>
                </div>
              )}

              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-40">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 rotate-12">
                    <MessageSquare className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium tracking-tight">Send a welcome message to {selectedUser.full_name?.split(' ')[0]}!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === "admin" ? "justify-end" : "justify-start"} group relative`}
                    >
                      {/* Delete Menu Trigger (Only shows on hover) */}
                      <div className={`absolute top-2 ${msg.sender_type === "admin" ? "left-0 -ml-8" : "right-0 -mr-8"} opacity-0 group-hover:opacity-100 transition-opacity`}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-gray-100">
                              <MoreVertical className="h-3 w-3 text-gray-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={msg.sender_type === "admin" ? "end" : "start"}>
                            <DropdownMenuItem onClick={() => handleDeleteMessage(msg.id, 'me')} className="text-xs text-slate-600 gap-2 cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" /> Delete for me
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteMessage(msg.id, 'everyone')} className="text-xs text-red-600 gap-2 cursor-pointer focus:text-red-700 focus:bg-red-50">
                              <Trash2 className="w-3.5 h-3.5" /> Delete for everyone
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div
                        className={cn(
                          "max-w-[75%] lg:max-w-[65%] px-4 py-2.5 shadow-sm transition-all hover:shadow-md relative z-10",
                          msg.sender_type === "admin"
                            ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-none"
                            : "bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-none"
                        )}
                      >
                        <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <div className={cn(
                          "flex items-center justify-end gap-1 mt-1 opacity-70",
                          msg.sender_type === "admin" ? "text-primary-foreground" : "text-gray-400"
                        )}>
                          <span className="text-[9px] font-bold tracking-widest uppercase">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Input Area - Fixed Bottom */}
            <div className="bg-white border-t p-5 space-y-4 shadow-[0_-4px_24px_-12px_rgba(0,0,0,0.1)] flex-shrink-0 z-10">
              <div className="flex items-end gap-3">
                <Textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={selectedUser.is_blocked ? "Unblock user to send a message..." : "Type your message..."}
                  disabled={!!selectedUser.is_blocked}
                  rows={1}
                  className="min-h-[44px] max-h-32 resize-none rounded-2xl bg-gray-50/50 border-gray-200 focus-visible:ring-primary/20 py-3 px-4 text-sm font-medium disabled:bg-gray-100 disabled:text-gray-400"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      if (!selectedUser.is_blocked) handleSendMessage()
                    }
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isSending || !messageText.trim() || !!selectedUser.is_blocked}
                  className={cn(
                    "h-11 px-6 rounded-2xl shadow-lg transition-all hover:scale-[1.02] active:scale-95",
                    !messageText.trim() || !!selectedUser.is_blocked ? "opacity-100 bg-gray-200 text-gray-400 shadow-none hover:scale-100" : "bg-primary text-primary-foreground shadow-primary/20"
                  )}
                >
                  <Send className="h-5 w-5 mr-2" />
                  <span className="font-bold text-sm">Send</span>
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50 text-center h-full">
            <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl shadow-black/5 flex items-center justify-center mb-6 border border-gray-100">
              <MessageSquare className="h-10 w-10 text-primary animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Select a Customer</h3>
            <p className="text-gray-500 max-w-xs font-medium leading-relaxed">Choose someone from the list to start answering their technical inquiries.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function AdminChatPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-gray-50 h-full w-full">Loading...</div>}>
      <ChatContent />
    </Suspense>
  )
}

export default AdminChatPage
