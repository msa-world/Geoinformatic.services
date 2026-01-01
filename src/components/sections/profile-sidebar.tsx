"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import ProfileWizard from "@/components/profile/profile-wizard"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { JobAlertToggle } from "@/components/jobs/job-alert-toggle"

interface ProfileSidebarProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export default function ProfileSidebar({ open, onOpenChange }: ProfileSidebarProps) {
    const supabase = createClient()
    const router = useRouter()

    // Auto-focus management or specific sheet behaviors can go here

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.reload() // Reload to clear state
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-[100vw] sm:w-[540px] md:w-[600px] overflow-y-auto">
                <SheetHeader className="mb-6 flex flex-row items-center justify-between border-b pb-4">
                    <SheetTitle className="text-2xl font-bold">My Profile</SheetTitle>
                    <div className="flex items-center gap-2">
                        <JobAlertToggle variant="ghost" showLabel={false} />
                        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </SheetHeader>

                <div className="pb-10">
                    <ProfileWizard />
                </div>
            </SheetContent>
        </Sheet>
    )
}
