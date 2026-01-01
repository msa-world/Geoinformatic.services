"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Job } from "@/components/profile/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Edit2, Trash2, Users, Briefcase, Search, Clock } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { useRef } from "react"

export default function AdminJobsPage() {
    const [jobs, setJobs] = useState<Job[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [currentJob, setCurrentJob] = useState<Partial<Job>>({})
    const [searchQuery, setSearchQuery] = useState("")

    const supabase = createClient()
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchJobs()
    }, [])

    useGSAP(() => {
        if (!isLoading && jobs.length > 0) {
            gsap.from(".job-card", {
                y: 20,
                opacity: 0,
                duration: 0.4,
                stagger: {
                    amount: 0.8,
                    grid: "auto",
                    from: "start"
                },
                ease: "power2.out",
                clearProps: "all"
            })
        }
    }, { dependencies: [isLoading, jobs], scope: containerRef })

    const fetchJobs = async () => {
        setIsLoading(true)
        const token = localStorage.getItem("adminToken")

        try {
            const res = await fetch("/api/admin/jobs", {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (res.ok) {
                const data = await res.json()
                setJobs(data as Job[])
            } else {
                if (res.status !== 401) toast.error("Failed to fetch jobs")
            }
        } catch (error) {
            console.error("Error fetching jobs:", error)
            toast.error("Failed to fetch jobs")
        }
        setIsLoading(false)
    }

    const handleSave = async () => {
        if (!currentJob.title || !currentJob.department) {
            toast.error("Please fill in required fields")
            return
        }

        const jobData = {
            ...currentJob,
            status: currentJob.status || 'OPEN',
            type: currentJob.type || 'Full-time'
        }

        const token = localStorage.getItem("adminToken")

        try {
            const method = currentJob.id ? "PUT" : "POST"
            const res = await fetch("/api/admin/jobs", {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(jobData)
            })

            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.message || "Failed to save job")
            }

            toast.success("Job saved successfully")
            setIsDialogOpen(false)
            fetchJobs()
            setCurrentJob({})
        } catch (error: any) {
            console.error("Error saving job:", error)
            toast.error(error.message || "Failed to save job")
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this job?")) return

        const token = localStorage.getItem("adminToken")

        try {
            const res = await fetch(`/api/admin/jobs?id=${id}`, {
                method: "DELETE",
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!res.ok) {
                throw new Error("Failed to delete job")
            }

            toast.success("Job deleted")
            fetchJobs()
        } catch (error) {
            console.error("Error deleting job:", error)
            toast.error("Failed to delete job")
        }
    }

    const [viewJob, setViewJob] = useState<Job | null>(null)

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.department.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="h-full overflow-y-auto min-h-0 bg-slate-50/50 p-6 md:p-10" ref={containerRef}>
            <div className="container mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Job Board</h1>
                        <p className="text-muted-foreground mt-1">Manage open positions and track recruitment progress.</p>
                    </div>
                    <div className="flex gap-3">
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => setCurrentJob({})} className="bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-primary/40 transition-all rounded-full px-6">
                                    <Plus className="mr-2 h-4 w-4" /> Post New Job
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>{currentJob.id ? "Edit Job" : "Post New Job"}</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Job Title</Label>
                                            <Input
                                                value={currentJob.title || ""}
                                                onChange={e => setCurrentJob({ ...currentJob, title: e.target.value })}
                                                placeholder="e.g. GIS Analyst"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Department</Label>
                                            <Input
                                                value={currentJob.department || ""}
                                                onChange={e => setCurrentJob({ ...currentJob, department: e.target.value })}
                                                placeholder="e.g. Engineering"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Location</Label>
                                            <Input
                                                value={currentJob.location || ""}
                                                onChange={e => setCurrentJob({ ...currentJob, location: e.target.value })}
                                                placeholder="e.g. Remote / New York"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Type</Label>
                                            <Select
                                                value={currentJob.type}
                                                onValueChange={v => setCurrentJob({ ...currentJob, type: v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Full-time">Full-time</SelectItem>
                                                    <SelectItem value="Part-time">Part-time</SelectItem>
                                                    <SelectItem value="Contract">Contract</SelectItem>
                                                    <SelectItem value="Internship">Internship</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Textarea
                                            className="min-h-[100px]"
                                            value={currentJob.description || ""}
                                            onChange={e => setCurrentJob({ ...currentJob, description: e.target.value })}
                                            placeholder="Job responsibilities..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Requirements</Label>
                                        <Textarea
                                            className="min-h-[100px]"
                                            value={currentJob.requirements || ""}
                                            onChange={e => setCurrentJob({ ...currentJob, requirements: e.target.value })}
                                            placeholder="Skills and qualifications..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Application Link (Optional)</Label>
                                        <Input
                                            value={currentJob.apply_link || ""}
                                            onChange={e => setCurrentJob({ ...currentJob, apply_link: e.target.value })}
                                            placeholder="https://third-party-site.com/apply"
                                        />
                                        <p className="text-xs text-muted-foreground">If provided, applicants will be redirected here.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <Select
                                            value={currentJob.status || "OPEN"}
                                            onValueChange={v => setCurrentJob({ ...currentJob, status: v as any })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="OPEN">Open</SelectItem>
                                                <SelectItem value="CLOSED">Closed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={handleSave}>Save Job</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid md:grid-cols-3 gap-6">
                    <Card className="col-span-full md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl border-none overflow-hidden relative group">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/30 transition-all duration-700"></div>
                        <CardContent className="h-full flex flex-col justify-center py-8 px-8 relative z-10">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-slate-400 font-medium tracking-wide uppercase text-xs mb-1">Total Active Positions</p>
                                    <h2 className="text-4xl font-bold tracking-tight text-white">{jobs.filter(j => j.status === 'OPEN').length}</h2>
                                    <p className="text-slate-300 mt-2 max-w-md text-sm leading-relaxed">
                                        You currently have {jobs.filter(j => j.status === 'OPEN').length} open roles accepting applications.
                                    </p>
                                </div>
                                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
                                    <Briefcase className="w-6 h-6 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all">
                        <CardContent className="h-full flex flex-col justify-center p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-semibold text-slate-700">Quick Search</h3>
                                <Search className="w-4 h-4 text-slate-400" />
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                <Input
                                    placeholder="Search jobs..."
                                    className="pl-9 border-slate-200 bg-slate-50 focus:bg-white transition-colors"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* View Job Modal (Read Only) */}
                <Dialog open={!!viewJob} onOpenChange={(open) => !open && setViewJob(null)}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-2xl">{viewJob?.title}</DialogTitle>
                            <CardDescription className="text-base flex items-center gap-2 mt-2">
                                <Briefcase className="w-4 h-4" /> {viewJob?.department}
                                <span className="mx-1">•</span>
                                <Badge variant="outline">{viewJob?.type}</Badge>
                                <span className="mx-1">•</span>
                                <Badge className={viewJob?.status === 'OPEN' ? 'bg-green-500' : 'bg-gray-500'}>{viewJob?.status}</Badge>
                            </CardDescription>
                        </DialogHeader>

                        <div className="grid gap-6 py-4">
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div className="bg-muted/40 p-3 rounded-lg">
                                    <span className="text-muted-foreground block mb-1">Location</span>
                                    <span className="font-medium">{viewJob?.location}</span>
                                </div>
                                <div className="bg-muted/40 p-3 rounded-lg">
                                    <span className="text-muted-foreground block mb-1">Posted Date</span>
                                    <span className="font-medium">{viewJob?.created_at ? new Date(viewJob.created_at).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg border-b pb-2">Description</h3>
                                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                    {viewJob?.description}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg border-b pb-2">Requirements</h3>
                                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                    {viewJob?.requirements}
                                </div>
                            </div>

                            {viewJob?.apply_link && (
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/50">
                                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium block mb-1">External Application Link</span>
                                    <a href={viewJob.apply_link} target="_blank" rel="noreferrer" className="text-sm underline break-all">
                                        {viewJob.apply_link}
                                    </a>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button onClick={() => setViewJob(null)}>Close</Button>
                            <Button variant="secondary" onClick={() => {
                                if (viewJob) {
                                    setCurrentJob(viewJob)
                                    setViewJob(null)
                                    setIsDialogOpen(true)
                                }
                            }}>
                                <Edit2 className="w-4 h-4 mr-2" /> Edit Job
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {isLoading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Card key={i} className="flex flex-col border border-slate-200">
                                <CardHeader className="pb-4 pl-6">
                                    <div className="space-y-2 w-full">
                                        <Skeleton className="h-6 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6 flex-1 flex flex-col pl-6">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-1/3" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                        {filteredJobs.length === 0 && (
                            <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                                <p>No jobs found matching your search.</p>
                            </div>
                        )}
                        {filteredJobs.map((job, index) => (
                            <Card
                                key={job.id}
                                className="job-card group bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-200 border-l-4 border-l-transparent hover:border-l-primary flex flex-col overflow-hidden"
                            >
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <CardTitle className="text-lg font-bold leading-tight mb-1 text-slate-900 group-hover:text-primary transition-colors">{job.title}</CardTitle>
                                            <CardDescription className="flex items-center gap-1.5 font-medium text-slate-500">
                                                <Briefcase className="w-3.5 h-3.5" /> {job.department}
                                            </CardDescription>
                                        </div>
                                        <Badge variant={job.status === 'OPEN' ? 'default' : 'secondary'} className={`shrink-0 ${job.status === 'OPEN' ? 'bg-green-100 text-green-700 hover:bg-green-200 border-0' : ''}`}>
                                            {job.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6 flex-1 flex flex-col">
                                    <div className="text-sm text-slate-500 flex flex-wrap gap-y-2 gap-x-4">
                                        <span className="flex items-center gap-2 truncate"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> {job.location}</span>
                                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> {job.type}</span>
                                        <span className="flex items-center gap-2 text-xs text-slate-400 w-full pt-2">
                                            <Clock className="w-3 h-3 mr-1" /> Posted {new Date(job.created_at).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-slate-50 grid grid-cols-2 gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                                        <Button size="sm" variant="outline" className="w-full border-slate-200 hover:bg-slate-50 hover:text-primary hover:border-primary/30" onClick={() => setViewJob(job)}>
                                            Details
                                        </Button>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="secondary" className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600" onClick={() => {
                                                setCurrentJob(job)
                                                setIsDialogOpen(true)
                                            }}>
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button size="sm" variant="ghost" className="text-slate-400 hover:text-red-600 hover:bg-red-50 px-2" onClick={() => handleDelete(job.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
