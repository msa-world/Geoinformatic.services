"use client"

import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"

export default async function DatabaseSetupPage() {
  const supabase = await createClient()

  // Check if profiles table exists
  let tableExists = false
  let error: string | null = null

  try {
    const { error: queryError } = await supabase.from("profiles").select("count", { count: "exact", head: true })

    if (!queryError) {
      tableExists = true
    } else if (queryError.code !== "PGRST205" && queryError.code !== "42P01") {
      error = queryError.message
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error"
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Database Setup</CardTitle>
          <CardDescription>Initialize your authentication database</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {tableExists ? (
            <>
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Database is properly configured! The profiles table exists and is ready to use.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h3 className="font-semibold text-text-primary">You can now:</h3>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li>✓ Sign up for a new account</li>
                  <li>✓ Log in with your credentials</li>
                  <li>✓ Manage your profile</li>
                  <li>✓ Upload documents</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Link href="/auth/login" className="flex-1">
                  <Button className="w-full">Go to Login</Button>
                </Link>
                <Link href="/auth/sign-up" className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  {error ? `Database error: ${error}` : "The profiles table has not been created yet."}
                </AlertDescription>
              </Alert>

              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-text-primary">To set up your database:</h3>
                <ol className="space-y-2 text-sm text-text-secondary list-decimal list-inside">
                  <li>Open your MSA sidebar</li>
                  <li>Go to "Connect" section</li>
                  <li>
                    Find and run:{" "}
                    <code className="bg-white px-2 py-1 rounded text-xs">scripts/001_create_profiles.sql</code>
                  </li>
                  <li>Wait for the script to complete</li>
                  <li>Refresh this page</li>
                </ol>
              </div>

              <Button variant="outline" className="w-full bg-transparent" onClick={() => window.location.reload()}>
                Check Database Status
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
