import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="w-full max-w-md px-4">
      <Card className="shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Account Created!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <p className="text-center text-gray-600">
              Thank you for signing up. Please check your email to confirm your account.
            </p>
            <p className="text-center text-sm text-gray-500">
              You'll be able to access your profile and complete your information after confirming your email.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Check your spam folder if you don't see the confirmation email.
            </p>
          </div>

          <Link href="/auth/login" className="block">
            <Button className="w-full h-10">Back to Login</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
