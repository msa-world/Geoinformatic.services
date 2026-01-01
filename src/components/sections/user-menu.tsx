"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, Settings, User, FileText, MessageSquare, HardDrive, Briefcase, Bookmark, ChevronRight } from "lucide-react"
import { JobAlertToggle } from "@/components/jobs/job-alert-toggle"

interface UserMenuProps {
  user: {
    id: string
    email: string
    name?: string
  }
}

export default function UserMenu({ user }: UserMenuProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null)
  const [profileComplete, setProfileComplete] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const supabase = createClient()
        const { data: profileData } = await supabase
          .from("profiles")
          .select("avatar_url, full_name, cv_url, bio, phone_number")
          .eq("id", user.id)
          .single()

        if (profileData?.avatar_url) {
          setAvatarUrl(profileData.avatar_url)
        }

        // Check profile completion
        const isComplete = !!(
          profileData?.full_name &&
          profileData?.cv_url &&
          profileData?.bio &&
          profileData?.phone_number
        )
        setProfileComplete(isComplete)
      } catch (error) {
        console.error("[MSA] Error fetching profile:", error)
      }
    }

    fetchProfileData()
  }, [user.id])

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("[MSA] Logout error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (email: string, name?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    }
    return email.charAt(0).toUpperCase()
  }

  const closeSheet = () => setIsOpen(false)

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 ring-2 ring-white/20 hover:ring-primary/30 transition-all">
            <Avatar className="h-10 w-10">
              <AvatarImage src={avatarUrl || "/placeholder.svg?height=40&width=40"} alt={user.email} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white font-bold">
                {getInitials(user.email, user.name)}
              </AvatarFallback>
            </Avatar>
            {!profileComplete && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-500 rounded-full border-2 border-white" />
            )}
          </Button>
        </SheetTrigger>

        <SheetContent
          side="right"
          className="w-[320px] sm:w-[380px] p-0 border-l border-slate-100 bg-white"
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <SheetHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 ring-4 ring-white shadow-sm">
                  <AvatarImage src={avatarUrl || "/placeholder.svg"} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white font-bold text-xl">
                    {getInitials(user.email, user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <SheetTitle className="text-lg font-bold text-slate-900 truncate mb-1">{user.name || "User"}</SheetTitle>
                  <p className="text-xs text-slate-500 truncate font-medium">{user.email}</p>
                  {!profileComplete && (
                    <div className="flex items-center gap-1.5 mt-2 bg-amber-50 w-fit px-2 py-0.5 rounded-full border border-amber-100">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                      <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wide">Complete your profile</span>
                    </div>
                  )}
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Visual Quick Grid */}
              <div className="grid grid-cols-2 gap-3">
                <Link href="/profile" onClick={closeSheet} className="group relative overflow-hidden flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-100 transition-all duration-300">
                  <div className="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-xs font-bold text-blue-900">Profile</span>
                </Link>
                <Link href="/profile/saved" onClick={closeSheet} className="group relative overflow-hidden flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-100 transition-all duration-300">
                  <div className="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <Bookmark className="h-5 w-5 text-amber-600" />
                  </div>
                  <span className="text-xs font-bold text-amber-900">Saved Jobs</span>
                </Link>
              </div>

              {/* Section: Jobs */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Jobs & Applications</h4>
                <div className="space-y-1">
                  <Link href="/profile/applications" onClick={closeSheet} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 group transition-colors">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-100 transition-colors">
                      <FileText className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-slate-700 group-hover:text-slate-900 flex-1">My Applications</span>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                  </Link>
                  <Link href="/profile/my-jobs" onClick={closeSheet} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 group transition-colors">
                    <div className="p-2 bg-pink-50 text-pink-600 rounded-lg group-hover:bg-pink-100 transition-colors">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-slate-700 group-hover:text-slate-900 flex-1">Manage My Jobs</span>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                  </Link>

                  {/* Job Alert Toggle */}
                  <JobAlertToggle variant="sidebar" />
                </div>
              </div>

              {/* Section: Account */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Account</h4>
                <div className="space-y-1">
                  <Link href="/profile/chat" onClick={closeSheet} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 group transition-colors">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100 transition-colors">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-slate-700 group-hover:text-slate-900 flex-1">Chat <span className="text-xs font-normal text-slate-400 ml-1">(Support)</span></span>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                  </Link>
                  <Link href="/profile/settings" onClick={closeSheet} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 group transition-colors">
                    <div className="p-2 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-slate-200 transition-colors">
                      <Settings className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-slate-700 group-hover:text-slate-900 flex-1">Settings</span>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                  </Link>
                  <Link href="/profile/drive" onClick={closeSheet} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-cyan-50/50 group transition-colors border border-transparent hover:border-cyan-100">
                    <div className="p-2 bg-cyan-50 text-cyan-600 rounded-lg group-hover:bg-cyan-100 transition-colors">
                      <HardDrive className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-slate-700 group-hover:text-slate-900 flex-1">Connect Drive</span>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                  </Link>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/30">
              <Button
                onClick={handleLogout}
                disabled={isLoading}
                variant="outline"
                className="w-full h-12 rounded-xl text-red-600 hover:text-white hover:bg-red-600 border-red-100 hover:border-red-600 font-bold transition-all duration-300 shadow-sm"
              >
                {isLoading ? (
                  "Signing out..."
                ) : (
                  <>
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </>
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
