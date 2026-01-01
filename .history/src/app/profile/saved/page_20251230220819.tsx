"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { getUserOnce } from "@/lib/supabase/auth-client"
import { useRouter } from "next/navigation"
import HeaderNavigation from "@/components/sections/header-navigation"
import Footer from "@/components/sections/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Bookmark, MapPin, Clock, Briefcase, ArrowLeft, Loader2, Trash2,
    ExternalLink, CheckCircle2, Building2, Calendar
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

interface SavedJob {
    id: string
    job_id: string
    saved_at: string
    job: {
        id: string
        title: string
        department: string
        location: string
        type: string
        status: string
        created_at: string
    }
}

export default function SavedJobsPage() {
    const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
    const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set())
    const [isLoading, setIsLoading] = useState(true)

    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        fetchSavedJobs()
    }, [])

    const fetchSavedJobs = async () => {
        setIsLoading(true)

        const user = await getUserOnce()

        if (!user) {
            router.push("/auth/login")
            return
        }

        // Fetch saved jobs
        const { data: saved, error } = await supabase
            .from("saved_jobs")
            .select("id, job_id, saved_at")
            .eq("user_id", user.id)
            .order("saved_at", { ascending: false })

        if (error) {
            console.error("Error fetching saved jobs:", error)
            setIsLoading(false)
            return
        }

        // Fetch job details
        const jobIds = saved?.map((s: any) => s.job_id) || []
        const { data: jobs } = await supabase
            .from("jobs")
            .select("id, title, department, location, type, status, created_at")
            .in("id", jobIds)

        const jobsMap = new Map((jobs?.map((j: any) => [j.id, j]) || []) as any)

        const combinedData: SavedJob[] = saved?.map((s: any) => ({
            id: s.id,
            job_id: s.job_id,
            saved_at: s.saved_at,
            job: jobsMap.get(s.job_id) || {
                id: s.job_id,
                title: "Unknown Job",
                department: "",
                location: "",
                type: "",
                status: "CLOSED",
                created_at: s.saved_at
            }
        })) || []

        setSavedJobs(combinedData)

        // Fetch applied jobs
        const { data: applications } = await supabase
            .from("job_applications")
            .select("job_id")
            .eq("user_id", user.id)

        if (applications) {
            setAppliedJobIds(new Set((applications as any).map((a: any) => a.job_id)))
        }

        setIsLoading(false)
    }

    const unsaveJob = async (savedJobId: string, jobId: string) => {
        const { error } = await supabase
            .from("saved_jobs")
            .delete()
            .eq("id", savedJobId)

        if (!error) {
            setSavedJobs(prev => prev.filter(s => s.id !== savedJobId))
            toast("Job removed from saved")
        } else {
            toast("Failed to remove job")
        }
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100">
            <HeaderNavigation />

            <main className="flex-1 pt-24 pb-16">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-gray-200 py-12 mb-8">
                    <div className="container mx-auto px-4">
                        <Link href="/profile" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Profile
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-2xl shadow-sm">
                                <Bookmark className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-gray-900">Saved Jobs</h1>
                                <p className="text-muted-foreground mt-1 text-lg">
                                    {savedJobs.length} job{savedJobs.length !== 1 ? 's' : ''} saved
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 max-w-4xl">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                            <p className="text-muted-foreground">Loading saved jobs...</p>
                        </div>
                    ) : savedJobs.length === 0 ? (
                        <Card className="text-center py-20 border-dashed border-2 bg-white/50">
                            <CardContent className="pt-6">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Bookmark className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-2xl font-semibold text-gray-700 mb-3">No Saved Jobs</h3>
                                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                                    Save jobs you're interested in to review them later.
                                </p>
                                <Button size="lg" asChild className="shadow-lg">
                                    <Link href="/jobs">
                                        Browse Jobs
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {savedJobs.map((saved) => {
                                const isApplied = appliedJobIds.has(saved.job_id)
                                const isClosed = saved.job.status !== "OPEN"

                                return (
                                    <Card key={saved.id} className={`overflow-hidden transition-all hover:shadow-lg ${isClosed ? 'opacity-60' : ''}`}>
                                        <CardContent className="p-6">
                                            <div className="flex items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                        {isApplied && (
                                                            <Badge className="bg-green-100 text-green-700 border-0">
                                                                <CheckCircle2 className="w-3 h-3 mr-1" /> Applied
                                                            </Badge>
                                                        )}
                                                        {isClosed && (
                                                            <Badge variant="secondary">Closed</Badge>
                                                        )}
                                                    </div>

                                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                                        <Link href={`/jobs/${saved.job_id}`} className="hover:text-primary transition-colors">
                                                            {saved.job.title}
                                                        </Link>
                                                    </h3>

                                                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                                                        <span className="flex items-center gap-1.5">
                                                            <Building2 className="w-4 h-4" /> {saved.job.department}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <MapPin className="w-4 h-4" /> {saved.job.location}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <Clock className="w-4 h-4" /> {saved.job.type}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            Posted {formatDistanceToNow(new Date(saved.job.created_at))} ago
                                                        </span>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1">
                                                            <Bookmark className="w-3.5 h-3.5" />
                                                            Saved {formatDistanceToNow(new Date(saved.saved_at))} ago
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    {!isApplied && !isClosed && (
                                                        <Button size="sm" asChild>
                                                            <Link href={`/jobs/${saved.job_id}`}>
                                                                Apply Now
                                                            </Link>
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => unsaveJob(saved.id, saved.job_id)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-1" /> Remove
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
