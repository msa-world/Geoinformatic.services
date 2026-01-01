"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { AlertCircle, Trash2, Eye, MessageSquare, CheckCircle, Search, X, LayoutGrid, List, MoreHorizontal, User as UserIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: string
  phone_number: string
  company: string
  location: string
  avatar_url?: string | null
  created_at: string
  google_connected_at?: string | null
  unread_count?: number
}

export default function AdminUsersPage() {
  const router = useRouter()
  const supabase = createClient()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    const checkAdmin = () => {
      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        router.push("/auth/admin-login")
        return
      }
    }

    checkAdmin()
    fetchAllUsers()

    // Real-time listener for messages (INSERT and UPDATE events)
    const messageChannel = supabase
      .channel("users-page-messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: "recipient_id=eq.admin",
        },
        () => {
          console.log("[Users] New message received, refreshing...")
          fetchUsersSilently()
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: "recipient_id=eq.admin",
        },
        (payload) => {
          // When a message is marked as read, refresh to update counts
          if (payload.new && (payload.new as any).is_read === true) {
            console.log("[Users] Message marked as read, refreshing...")
            fetchUsersSilently()
          }
        }
      )
      .subscribe()

    // Real-time Presence Subscription
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

    return () => {
      supabase.removeChannel(messageChannel)
      supabase.removeChannel(presenceChannel)
    }
  }, [])

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

  const fetchAllUsers = async () => {
    try {
      const adminToken = localStorage.getItem("adminToken")
      const response = await fetch("/api/admin/get-users", {
        headers: {
          "x-admin-token": adminToken || "",
        },
      })

      if (!response.ok) throw new Error("Failed to fetch users")

      const { users: data } = await response.json()
      setUsers(data || [])
    } catch (err) {
      console.error("[v0] Error fetching users:", err)
      setError("Failed to load users.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user account?")) return

    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token || "",
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.message || "Failed to delete user")
        return
      }

      setUsers(users.filter((u) => u.id !== userId))
    } catch (err) {
      console.error("[v0] Error deleting user:", err)
      setError("Failed to delete user")
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl h-full">
          {/* Header Stats Skeleton */}
          <div className="mb-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-white shadow-sm border border-slate-200">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-lg" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Controls Skeleton */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            <Skeleton className="h-10 w-full md:w-96 rounded-lg" />
            <div className="flex gap-2 w-full md:w-auto">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          {/* Grid View Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="bg-white rounded-xl border border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-10" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-9 w-full rounded-md" />
                    <Skeleton className="h-9 w-full rounded-md" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const filteredUsers = users.filter(user =>
    (user.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.company || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeUserCount = filteredUsers.filter(u => onlineUsers.has(u.id)).length

  return (
    <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl h-full">
        {/* Header & Stats */}
        <div className="mb-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Management</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage accounts, roles, and support requests.</p>
            </div>

            <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                className={`h-8 px-3 text-xs font-medium ${viewMode === "grid" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900"}`}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
                Cards
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                className={`h-8 px-3 text-xs font-medium ${viewMode === "list" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900"}`}
                onClick={() => setViewMode("list")}
              >
                <List className="h-3.5 w-3.5 mr-1.5" />
                List
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white shadow-sm border border-slate-200">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Total Users</p>
                  <p className="text-2xl font-bold text-slate-900">{users.length}</p>
                </div>
                <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                  <UserIcon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-sm border border-slate-200">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Active Now</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-slate-900">{activeUserCount}</p>
                    {activeUserCount > 0 && (
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-10 w-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-sm border border-slate-200">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Unread Messages</p>
                  <p className="text-2xl font-bold text-slate-900">{users.reduce((sum, u) => sum + (u.unread_count || 0), 0)}</p>
                </div>
                <div className="h-10 w-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search by name, email, or company..."
              className="pl-10 h-10 rounded-lg bg-white border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" className="flex-1 md:flex-none h-10 border-slate-200 bg-white">Export</Button>
            <Button className="flex-1 md:flex-none h-10 bg-slate-900 hover:bg-slate-800 text-white shadow-sm">Add New User</Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-600">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
            <button onClick={() => setError("")} className="ml-auto hover:bg-red-100 p-1 rounded-full text-red-400"><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="group relative overflow-hidden border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 bg-white rounded-xl">
                {user.unread_count && user.unread_count > 0 ? (
                  <div className="absolute top-3 right-3 z-10">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  </div>
                ) : null}

                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-12 w-12 border border-slate-100 shadow-sm">
                          <AvatarImage src={user.avatar_url || ""} className="object-cover" />
                          <AvatarFallback className="bg-slate-100 text-slate-600 font-medium">
                            {user.full_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {onlineUsers.has(user.id) && (
                          <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full bg-green-500 ring-2 ring-white" title="Online" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 leading-tight">{user.full_name || "Unknown User"}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => router.push(`/admin/user/${user.id}`)}>View Profile</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/admin/chat?userId=${user.id}`)}>Support Chat</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-red-600">Delete Account</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm py-1 border-b border-dashed border-slate-100">
                      <span className="text-slate-500">Role</span>
                      <Badge variant="secondary" className="font-normal text-xs bg-slate-100 text-slate-700 hover:bg-slate-200">{user.role || "Member"}</Badge>
                    </div>
                    <div className="flex justify-between text-sm py-1 border-b border-dashed border-slate-100">
                      <span className="text-slate-500">Company</span>
                      <span className="font-medium text-slate-700 truncate max-w-[140px]">{user.company || "—"}</span>
                    </div>
                    <div className="flex justify-between text-sm py-1">
                      <span className="text-slate-500">Messages</span>
                      {user.unread_count && user.unread_count > 0 ? (
                        <span className="text-xs font-semibold text-red-600 flex items-center gap-1">
                          {user.unread_count} Unread
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">All caught up</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Link href={`/admin/user/${user.id}`}>
                      <Button variant="outline" size="sm" className="w-full h-9 text-xs font-medium border-slate-200 hover:bg-slate-50 hover:text-slate-900">
                        Details
                      </Button>
                    </Link>
                    <Link href={`/admin/chat?userId=${user.id}`}>
                      <Button size="sm" className="w-full h-9 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white shadow-sm gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Support
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-12">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="font-medium text-xs uppercase tracking-wider text-slate-500">User</TableHead>
                  <TableHead className="font-medium text-xs uppercase tracking-wider text-slate-500">Status</TableHead>
                  <TableHead className="font-medium text-xs uppercase tracking-wider text-slate-500">Company</TableHead>
                  <TableHead className="font-medium text-xs uppercase tracking-wider text-slate-500">Messages</TableHead>
                  <TableHead className="font-medium text-xs uppercase tracking-wider text-slate-500">Joined</TableHead>
                  <TableHead className="font-medium text-xs uppercase tracking-wider text-slate-500 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-9 w-9 border border-slate-100">
                            <AvatarImage src={user.avatar_url || ""} className="object-cover" />
                            <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-medium">
                              {user.full_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {onlineUsers.has(user.id) && (
                            <span className="absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-slate-900 truncate">{user.full_name || "User"}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal text-xs border-slate-200 text-slate-600">{user.role || "Member"}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">{user.company || "—"}</span>
                    </TableCell>
                    <TableCell>
                      {user.unread_count && user.unread_count > 0 ? (
                        <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-xs font-medium border border-red-100">
                          <MessageSquare className="h-3 w-3" />
                          {user.unread_count}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">No unread</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-500">{new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/chat?userId=${user.id}`}>
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-md border-slate-200 text-slate-500 hover:text-slate-900">
                            <MessageSquare className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Link href={`/admin/user/${user.id}`}>
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-md border-slate-200 text-slate-500 hover:text-slate-900">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {filteredUsers.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No matches found</h3>
            <p className="text-slate-500 mt-1 text-sm">Try searching for a different name or email.</p>
          </div>
        )}
      </div>
    </div>
  )
}
