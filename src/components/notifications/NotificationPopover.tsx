"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import Link from "next/link"

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

interface NotificationPopoverProps {
    userId: string
    className?: string
}

export function NotificationPopover({ userId, className }: NotificationPopoverProps) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        if (!userId) return

        // Initial fetch
        fetchNotifications()

        // Real-time subscription
        const channel = supabase
            .channel('notification-updates')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    console.log('New notification received:', payload)
                    fetchNotifications()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId])

    const fetchNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from("notifications")
                .select("*, messages(*)")
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .limit(20)

            if (error) throw error

            if (data) {
                setNotifications(data)
                const unread = data.filter((n) => !n.is_read).length
                setUnreadCount(unread)
            }
        } catch (error) {
            console.error("Error fetching notifications:", error)
        }
    }

    const markAsRead = async (notificationId: string) => {
        try {
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("id", notificationId)

            if (error) throw error

            setNotifications((prev) =>
                prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
            )
            setUnreadCount((prev) => Math.max(0, prev - 1))
        } catch (error) {
            console.error("Error marking as read:", error)
        }
    }

    const markAllAsRead = async () => {
        try {
            const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
            if (unreadIds.length === 0) return

            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .in("id", unreadIds)

            if (error) throw error

            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
            setUnreadCount(0)
        } catch (error) {
            console.error("Error marking all as read:", error)
        }
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className={cn("relative transition-colors", className)}>
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white/10 animate-pulse" />
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold leading-none">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground hover:text-primary" onClick={markAllAsRead}>
                            Mark all as read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
                            <Bell className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-sm">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "flex flex-col gap-1 p-4 transition-colors hover:bg-muted/50 cursor-pointer",
                                        !notification.is_read && "bg-blue-50/50 dark:bg-blue-900/10"
                                    )}
                                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <p className={cn("text-sm leading-snug", !notification.is_read && "font-medium")}>
                                            {notification.messages?.content || "New message"}
                                        </p>
                                        {!notification.is_read && (
                                            <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                                        )}
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(notification.created_at).toLocaleDateString()} • {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="p-2 border-t bg-muted/30">
                    <Link href="/notifications" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" size="sm" className="w-full text-xs">
                            View all notifications
                        </Button>
                    </Link>
                </div>
            </PopoverContent>
        </Popover>
    )
}
