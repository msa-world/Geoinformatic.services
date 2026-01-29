"use client"

import React, { useState, useEffect } from "react"
import HeaderNavigation from "@/components/sections/header-navigation"
import Footer from "@/components/sections/footer"
import ProfileWizard from "@/components/profile/profile-wizard"
import { createClient } from "@/lib/supabase/client"
import { getUserOnce } from "@/lib/supabase/auth-client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, Zap, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

function DailyLimitCard() {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchLimit = async () => {
      const user = await getUserOnce()
      if (!user) return

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { count: appliedCount } = await supabase
        .from("job_applications")
        .select("id", { count: 'exact', head: true })
        .eq("user_id", user.id)
        .gte("applied_at", startOfDay.toISOString())

      setCount(appliedCount || 0)
      setLoading(false)
    }
    fetchLimit()
  }, [])

  const getResetTime = () => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setHours(24, 0, 0, 0)
    const diff = tomorrow.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  if (loading) return null

  return (
    <Card className="max-w-4xl mx-auto mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
      <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-full shadow-sm text-blue-600">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900">Daily Application Limit</h3>
            <p className="text-sm text-blue-700">You can apply to <span className="font-bold">10 jobs</span> every 24 hours.</p>
          </div>
        </div>

        <div className="flex items-center gap-6 flex-1 w-full md:w-auto justify-end">
          <div className="flex-1 md:flex-none w-full md:w-48 space-y-2">
            <div className="flex justify-between text-xs font-semibold text-blue-800">
              <span>Usage</span>
              <span>{count} / 10</span>
            </div>
            <Progress value={(count / 10) * 100} className="h-2 bg-white" indicatorClassName={count >= 10 ? 'bg-red-500' : 'bg-blue-600'} />
          </div>

          <div className="hidden md:block h-10 w-px bg-blue-200"></div>

          <div className="flex items-center gap-2 text-blue-800 shrink-0">
            <Clock className="w-4 h-4" />
            <div className="text-sm">
              <span className="opacity-70">Resets in </span>
              <span className="font-semibold">{getResetTime()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      <HeaderNavigation />

      <main className="flex-1 w-full py-24 md:py-28 bg-gradient-to-b from-background to-secondary/10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8 max-w-4xl mx-auto">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-text-primary">My Profile</h1>
              <p className="text-muted-foreground mt-1">Manage your personal information and documents.</p>
            </div>
            <Button onClick={handleLogout} variant="ghost" className="gap-2 text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>

          <DailyLimitCard /> {/* New Component for cleaner code */}

          <ProfileWizard />
        </div>
      </main>

      <Footer />
    </div>
  )
}

