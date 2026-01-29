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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Briefcase, MapPin, Clock, Calendar, Users, Plus, ArrowLeft,
    Loader2, Eye, FileText, Mail, Phone, CheckCircle2, XCircle, UserCheck,
    ExternalLink, ChevronDown, Building2, Filter, Trash2
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"

interface MyJob {
    id: string
    title: string
    department: string
    location: string
    type: string
    status: string
    created_at: string
    applicantCount: number
    applicants: Applicant[]
}

interface Applicant {
    id: string
    user_id: string
    status: string
    created_at: string
    full_name: string
    email: string
    phone_number: string
    avatar_url: string
    cv_url: string
    role: string
    bio: string
    skills: string[]
}

const applicationStatusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
    PENDING: { label: "Pending", color: "text-gray-700", bgColor: "bg-gray-100", icon: <Clock className="w-3.5 h-3.5" /> },
    REVIEWING: { label: "Reviewing", color: "text-blue-700", bgColor: "bg-blue-100", icon: <Eye className="w-3.5 h-3.5" /> },
    SHORTLISTED: { label: "Shortlisted", color: "text-purple-700", bgColor: "bg-purple-100", icon: <UserCheck className="w-3.5 h-3.5" /> },
    REJECTED: { label: "Rejected", color: "text-red-700", bgColor: "bg-red-100", icon: <XCircle className="w-3.5 h-3.5" /> },
    ACCEPTED: { label: "Accepted", color: "text-green-700", bgColor: "bg-green-100", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
}

