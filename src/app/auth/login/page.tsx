"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import PasswordEye from "@/components/ui/password-eye"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { useState } from "react"
import { AlertCircle, ChevronLeft } from 'lucide-react'
import { motion } from "framer-motion"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.log("[MSA] Sign-in error:", signInError)
        throw new Error(signInError.message)
      }

      if (!data.user) {
        throw new Error("No user data returned")
      }

      console.log("[MSA] User signed in, creating/ensuring profile...")

      // Try to ensure profile exists
      const response = await fetch("/api/auth/ensure-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: data.user.id,
          email: data.user.email,
          fullName: data.user.user_metadata?.full_name || email.split("@")[0],
        }),
      })


      const profileResult = await response.json()
      console.log("[MSA] Profile creation result:", profileResult)

      // Send Login Notification (Non-blocking)
      fetch("/api/email/login-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.user.email,
          userName: data.user.user_metadata?.full_name,
        }),
      }).catch(err => console.error("Login email failed", err));

      // Redirect to dashboard regardless of profile creation status
      // The profile is typically created by the Supabase auth trigger automatically
      router.push("/dashboard")
      router.refresh()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during login"

      // Provide more helpful error messages
      if (errorMessage.includes("profile")) {
        setError("Login successful but profile setup has an issue. Please contact support.")
      } else if (errorMessage.includes("Invalid login credentials")) {
        setError("Invalid email or password. Please try again.")
      } else if (errorMessage.includes("Email not confirmed")) {
        setError("Please confirm your email before logging in. Check your inbox for a confirmation link.")
      } else {
        setError(errorMessage)
      }

      console.error("[MSA] Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthGoogle = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const redirectTo = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      })

      if (oauthError) throw oauthError

      if (data?.url) {
        window.location.href = data.url
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "OAuth error"
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full h-screen flex overflow-hidden">
      {/* Left side - Login form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-12 bg-white overflow-y-auto relative">
        {/* Back Button */}
        <div className="absolute top-8 left-8">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-6">
              <img src="/extra-images/logo.png" alt="Geoinformatics Logo" className="h-12 w-auto" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
            <p className="text-muted">Sign in to access your dashboard and opportunities</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold">
                  Password
                </Label>
                <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <PasswordEye
                id="password"
                name="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
                className="h-10 w-full"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full h-10 bg-black text-white hover:bg-gray-800" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-10 bg-transparent"
              disabled={isLoading}
              onClick={handleOAuthGoogle}
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted">Don't have an account? </span>
              <Link href="/auth/sign-up" className="text-primary font-semibold hover:underline">
                Sign up
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Image section (fullscreen on larger screens) */}
      <div className="hidden lg:flex w-1/2 items-center justify-center bg-cover bg-center relative overflow-hidden text-center" style={{ backgroundImage: 'url("/sign-in.jpg")' }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30"></div>
        <div className="absolute inset-0 bg-[#D97D25]/30 mix-blend-overlay"></div>
        <div className="relative z-10 p-12 max-w-2xl flex flex-col items-center justify-center h-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h2 className="text-5xl font-black mb-6 leading-tight text-white drop-shadow-md">
              Your Future in <br />Geoinformatics Starts Here
            </h2>
            <p className="text-xl font-medium text-white/95 leading-relaxed max-w-lg drop-shadow-sm">
              Connect with top employers, explore cutting-edge GIS projects, apply for jobs, and take your career to the next level.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
