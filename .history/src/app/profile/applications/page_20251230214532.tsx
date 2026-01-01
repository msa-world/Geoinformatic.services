"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { getUserOnce } from "@/lib/supabase/auth-client"
import { useRouter } from "next/navigation"
import HeaderNavigation from "@/components/sections/header-navigation"
import Footer from "@/components/sections/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Briefcase, MapPin, Clock, Calendar, ExternalLink, FileCheck, Loader2, ArrowLeft, ChevronRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface JobApplication {
    id: string
    job_id: string
    status: string
    created_at: string
    job_title?: string
    job_department?: string
    job_location?: string
    job_type?: string
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    PENDING: { label: "Submitted", color: "text-gray-700", bgColor: "bg-gray-100 border-gray-200" },
    REVIEWING: { label: "Under Review", color: "text-blue-700", bgColor: "bg-blue-50 border-blue-200" },
    SHORTLISTED: { label: "Shortlisted", color: "text-purple-700", bgColor: "bg-purple-50 border-purple-200" },
    REJECTED: { label: "Not Selected", color: "text-red-700", bgColor: "bg-red-50 border-red-200" },
    ACCEPTED: { label: "Accepted", color: "text-green-700", bgColor: "bg-green-50 border-green-200" },
    JOB_DELETED: { label: "Job Deleted", color: "text-gray-500", bgColor: "bg-gray-100 border-gray-200 border-dashed" },
    JOB_EXPIRED: { label: "Job Expired", color: "text-amber-700", bgColor: "bg-amber-50 border-amber-200 border-dashed" },
    EXPIRED: { label: "Expired", color: "text-red-700", bgColor: "bg-red-50 border-red-200 border-dashed" },
}

export default function MyApplicationsPage() {
    const [applications, setApplications] = useState<JobApplication[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    const [dailyCount, setDailyCount] = useState(0)

    useEffect(() => {
        fetchApplications()
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

    const fetchApplications = async () => {
        setIsLoading(true)

        // Get current user
        const user = await getUserOnce()

        if (!user) {
            router.push("/auth/login")
            return
        }

        console.log("[My Applications] User ID:", user.id)

        // Step 0: Fetch Daily usage
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const { count } = await supabase
            .from("job_applications")
            .select("id", { count: 'exact', head: true })
            .eq("user_id", user.id)
            .gte("applied_at", startOfDay.toISOString())

        setDailyCount(count || 0)

        // Step 1: Fetch applications for this user
        const { data: apps, error: appsError } = await supabase
            .from("job_applications")
            .select("id, job_id, status, applied_at")
            .eq("user_id", user.id)

        console.log("[My Applications] Applications found:", apps)
        console.log("[My Applications] Error:", appsError)

        if (appsError || !apps || apps.length === 0) {
            setApplications([])
            setIsLoading(false)
            return
        }

        // Step 2: Fetch job details for each application
        const jobIds = apps.map(a => a.job_id)
        const { data: jobs } = await supabase
            .from("jobs")
            .select("id, title, department, location, type, status")
            .in("id", jobIds)

        console.log("[My Applications] Jobs found:", jobs)

        // Step 3: Combine the data
        const jobsMap = new Map(jobs?.map(j => [j.id, j]) || [])
        const combined: JobApplication[] = apps.map(app => {
            const job = jobsMap.get(app.job_id)

            // Determine effective status: if job is deleted/expired, override application status for display
            let effectiveStatus = app.status;
            if (job) {
                if (job.status === 'DELETED') effectiveStatus = 'JOB_DELETED';
                else if (job.status === 'EXPIRED') effectiveStatus = 'JOB_EXPIRED';
            } else {
                // If job not found in map, it might be hard deleted (though we use soft delete)
                // But soft delete keeps it in table. If hard deleted, job=undefined.
                if (app.status === 'JOB_DELETED') effectiveStatus = 'JOB_DELETED'; // keep if already set
            }

            return {
                id: app.id,
                job_id: app.job_id,
                status: effectiveStatus,
                created_at: app.applied_at, // Map applied_at to created_at for display
                job_title: job?.title || (effectiveStatus === 'JOB_DELETED' ? "Deleted Job" : "Unknown Job"),
                job_department: job?.department || "N/A",
                job_location: job?.location || "",
                job_type: job?.type || "",
            }
        })

        setApplications(combined)
        setIsLoading(false)
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <HeaderNavigation />

            <main className="flex-1 pt-24 pb-16">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 py-10 mb-8">
                    <div className="container mx-auto px-4">
                        <Link href="/profile" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Profile
                        </Link>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                    <div className="p-2.5 bg-primary/10 rounded-xl">
                                        <FileCheck className="w-7 h-7 text-primary" />
                                    </div>
                                    My Applications
                                </h1>
                                <p className="text-muted-foreground mt-2">Track the status of your job applications</p>
                            </div>

                            {/* Limit Status Card */}
                            <div className="bg-white border rounded-lg p-3 shadow-sm flex items-center gap-4">
                                <div className="text-right">
                                    <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Daily Limit</div>
                                    <div className={`text-lg font-bold ${dailyCount >= 10 ? 'text-red-600' : 'text-gray-900'}`}>
                                        {dailyCount} / 10
                                    </div>
                                </div>
                                <div className="h-8 w-px bg-gray-200"></div>
                                <div>
                                    <div className="text-xs text-muted-foreground">Resets in</div>
                                    <div className="text-sm font-medium">{getResetTime()}</div>
                                </div>
                            </div>

                            <Button asChild>
                                <Link href="/jobs">
                                    Browse Open Jobs <ChevronRight className="w-4 h-4 ml-1" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 max-w-4xl">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <Card key={i} className="overflow-hidden">
                                    <CardContent className="p-5 md:p-6">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                            <div className="flex-1 space-y-3">
                                                <Skeleton className="h-5 w-24 rounded-full" />
                                                <Skeleton className="h-6 w-3/4" />
                                                <div className="flex gap-4">
                                                    <Skeleton className="h-4 w-20" />
                                                    <Skeleton className="h-4 w-20" />
                                                    <Skeleton className="h-4 w-24" />
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-3">
                                                <Skeleton className="h-6 w-24 rounded-full" />
                                                <Skeleton className="h-8 w-24" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : applications.length === 0 ? (
                        <Card className="text-center py-16 border-dashed">
                            <CardContent className="pt-6">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Briefcase className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Applications Yet</h3>
                                <p className="text-muted-foreground mb-6">You haven't applied to any jobs. Start exploring opportunities!</p>
                                <Button asChild>
                                    <Link href="/jobs">View Open Positions</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {applications.map((app) => {
                                const status = statusConfig[app.status] || statusConfig.PENDING
                                return (
                                    <Card key={app.id} className="hover:shadow-lg transition-all duration-300 overflow-hidden">
                                        <CardContent className="p-5 md:p-6">
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge variant="outline" className="text-xs font-medium">
                                                            {app.job_department}
                                                        </Badge>
                                                    </div>

                                                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                                                        {app.job_title}
                                                    </h3>

                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-3.5 h-3.5" /> {app.job_location}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5" /> {app.job_type}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3.5 h-3.5" /> Applied {formatDistanceToNow(new Date(app.created_at))} ago
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-start md:items-end gap-3">
                                                    <Badge className={`${status.bgColor} ${status.color} border px-3 py-1 text-sm font-semibold`}>
                                                        {status.label}
                                                    </Badge>
                                                    <Button variant="outline" size="sm" asChild className="text-xs">
                                                        <Link href={`/jobs/${app.job_id}`}>
                                                            View Job <ExternalLink className="w-3 h-3 ml-1.5" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    )
}
