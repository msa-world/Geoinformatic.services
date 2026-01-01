"use client"

import { useParams, useRouter } from "next/navigation"
import { AdminDriveView } from "@/components/drive/AdminDriveView"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AdminUserDrivePage() {
    const params = useParams()
    const userId = params.id as string
    const router = useRouter()

    if (!userId) {
        return <div>User ID is missing</div>
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/users">
                            <Button variant="outline" className="gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Users
                            </Button>
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900">User Drive Management</h1>
                    </div>
                </div>

                <AdminDriveView userId={userId} />
            </div>
        </div>
    )
}
