"use client"

import { useState, useEffect } from "react"
import { Bell, LogOut, MessageSquare, Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface UnreadMessage {
    id: string
    sender_id: string
    content: string
    created_at: string
    sender_name?: string
    sender_avatar?: string
}

export function AdminHeader() {
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()
    const [unreadMessages, setUnreadMessages] = useState<UnreadMessage[]>([])
    const [adminUsername, setAdminUsername] = useState("")

    useEffect(() => {
        const username = localStorage.getItem("adminUsername")
        if (username) setAdminUsername(username)

        // Initial fetch
        fetchUnreadMessages()

        // Poll every 5 seconds to keep notifications in sync
        // faster than 10s feels more "real-time" for notifications
        const intervalId = setInterval(fetchUnreadMessages, 5000)

        return () => {
            clearInterval(intervalId)
        }
    }, [])

    const fetchUnreadMessages = async () => {
        try {
            const adminToken = localStorage.getItem("adminToken")
            console.log("[AdminHeader] Token present:", !!adminToken)

            const response = await fetch("/api/admin/get-unread-messages", {
                headers: {
                    "x-admin-token": adminToken || ""
                },
                cache: "no-store"
            })

            if (response.ok) {
                const { messages } = await response.json()
                console.log("[AdminHeader] Fetched unread messages:", messages?.length)
                setUnreadMessages(messages || [])
            } else {
                console.error("[AdminHeader] Fetch failed:", response.status)
            }
        } catch (err) {
            console.error("Error fetching notifications:", err)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem("adminToken")
        localStorage.removeItem("adminUsername")
        router.push("/")
    }

    return (
        <header className="bg-white border-b sticky top-0 z-50 shadow-sm h-16">
            <div className="container mx-auto px-4 h-full flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link href="/admin/dashboard" className="flex items-center gap-2 group">
                        <div className="w-9 h-9 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-bold text-xl transition-transform group-hover:scale-110">
                            A
                        </div>
                        <div>
                            <span className="text-lg font-bold text-gray-900 block leading-tight">Admin Portal</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">GeoInformatics</span>
                        </div>
                    </Link>

                    <nav className="hidden md:flex items-center gap-1">
                        <Link
                            href="/admin/users"
                            className={cn(
                                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                pathname === "/admin/users" ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-gray-100"
                            )}
                        >
                            Users
                        </Link>
                        <Link
                            href="/admin/chat"
                            className={cn(
                                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                pathname === "/admin/chat" ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-gray-100"
                            )}
                        >
                            Support Chat
                        </Link>
                        <Link
                            href="/admin/jobs"
                            className={cn(
                                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                pathname === "/admin/jobs" ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-gray-100"
                            )}
                        >
                            Jobs
                        </Link>
                        <Link
                            href="/admin/jobs/applications"
                            className={cn(
                                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                pathname === "/admin/jobs/applications" ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-gray-100"
                            )}
                        >
                            Applications
                        </Link>
                        <Link
                            href="/"
                            target="_blank"
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-gray-100 flex items-center gap-2"
                        >
                            Home Page
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-2">
                    {/* Notifications Bell */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full hover:bg-gray-100 transition-colors">
                                <Bell className="h-5 w-5 text-gray-600" />
                                {unreadMessages.length > 0 && (
                                    <span className="absolute top-2 right-2 flex h-2.5 w-2.5 translate-x-0.5 -translate-y-0.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden rounded-xl">
                            <div className="p-4 border-b bg-gray-50/50">
                                <div className="flex items-center justify-between">
                                    <DropdownMenuLabel className="p-0 font-bold text-base">Notifications</DropdownMenuLabel>
                                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">{unreadMessages.length} New</Badge>
                                </div>
                            </div>
                            <div className="max-h-[350px] overflow-y-auto">
                                {unreadMessages.length === 0 ? (
                                    <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
                                        <MessageSquare className="h-8 w-8 opacity-20" />
                                        <p className="text-sm">No new messages</p>
                                    </div>
                                ) : (
                                    unreadMessages.map((msg) => (
                                        <DropdownMenuItem
                                            key={msg.id}
                                            className="p-4 cursor-pointer hover:bg-gray-50 focus:bg-gray-50 border-b last:border-0 transition-colors"
                                            onClick={() => router.push(`/admin/chat?userId=${msg.sender_id}`)}
                                        >
                                            <div className="flex gap-3 w-full">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center font-bold text-primary">
                                                    {msg.sender_name?.charAt(0)}
                                                </div>
                                                <div className="flex-1 space-y-1 overflow-hidden">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm font-semibold truncate text-gray-900">{msg.sender_name}</p>
                                                        <span className="text-[10px] text-gray-400">
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                                        {msg.content}
                                                    </p>
                                                </div>
                                            </div>
                                        </DropdownMenuItem>
                                    ))
                                )}
                            </div>
                            <DropdownMenuSeparator className="m-0" />
                            <Link href="/admin/chat" className="block p-3 text-center text-xs font-semibold text-primary hover:bg-gray-50 transition-colors bg-white">
                                View all conversations
                            </Link>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="hidden sm:flex items-center gap-2 pl-2 pr-4 h-10 rounded-full border border-gray-100 hover:bg-gray-100 transition-all">
                                <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center">
                                    <User className="h-4 w-4 text-primary" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">{adminUsername || 'Admin'}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl">
                            <DropdownMenuLabel>Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/admin/dashboard')}>
                                Dashboard
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer" onClick={handleLogout}>
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}
