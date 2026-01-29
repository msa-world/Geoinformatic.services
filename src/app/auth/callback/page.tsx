"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getUserOnce } from "@/lib/supabase/auth-client"

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Processing sign-in...")
  const router = useRouter()

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const user = await getUserOnce()

          if (!user) {
            if (mounted) setMessage("No user found after sign-in. Please try again.")
            // give a moment to show message then send back to login
            setTimeout(() => router.replace("/auth/login"), 1500)
            return
          }

          // Check whether the user already has a profile
          const checkRes = await fetch(`/api/auth/check-profile?userId=${encodeURIComponent(user.id)}`)
          const checkJson = await checkRes.json()

          if (checkJson?.exists) {
            // Existing user - go to dashboard
            router.replace("/dashboard")
            return
          }

          // No profile yet: redirect to sign-up and prefill email/name so user can finish registration
          const params = new URLSearchParams()
          if (user.email) params.set("email", user.email)
          const namePrefill = user.user_metadata?.full_name || user.user_metadata?.name || ""
          if (namePrefill) params.set("fullName", namePrefill)
          router.replace(`/auth/sign-up?${params.toString()}`)
        } catch (err) {
          console.error("[MSA] auth callback error", err)
          if (mounted) setMessage("Error processing sign-in. Redirecting to login...")
          setTimeout(() => router.replace("/auth/login"), 1500)
        }
      })()

    return () => {
      mounted = false
    }
  }, [router])

  return (
    <div className="w-full max-w-md px-4">
      <div className="py-12 text-center text-sm text-gray-700">{message}</div>
    </div>
  )
}
