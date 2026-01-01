"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertCircle,
  Trash2,
  Edit2,
  Check,
  X,
  HardDrive,
  User as UserIcon,
  CheckCircle,
  MessageSquare,
  Search,
  Settings,
  MoreHorizontal
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
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
  created_at: string
  google_connected_at?: string | null
  avatar_url?: string | null
  unread_count?: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const supabase = createClient()

  const [users, setUsers] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Real-time State
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<UserProfile>>({})

  // View Customization
  const [visibleColumns, setVisibleColumns] = useState({
    email: true,
    role: true,
    company: true,
    phone: true,
    joined: true,
    drive: true,
    actions: true
  })

  useEffect(() => {
    const checkAdmin = () => {
      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        router.push("/auth/admin-login")
        return
      }
      fetchAllUsers()
    }
    checkAdmin()

    // Real-time: Presence
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

    // Real-time: Messages (for Unread Counts)
    const messageChannel = supabase
      .channel('dashboard-messages')
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: "recipient_id=eq.admin" },
        () => fetchUsersSilently()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(presenceChannel)
      supabase.removeChannel(messageChannel)
    }
  }, [])

  const fetchUsersSilently = async () => {
    try {
      const adminToken = localStorage.getItem("adminToken")
      const response = await fetch("/api/admin/get-users", {
        headers: { "x-admin-token": adminToken || "" }
      })
      if (response.ok) {
        const { users: data } = await response.json()
        setUsers(data || [])
      }
    } catch (e) { console.error("Silent fetch error", e) }
  }

  const fetchAllUsers = async () => {
    try {
      setIsLoading(true)
      const adminToken = localStorage.getItem("adminToken")
      const response = await fetch("/api/admin/get-users", {
        headers: { "x-admin-token": adminToken || "" },
      })

      if (!response.ok) throw new Error("Failed to fetch users")

      const { users: data } = await response.json()
      setUsers(data || [])
      setError("")
    } catch (err) {
      console.error("[v0] Error fetching users:", err)
      setError("Failed to load users. Please refresh the page.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (user: UserProfile) => {
    setEditingId(user.id)
    setEditData(user)
  }

  const handleSaveEdit = async () => {
    if (!editingId) return

    try {
      const adminToken = localStorage.getItem("adminToken")

      const response = await fetch("/api/admin/update-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken || ""
        },
        body: JSON.stringify({
          userId: editingId,
          full_name: editData.full_name,
          role: editData.role,
          company: editData.company,
          phone_number: editData.phone_number
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update user")
      }

      setUsers(users.map((u) => (u.id === editingId ? { ...u, ...editData } : u)))
      setEditingId(null)
      setEditData({})
    } catch (err) {
      console.error("[v0] Error updating user:", err)
      setError(err instanceof Error ? err.message : "Failed to update user")
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

  const filteredUsers = users.filter((user) =>
    (user.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.company || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeUserCount = users.filter(u => onlineUsers.has(u.id)).length
  const totalUnread = users.reduce((acc, u) => acc + (u.unread_count || 0), 0)

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto bg-slate-50/50">
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-500">
          {/* Overview Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-white shadow-sm border border-slate-200">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-8 w-12" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Skeleton */}
          <Card className="shadow-lg border-slate-200 bg-white">
            <CardHeader className="border-b bg-gray-50/50 pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 w-64 rounded-md" />
                  <Skeleton className="h-9 w-24 rounded-md" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4, 5].map((row) => (
                  <div key={row} className="flex items-center gap-4 py-2">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 grid grid-cols-4 gap-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50/50">
      <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-500">

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
                <p className="text-2xl font-bold text-slate-900">{totalUnread}</p>
              </div>
              <div className="h-10 w-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="shadow-lg border-slate-200 bg-white">
          <CardHeader className="border-b bg-gray-50/50 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold">User Management</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Manage, edit, and monitor all registered accounts.</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64 h-9 bg-white"
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-2">
                      <Settings className="h-4 w-4" />
                      Customize
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Visible Columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem checked={visibleColumns.email} onCheckedChange={(c) => setVisibleColumns(prev => ({ ...prev, email: c }))}>Email</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={visibleColumns.role} onCheckedChange={(c) => setVisibleColumns(prev => ({ ...prev, role: c }))}>Role</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={visibleColumns.company} onCheckedChange={(c) => setVisibleColumns(prev => ({ ...prev, company: c }))}>Company</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={visibleColumns.phone} onCheckedChange={(c) => setVisibleColumns(prev => ({ ...prev, phone: c }))}>Phone</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={visibleColumns.joined} onCheckedChange={(c) => setVisibleColumns(prev => ({ ...prev, joined: c }))}>Joined Date</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={visibleColumns.drive} onCheckedChange={(c) => setVisibleColumns(prev => ({ ...prev, drive: c }))}>Drive Status</DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[300px]">User</TableHead>
                    {visibleColumns.email && <TableHead>Email</TableHead>}
                    {visibleColumns.role && <TableHead>Role</TableHead>}
                    {visibleColumns.company && <TableHead>Company</TableHead>}
                    {visibleColumns.phone && <TableHead>Phone</TableHead>}
                    {visibleColumns.joined && <TableHead>Joined</TableHead>}
                    {visibleColumns.drive && <TableHead className="text-center">Drive</TableHead>}
                    {visibleColumns.actions && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* User Info Column */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-9 w-9 border border-slate-100">
                              <AvatarImage src={user.avatar_url || ""} />
                              <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                                {user.full_name?.substring(0, 2).toUpperCase() || "US"}
                              </AvatarFallback>
                            </Avatar>
                            {onlineUsers.has(user.id) && (
                              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-white"></span>
                            )}
                          </div>
                          <div className="flex flex-col">
                            {editingId === user.id ? (
                              <Input
                                value={editData.full_name || ""}
                                onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                                className="h-7 text-xs w-32"
                              />
                            ) : (
                              <span className="font-medium text-slate-700 text-sm">{user.full_name || "Unknown"}</span>
                            )}

                            {/* Mobile view email fallback if hidden column */}
                            {!visibleColumns.email && <span className="text-xs text-slate-400">{user.email}</span>}
                          </div>
                        </div>
                      </TableCell>

                      {/* Email Column - READ ONLY during edit */}
                      {visibleColumns.email && (
                        <TableCell>
                          <Input
                            value={user.email}
                            disabled
                            className="h-8 bg-slate-50 text-slate-500 border-transparent px-0"
                          />
                        </TableCell>
                      )}

                      {/* Role Column */}
                      {visibleColumns.role && (
                        <TableCell>
                          {editingId === user.id ? (
                            <Input
                              value={editData.role || ""}
                              onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                              className="h-7 text-xs w-24"
                            />
                          ) : (
                            <Badge variant="outline" className="font-normal text-xs text-slate-600 bg-slate-50">{user.role || "Member"}</Badge>
                          )}
                        </TableCell>
                      )}

                      {/* Company Column */}
                      {visibleColumns.company && (
                        <TableCell>
                          {editingId === user.id ? (
                            <Input
                              value={editData.company || ""}
                              onChange={(e) => setEditData({ ...editData, company: e.target.value })}
                              className="h-7 text-xs w-24"
                            />
                          ) : (
                            <span className="text-sm text-slate-600">{user.company || "-"}</span>
                          )}
                        </TableCell>
                      )}

                      {/* Phone Column */}
                      {visibleColumns.phone && (
                        <TableCell>
                          {editingId === user.id ? (
                            <Input
                              value={editData.phone_number || ""}
                              onChange={(e) => setEditData({ ...editData, phone_number: e.target.value })}
                              className="h-7 text-xs w-28"
                            />
                          ) : (
                            <span className="text-sm text-slate-600 font-mono text-xs">{user.phone_number || "-"}</span>
                          )}
                        </TableCell>
                      )}

                      {/* Joined Column */}
                      {visibleColumns.joined && (
                        <TableCell>
                          <span className="text-xs text-slate-500">
                            {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </TableCell>
                      )}

                      {/* Drive Status */}
                      {visibleColumns.drive && (
                        <TableCell className="text-center">
                          <Link href={`/admin/user/${user.id}/drive`} target="_blank">
                            <Button size="icon" variant="ghost" className={`h-8 w-8 ${user.google_connected_at ? "text-green-600 bg-green-50" : "text-gray-300"}`}>
                              <HardDrive className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      )}

                      {/* Actions */}
                      {visibleColumns.actions && (
                        <TableCell className="text-right">
                          {editingId === user.id ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" onClick={handleSaveEdit} className="h-7 w-7 p-0 bg-green-600 hover:bg-green-700 text-white rounded-full">
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 w-7 p-0 rounded-full">
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => handleEdit(user)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteUser(user.id)} className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      )}

                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Error Toast/Banner */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-4">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">{error}</p>
            <button onClick={() => setError("")} className="ml-2 hover:bg-red-200 p-1 rounded"><X className="h-3 w-3" /></button>
          </div>
        )}
      </div>
    </div >
  )
}
