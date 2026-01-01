"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import PasswordEye from "@/components/ui/password-eye"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { AlertCircle, CheckCircle, ChevronLeft } from "lucide-react"
import { motion } from "framer-motion"

const ROLE_OPTIONS = [
  { value: "Student", label: "Student" },
  { value: "GIS Analyst", label: "GIS Analyst" },
  { value: "Developer", label: "Developer" },
  { value: "Digital Marketer", label: "Digital Marketer" },
  { value: "Other", label: "Other" },
]

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    role: "Other",
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [userExists, setUserExists] = useState(false)
  const [checkingUser, setCheckingUser] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkUserExists = async () => {
      if (formData.email && formData.email.includes("@")) {
        setCheckingUser(true)
        try {
          const supabase = createClient()
          // Using maybeSingle() for safer check and wrapping createClient in try/catch to handle missing env vars
          const { data, error: queryError } = await supabase
            .from("profiles")
            .select("id, email")
            .eq("email", formData.email)
            .maybeSingle()

          if (queryError) throw queryError

          if (data) {
            setUserExists(true)
            setError(null)
          } else {
            setUserExists(false)
            setError(null)
          }
        } catch (err: unknown) {
          // Handle errors gracefully, including missing env vars or connection issues
          console.log("Error checking user:", err)
          // If we can't check, we assume user doesn't exist to allow flow to proceed (or fail at next step)
          // But we don't set userExists to true unless we are sure.
        } finally {
          setCheckingUser(false)
        }
      }
    }

    const debounce = setTimeout(checkUserExists, 500)
    return () => clearTimeout(debounce)
  }, [formData.email])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    // Wrap client creation in try/catch to prevent crash if env vars are missing
    let supabase
    try {
      supabase = createClient()
    } catch (err) {
      setError("Configuration error: Unable to connect to authentication service.")
      return
    }

    setIsLoading(true)
    setError(null)

    if (userExists) {
      setError("This email is already registered. Please sign in instead.")
      setIsLoading(false)
      return
    }

    // Final check to make sure user doesn't exist in profiles table
    try {
      // Use maybeSingle for consistency
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", formData.email)
        .maybeSingle()

      if (existingUser) {
        setError("This email is already registered. Please sign in instead.")
        setUserExists(true)
        setIsLoading(false)
        return
      }
    } catch (err) {
      // Continue with sign up if check fails (fail open or handle specific errors)
      console.log("Pre-signup check failed:", err)
    }

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
          data: {
            full_name: formData.fullName,
            role: formData.role,
          },
        },
      })
      if (error) throw error
      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full h-screen flex overflow-hidden">
      {/* Left side - Sign up form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-12 bg-white overflow-y-auto relative">
        {/* Back Button */}
        <div className="absolute top-8 left-8">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>

        <div className="w-full max-w-md pt-12 lg:pt-0">
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-6">
              <img src="/extra-images/logo.png" alt="Geoinformatics Logo" className="h-12 w-auto" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Create an Account</h1>
            <p className="text-muted">Join the premier network for geospatial professionals</p>
          </div>

          {userExists && (
            <div className="flex items-start gap-3 p-3 mb-4 bg-blue-50 border border-blue-200 rounded-lg">
              <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-600">
                <p className="font-semibold">Account Already Exists</p>
                <p className="mt-1">
                  This email is already registered.{" "}
                  <Link href="/auth/login" className="font-semibold underline hover:no-underline">
                    Sign in here
                  </Link>{" "}
                  instead.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-semibold">
                Full Name
              </Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Full name"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="h-10"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Email address"
                required
                value={formData.email}
                onChange={handleChange}
                className="h-10"
                disabled={isLoading}
              />
              {checkingUser && <p className="text-xs text-muted">Checking availability...</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-semibold">
                Role
              </Label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full h-10 px-3 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={isLoading}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">
                Password
              </Label>
              <PasswordEye
                id="password"
                name="password"
                placeholder="Password"
                required
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: (e.target as HTMLInputElement).value }))}
                className="h-10 w-full"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold">
                Repeat password
              </Label>
              <PasswordEye
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Repeat password"
                required
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, confirmPassword: (e.target as HTMLInputElement).value }))
                }
                className="h-10 w-full"
                disabled={isLoading}
              />
            </div>

            {error && !userExists && (
              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-10 bg-black text-white hover:bg-gray-800"
              disabled={isLoading || userExists || checkingUser}
            >
              {isLoading ? "Creating account..." : "Sign up"}
            </Button>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted">Already have an account? </span>
              <Link href="/auth/login" className="text-primary font-semibold hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Image section (fullscreen on larger screens) */}
      <div
        className="hidden lg:flex w-1/2 items-center justify-center bg-cover bg-center relative overflow-hidden text-center"
        style={{
          backgroundImage: 'url("/sign-up.jpg")',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30"></div>
        <div className="absolute inset-0 bg-[#D97D25]/30 mix-blend-overlay"></div>
        <div className="relative z-10 p-12 max-w-2xl flex flex-col items-center justify-center h-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h2 className="text-5xl font-black mb-6 leading-tight text-white drop-shadow-md">
              Join Our Growing <br />Community
            </h2>
            <p className="text-xl font-medium text-white/95 leading-relaxed max-w-lg drop-shadow-sm">
              Create your profile, showcase your skills, apply for jobs, and find opportunities that match your expertise in the geoinformatics field.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