export default function ManageMyJobsPage() {
    const [jobs, setJobs] = useState<MyJob[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
    const [activeJobTab, setActiveJobTab] = useState<string>("")
    const [statusFilter, setStatusFilter] = useState<string>("ALL")

    const router = useRouter()
    const supabase = createClient()
    const { toast } = useToast()

    useEffect(() => {
        fetchMyJobs()
    }, [])

    const fetchMyJobs = async () => {
        setIsLoading(true)

        const user = await getUserOnce()

        if (!user) {
            router.push("/auth/login")
            return
        }

        console.log("[Manage My Jobs] User ID:", user.id)

        const { data: myJobs, error: jobsError } = await supabase
            .from("jobs")
            .select("id, title, department, location, type, status, created_at, posted_by")
            .eq("posted_by", user.id)
            .neq("status", "DELETED") // Strictly exclude deleted jobs
            .order("created_at", { ascending: false })

        if (jobsError || !myJobs || myJobs.length === 0) {
            setJobs([])
            setIsLoading(false)
            return
        }

        const jobIds = myJobs.map(j => j.id)
        const { data: applications } = await supabase
            .from("job_applications")
            .select("id, job_id, user_id, status, applied_at")
            .in("job_id", jobIds)

        const userIds = [...new Set(applications?.map(a => a.user_id) || [])]
        const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, email, phone_number, avatar_url, cv_url, role, bio, skills")
            .in("id", userIds)

        const profilesMap = new Map(profiles?.map(p => [p.id, p]) || [])
        const applicationsMap = new Map<string, Applicant[]>()

        applications?.forEach(app => {
            const profile = profilesMap.get(app.user_id)
            const applicant: Applicant = {
                id: app.id,
                user_id: app.user_id,
                status: app.status,
                created_at: app.applied_at,
                full_name: profile?.full_name || "Unknown",
                email: profile?.email || "",
                phone_number: profile?.phone_number || "",
                avatar_url: profile?.avatar_url || "",
                cv_url: profile?.cv_url || "",
                role: profile?.role || "",
                bio: profile?.bio || "",
                skills: profile?.skills || [],
            }

            if (!applicationsMap.has(app.job_id)) {
                applicationsMap.set(app.job_id, [])
            }
            applicationsMap.get(app.job_id)!.push(applicant)
        })

        const combinedJobs: MyJob[] = myJobs.map(job => ({
            id: job.id,
            title: job.title,
            department: job.department,
            location: job.location,
            type: job.type,
            status: job.status,
            created_at: job.created_at,
            applicantCount: applicationsMap.get(job.id)?.length || 0,
            applicants: applicationsMap.get(job.id) || [],
        }))

        setJobs(combinedJobs)
        if (combinedJobs.length > 0) {
            setActiveJobTab(combinedJobs[0].id)
        }
        setIsLoading(false)
    }

    const handleDeleteJob = async (jobId: string) => {
        const { error } = await supabase
            .from('jobs')
            .update({ status: 'DELETED' }) // Soft delete
            .eq('id', jobId)

        if (error) {
            toast({ title: "Error", description: "Failed to delete job.", variant: "destructive" })
        } else {
            toast({ title: "Success", description: "Job deleted successfully." })
            fetchMyJobs() // Refresh list
        }
    }

    const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
        setIsUpdatingStatus(true)

        const { data, error } = await supabase
            .from("job_applications")
            .update({ status: newStatus })
            .eq("id", applicationId)
            .select()

        if (error) {
            console.error("Error updating status:", error)
            toast({ title: "Error", description: `Failed to update: ${error.message}`, variant: "destructive" })
        } else {
            toast({ title: "Status Updated", description: `Application marked as ${newStatus}.` })
            fetchMyJobs()
        }
        setIsUpdatingStatus(false)
        setSelectedApplicant(null)
    }

    const getInitials = (name?: string) => {
        if (!name) return "?"
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    }

    const getFilteredApplicants = (applicants: Applicant[]) => {
        if (statusFilter === "ALL") return applicants
        return applicants.filter(a => a.status === statusFilter)
    }

    const totalApplicants = jobs.reduce((acc, job) => acc + job.applicantCount, 0)

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100">
            <HeaderNavigation />

            <main className="flex-1 pt-24 pb-16">
                {/* Hero Header */}
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-gray-200 py-12 mb-8">
                    <div className="container mx-auto px-4">
                        <Link href="/profile" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Profile
                        </Link>
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div>
                                <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-4">
                                    <div className="p-3 bg-primary/10 rounded-2xl shadow-sm">
                                        <Briefcase className="w-8 h-8 text-primary" />
                                    </div>
                                    Manage My Jobs
                                </h1>
                                <p className="text-muted-foreground mt-3 text-lg">Review applications and manage your job postings</p>
                            </div>

                            {/* Stats Cards */}
                            <div className="flex gap-4">
                                <div className="bg-white rounded-xl border shadow-sm px-6 py-4 text-center min-w-[100px]">
                                    <p className="text-3xl font-bold text-primary">{jobs.length}</p>
                                    <p className="text-xs text-muted-foreground font-medium">Active Jobs</p>
                                </div>
                                <div className="bg-white rounded-xl border shadow-sm px-6 py-4 text-center min-w-[100px]">
                                    <p className="text-3xl font-bold text-green-600">{totalApplicants}</p>
                                    <p className="text-xs text-muted-foreground font-medium">Total Applicants</p>
                                </div>
                                <Button asChild className="shadow-lg h-auto py-4 px-6">
                                    <Link href="/jobs/new">
                                        <Plus className="w-5 h-5 mr-2" /> Post New Job
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4">
                    {isLoading ? (
                        <div className="grid lg:grid-cols-12 gap-6">
                            <div className="lg:col-span-4 xl:col-span-3">
                                <Card className="sticky top-24 shadow-lg border-0 overflow-hidden">
                                    <div className="p-4 border-b bg-gray-50/50">
                                        <Skeleton className="h-5 w-32" />
                                    </div>
                                    <div className="p-2 space-y-1">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className="p-4 space-y-2">
                                                <div className="flex justify-between">
                                                    <Skeleton className="h-5 w-3/4" />
                                                    <Skeleton className="h-5 w-16 rounded-full" />
                                                </div>
                                                <Skeleton className="h-3 w-1/2" />
                                                <div className="flex justify-between pt-1">
                                                    <Skeleton className="h-3 w-1/4" />
                                                    <Skeleton className="h-3 w-8" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                            <div className="lg:col-span-8 xl:col-span-9 space-y-6">
                                <Card className="shadow-lg border-0 overflow-hidden">
                                    <div className="p-6 space-y-4">
                                        <div className="flex justify-between">
                                            <div className="space-y-2 flex-1">
                                                <div className="flex gap-2">
                                                    <Skeleton className="h-5 w-16" />
                                                    <Skeleton className="h-5 w-24" />
                                                </div>
                                                <Skeleton className="h-8 w-3/4" />
                                                <div className="flex gap-4">
                                                    <Skeleton className="h-4 w-20" />
                                                    <Skeleton className="h-4 w-20" />
                                                    <Skeleton className="h-4 w-32" />
                                                </div>
                                            </div>
                                            <Skeleton className="h-9 w-32" />
                                        </div>
                                    </div>
                                </Card>
                                <Card className="shadow-lg border-0">
                                    <div className="p-4 border-b flex justify-between items-center">
                                        <Skeleton className="h-6 w-32" />
                                        <Skeleton className="h-9 w-40" />
                                    </div>
                                    <div className="p-0 divide-y">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="p-5 flex justify-between items-center">
                                                <div className="flex gap-4 items-center">
                                                    <Skeleton className="w-14 h-14 rounded-full" />
                                                    <div className="space-y-2">
                                                        <Skeleton className="h-5 w-40" />
                                                        <Skeleton className="h-4 w-24" />
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <Skeleton className="h-6 w-24 rounded-full" />
                                                    <Skeleton className="h-8 w-24" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </div>
                    ) : jobs.length === 0 ? (
                        <Card className="text-center py-20 border-dashed border-2 bg-white/50">
                            <CardContent className="pt-6">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Briefcase className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-2xl font-semibold text-gray-700 mb-3">No Jobs Posted Yet</h3>
                                <p className="text-muted-foreground mb-8 max-w-md mx-auto">Start attracting top talent by posting your first job opening.</p>
                                <Button size="lg" asChild className="shadow-lg">
                                    <Link href="/jobs/new">
                                        <Plus className="w-5 h-5 mr-2" /> Post Your First Job
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid lg:grid-cols-12 gap-6">
                            {/* Jobs Sidebar */}
                            <div className="lg:col-span-4 xl:col-span-3">
                                <Card className="sticky top-24 shadow-lg border-0 overflow-hidden">
                                    <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b py-4">
                                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-primary" />
                                            Your Job Listings
                                        </CardTitle>
                                    </CardHeader>
                                    <div className="divide-y max-h-[60vh] overflow-y-auto">
                                        {jobs.map((job) => (
                                            <button
                                                key={job.id}
                                                onClick={() => setActiveJobTab(job.id)}
                                                className={`w-full text-left p-4 transition-all duration-200 hover:bg-gray-50 ${activeJobTab === job.id
                                                    ? 'bg-primary/5 border-l-4 border-l-primary'
                                                    : 'border-l-4 border-l-transparent'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <h4 className="font-semibold text-gray-900 line-clamp-1">{job.title}</h4>
                                                    <Badge
                                                        variant={job.status === 'OPEN' ? 'default' : 'secondary'}
                                                        className="text-[10px] shrink-0"
                                                    >
                                                        {job.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" /> {job.location}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(new Date(job.created_at))} ago
                                                    </span>
                                                    <div className="flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-full">
                                                        <Users className="w-3 h-3 text-primary" />
                                                        <span className="text-xs font-semibold text-primary">{job.applicantCount}</span>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </Card>
                            </div>

                            {/* Applicants Main Area */}
                            <div className="lg:col-span-8 xl:col-span-9">
                                {jobs.filter(j => j.id === activeJobTab).map(job => (
                                    <div key={job.id} className="space-y-6">
                                        {/* Job Header Card */}
                                        <Card className="shadow-lg border-0 overflow-hidden">
                                            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Badge variant={job.status === 'OPEN' ? 'default' : 'secondary'}>
                                                                {job.status}
                                                            </Badge>
                                                            <span className="text-sm text-muted-foreground">{job.department}</span>
                                                        </div>
                                                        <h2 className="text-2xl font-bold text-gray-900">{job.title}</h2>
                                                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                                                            <span className="flex items-center gap-1.5">
                                                                <MapPin className="w-4 h-4" /> {job.location}
                                                            </span>
                                                            <span className="flex items-center gap-1.5">
                                                                <Clock className="w-4 h-4" /> {job.type}
                                                            </span>
                                                            <span className="flex items-center gap-1.5">
                                                                <Calendar className="w-4 h-4" /> Posted {formatDistanceToNow(new Date(job.created_at))} ago
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200">
                                                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        This action cannot be undone. This will permanently delete the job
                                                                        "<span className="font-semibold">{job.title}</span>" and remove all associated applications.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleDeleteJob(job.id)}
                                                                        className="bg-red-600 hover:bg-red-700"
                                                                    >
                                                                        Delete Job
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>

                                                        <Button variant="outline" size="sm" asChild className="shrink-0">
                                                            <Link href={`/jobs/${job.id}`}>
                                                                <Eye className="w-4 h-4 mr-2" /> View Job Page
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>

                                        {/* Applicants Section */}
                                        <Card className="shadow-lg border-0">
                                            <CardHeader className="border-b bg-gray-50/50 py-4">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <CardTitle className="text-lg flex items-center gap-2">
                                                        <Users className="w-5 h-5 text-primary" />
                                                        Applicants ({job.applicantCount})
                                                    </CardTitle>

                                                    {/* Status Filter */}
                                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                                        <SelectTrigger className="w-[180px] bg-white">
                                                            <Filter className="w-4 h-4 mr-2" />
                                                            <SelectValue placeholder="Filter by status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="ALL">All Statuses</SelectItem>
                                                            <SelectItem value="PENDING">Pending</SelectItem>
                                                            <SelectItem value="REVIEWING">Reviewing</SelectItem>
                                                            <SelectItem value="SHORTLISTED">Shortlisted</SelectItem>
                                                            <SelectItem value="ACCEPTED">Accepted</SelectItem>
                                                            <SelectItem value="REJECTED">Rejected</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </CardHeader>

                                            <CardContent className="p-0">
                                                {job.applicants.length === 0 ? (
                                                    <div className="text-center py-16 text-muted-foreground">
                                                        <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                                        <p className="text-lg font-medium">No applicants yet</p>
                                                        <p className="text-sm">Applicants will appear here when they apply</p>
                                                    </div>
                                                ) : getFilteredApplicants(job.applicants).length === 0 ? (
                                                    <div className="text-center py-12 text-muted-foreground">
                                                        <p>No applicants with "{statusFilter}" status</p>
                                                    </div>
                                                ) : (
                                                    <div className="divide-y">
                                                        {getFilteredApplicants(job.applicants).map((app) => {
                                                            const statusCfg = applicationStatusConfig[app.status] || applicationStatusConfig.PENDING
                                                            return (
                                                                <div
                                                                    key={app.id}
                                                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-gray-50/50 transition-colors"
                                                                >
                                                                    <div className="flex items-center gap-4">
                                                                        <Avatar className="w-14 h-14 border-2 border-white shadow-md">
                                                                            <AvatarImage src={app.avatar_url} />
                                                                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-lg">
                                                                                {getInitials(app.full_name)}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div>
                                                                            <p className="font-semibold text-gray-900 text-lg">{app.full_name}</p>
                                                                            <p className="text-sm text-muted-foreground">{app.role || app.email}</p>
                                                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                                                Applied {formatDistanceToNow(new Date(app.created_at))} ago
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-3 sm:pl-0 pl-[74px]">
                                                                        <Badge className={`${statusCfg.bgColor} ${statusCfg.color} border-0 gap-1.5 px-3 py-1`}>
                                                                            {statusCfg.icon} {statusCfg.label}
                                                                        </Badge>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => { setSelectedApplicant(app); setSelectedJobId(job.id); }}
                                                                            className="shadow-sm"
                                                                        >
                                                                            View Details
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />

            {/* Applicant Detail Dialog */}
            <Dialog open={!!selectedApplicant} onOpenChange={(open) => !open && setSelectedApplicant(null)}>
                <DialogContent className="sm:max-w-lg">
                    {selectedApplicant && (
                        <>
                            <DialogHeader className="pb-4 border-b">
                                <DialogTitle className="flex items-center gap-4">
                                    <Avatar className="w-16 h-16 border-2 border-white shadow-lg">
                                        <AvatarImage src={selectedApplicant.avatar_url} />
                                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white text-2xl font-bold">
                                            {getInitials(selectedApplicant.full_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-xl font-bold">{selectedApplicant.full_name}</p>
                                        <p className="text-sm font-normal text-muted-foreground">{selectedApplicant.role}</p>
                                    </div>
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-5 py-4">
                                {/* Contact Info */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="flex items-center gap-3 text-sm p-3 bg-gray-50 rounded-xl">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <Mail className="w-4 h-4 text-primary" />
                                        </div>
                                        <span className="truncate">{selectedApplicant.email}</span>
                                    </div>
                                    {selectedApplicant.phone_number && (
                                        <div className="flex items-center gap-3 text-sm p-3 bg-gray-50 rounded-xl">
                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                <Phone className="w-4 h-4 text-primary" />
                                            </div>
                                            <span>{selectedApplicant.phone_number}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Bio */}
                                {selectedApplicant.bio && (
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">About</p>
                                        <p className="text-sm text-gray-700 leading-relaxed">{selectedApplicant.bio}</p>
                                    </div>
                                )}

                                {/* Skills */}
                                {selectedApplicant.skills?.length > 0 && (
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Skills</p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedApplicant.skills.map(skill => (
                                                <Badge key={skill} variant="secondary" className="px-3 py-1">{skill}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* CV Link */}
                                {selectedApplicant.cv_url && (
                                    <Button variant="outline" className="w-full h-12" asChild>
                                        <a href={selectedApplicant.cv_url} target="_blank" rel="noopener noreferrer">
                                            <FileText className="w-5 h-5 mr-2" /> View Resume/CV
                                            <ExternalLink className="w-4 h-4 ml-auto" />
                                        </a>
                                    </Button>
                                )}

                                {/* Status Update */}
                                <div className="pt-4 border-t">
                                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Update Application Status</p>
                                    <Select
                                        value={selectedApplicant.status}
                                        onValueChange={(val) => updateApplicationStatus(selectedApplicant.id, val)}
                                        disabled={isUpdatingStatus}
                                    >
                                        <SelectTrigger className="w-full h-12">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PENDING">
                                                <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> Pending</span>
                                            </SelectItem>
                                            <SelectItem value="REVIEWING">
                                                <span className="flex items-center gap-2"><Eye className="w-4 h-4" /> Reviewing</span>
                                            </SelectItem>
                                            <SelectItem value="SHORTLISTED">
                                                <span className="flex items-center gap-2"><UserCheck className="w-4 h-4" /> Shortlisted</span>
                                            </SelectItem>
                                            <SelectItem value="ACCEPTED">
                                                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Accepted</span>
                                            </SelectItem>
                                            <SelectItem value="REJECTED">
                                                <span className="flex items-center gap-2"><XCircle className="w-4 h-4" /> Rejected</span>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setSelectedApplicant(null)}>Close</Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
