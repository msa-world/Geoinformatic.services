"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { JobApplication } from "@/components/profile/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
    ArrowLeft, User, Mail, Phone, ExternalLink, Briefcase, Users, MessageSquare,
    Send, CheckCircle2, XCircle, Clock, Search, Filter, Calendar, Paperclip,
    Download, Maximize2, MapPin, Linkedin, Github, Globe, GraduationCap, Award, FileText
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

export default function AdminApplicationsPage() {
    const [applications, setApplications] = useState<JobApplication[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("ALL")
    const [jobFilter, setJobFilter] = useState<string>("ALL")
    const [debouncedSearch, setDebouncedSearch] = useState("")

    const containerRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    useEffect(() => {
        fetchApplications()
    }, [])

    const fetchApplications = async () => {
        setIsLoading(true)
        const token = localStorage.getItem("adminToken")

        try {
            const res = await fetch("/api/admin/jobs/applications", {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (res.ok) {
                const data = await res.json()
                setApplications(data as JobApplication[])
            } else {
                if (res.status !== 401) toast.error("Failed to fetch applications")
            }
        } catch (error) {
            console.error("Error fetching applications:", error)
            toast.error("Failed to fetch applications")
        }
        setIsLoading(false)
    }

    const updateStatus = async (id: string, newStatus: string) => {
        const token = localStorage.getItem("adminToken")

        try {
            const res = await fetch("/api/admin/jobs/applications", {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ id, status: newStatus })
            })

            if (!res.ok) throw new Error("Failed to update status")

            toast.success(`Application marked as ${newStatus}`)
            setApplications(apps => apps.map(a => a.id === id ? { ...a, status: newStatus as any } : a))
        } catch (error) {
            toast.error("Failed to update status")
        }
    }

    const filteredApplications = applications.filter(app => {
        const matchesStatus = statusFilter === "ALL" || app.status === statusFilter
        const matchesJob = jobFilter === "ALL" || app.job?.title === jobFilter
        const matchesSearch = app.profile?.full_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            app.profile?.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            app.job?.title?.toLowerCase().includes(debouncedSearch.toLowerCase())

        return matchesStatus && matchesJob && matchesSearch
    })

    useGSAP(() => {
        if (!isLoading && applications.length > 0) {
            gsap.from(".app-card", {
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
    }, { dependencies: [isLoading, applications], scope: containerRef })

    const uniqueJobs = Array.from(new Set(applications.map(app => app.job?.title).filter(Boolean)))

    const statusCounts = {
        ALL: applications.length,
        PENDING: applications.filter(a => a.status === 'PENDING').length,
        REVIEWING: applications.filter(a => a.status === 'REVIEWING').length,
        SHORTLISTED: applications.filter(a => a.status === 'SHORTLISTED').length,
        ACCEPTED: applications.filter(a => a.status === 'ACCEPTED').length,
        REJECTED: applications.filter(a => a.status === 'REJECTED').length,
    }

    return (
        <div className="h-full overflow-y-auto bg-slate-50 p-6 md:p-8" ref={containerRef}>
            <div className="container mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Applications</h1>
                            <Badge variant="secondary" className="bg-slate-200 text-slate-700 ml-2 rounded-full px-3">{applications.length}</Badge>
                        </div>
                        <p className="text-slate-500">Review, track, and manage candidate applications.</p>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-10 backdrop-blur-xl bg-white/80">

                    {/* Status Tabs */}
                    <div className="flex p-1 overflow-x-auto no-scrollbar w-full xl:w-auto">
                        {[
                            { id: 'ALL', label: 'All', count: statusCounts.ALL },
                            { id: 'PENDING', label: 'New', count: statusCounts.PENDING },
                            { id: 'REVIEWING', label: 'Reviewing', count: statusCounts.REVIEWING },
                            { id: 'SHORTLISTED', label: 'Shortlisted', count: statusCounts.SHORTLISTED },
                            { id: 'ACCEPTED', label: 'Hired', count: statusCounts.ACCEPTED },
                            { id: 'REJECTED', label: 'Rejected', count: statusCounts.REJECTED },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setStatusFilter(tab.id)}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap
                                    ${statusFilter === tab.id
                                        ? 'bg-slate-900 text-white shadow-md'
                                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}
                                `}
                            >
                                {tab.label}
                                <span className={`
                                    text-[10px] px-1.5 py-0.5 rounded-full 
                                    ${statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600 group-hover:bg-slate-300'}
                                `}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    <Separator orientation="vertical" className="hidden xl:block h-8 bg-slate-200" />

                    {/* Search & Job Filter */}
                    <div className="flex gap-2 w-full xl:w-auto p-2 xl:p-0">
                        <div className="relative flex-1 xl:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search candidates..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:outline-none transition-all"
                            />
                        </div>
                        <Select value={jobFilter} onValueChange={setJobFilter}>
                            <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Briefcase className="w-3.5 h-3.5" />
                                    <SelectValue placeholder="All Roles" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Roles</SelectItem>
                                {uniqueJobs.map(job => (
                                    <SelectItem key={job} value={job as string}>{job}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Content Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <Card key={i} className="border border-slate-200 bg-white h-48">
                                <CardHeader className="flex flex-row items-center gap-4">
                                    <Skeleton className="w-12 h-12 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                        {filteredApplications.length === 0 && (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <Users className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900">No applications found</h3>
                                <p>Try adjusting your filters or search terms.</p>
                            </div>
                        )}

                        {filteredApplications.map(app => (
                            <Dialog key={app.id}>
                                <DialogTrigger asChild>
                                    <Card className="app-card group relative cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white border border-slate-200 hover:border-primary/50 rounded-xl">
                                        {/* Status Line */}
                                        <div className={`absolute top-0 left-0 w-full h-1 transition-all duration-300 
                                            ${app.status === 'ACCEPTED' ? 'bg-green-500' :
                                                app.status === 'REJECTED' ? 'bg-red-500' :
                                                    app.status === 'SHORTLISTED' ? 'bg-purple-500' :
                                                        'bg-slate-300 group-hover:bg-primary'}`}
                                        />

                                        <div className="p-6">
                                            {/* Header */}
                                            <div className="flex justify-between items-start mb-4">
                                                <Avatar className="w-14 h-14 border-2 border-white shadow-md">
                                                    <AvatarImage src={app.profile?.avatar_url} className="object-cover" />
                                                    <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-lg">
                                                        {app.profile?.full_name?.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <Badge className={`
                                                    ${app.status === 'PENDING' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' :
                                                        app.status === 'SHORTLISTED' ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' :
                                                            app.status === 'ACCEPTED' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                                                app.status === 'REJECTED' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                                                                    'bg-slate-100 text-slate-700 hover:bg-slate-200'}
                                                    border-0 font-semibold px-2.5 py-0.5 rounded-lg
                                                `}>
                                                    {app.status === 'PENDING' ? 'New' : app.status}
                                                </Badge>
                                            </div>

                                            {/* Details */}
                                            <div className="space-y-1.5 mb-4">
                                                <h3 className="font-bold text-lg text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">{app.profile?.full_name}</h3>
                                                <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                                                    <Briefcase className="w-3.5 h-3.5" /> {app.job?.title}
                                                </p>
                                                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                                                    <Calendar className="w-3 h-3" /> {new Date(app.applied_at).toLocaleDateString()}
                                                </p>
                                            </div>

                                            {/* Footer Info */}
                                            <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-50">
                                                <span className="flex items-center gap-1 text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Review Application <ArrowLeft className="w-3 h-3 rotate-180" />
                                                </span>
                                            </div>
                                        </div>
                                    </Card>
                                </DialogTrigger>

                                {/* WIDE MODAL IMPLEMENTATION */}
                                <DialogContent className="max-w-[95vw] lg:max-w-[1400px] w-full h-[95vh] lg:h-[90vh] p-0 gap-0 overflow-hidden outline-none bg-slate-50 flex flex-col font-sans border-0 shadow-2xl rounded-2xl">
                                    {/* Modal Header */}
                                    <DialogHeader className="p-6 pb-4 shrink-0 bg-white border-b border-slate-200 flex flex-row items-center justify-between space-y-0 relative z-20">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-3 h-12 rounded-full ${app.status === 'ACCEPTED' ? 'bg-green-500' :
                                                    app.status === 'REJECTED' ? 'bg-red-500' :
                                                        app.status === 'SHORTLISTED' ? 'bg-purple-500' :
                                                            'bg-amber-500'
                                                }`} />
                                            <div>
                                                <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                                    {app.profile?.full_name}
                                                    <Badge variant="outline" className="text-sm font-normal text-slate-500 border-slate-200">
                                                        ID: {app.id.slice(0, 8)}
                                                    </Badge>
                                                </DialogTitle>
                                                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-1 text-sm text-slate-500">
                                                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                                                        <Briefcase className="w-4 h-4 text-primary" /> {app.job?.title}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Calendar className="w-4 h-4 text-slate-400" /> Applied {new Date(app.applied_at).toLocaleDateString()}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <MapPin className="w-4 h-4 text-slate-400" /> Remote / Global
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 rounded-full h-10 w-10">
                                                    <XCircle className="w-7 h-7" />
                                                </Button>
                                            </DialogTrigger>
                                        </div>
                                    </DialogHeader>

                                    {/* Modal Body - 2 Column Grid */}
                                    <div className="flex-1 overflow-hidden flex flex-col lg:grid lg:grid-cols-12 relative w-full bg-slate-50">

                                        {/* LEFT MAIN COLUMN (Profile & Detailed Info) */}
                                        <div className="lg:col-span-9 h-full overflow-y-auto custom-scrollbar p-6 space-y-8">

                                            {/* Candidate Basic Info Card */}
                                            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                                                <div className="flex flex-col md:flex-row gap-8">
                                                    {/* Avatar & Socials */}
                                                    <div className="flex flex-col items-center gap-4 shrink-0">
                                                        <Avatar className="w-32 h-32 border-4 border-slate-50 shadow-inner">
                                                            <AvatarImage src={app.profile?.avatar_url} className="object-cover" />
                                                            <AvatarFallback className="text-4xl bg-slate-100 text-slate-400 font-bold">
                                                                {app.profile?.full_name?.charAt(0)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex gap-2">
                                                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-slate-200 text-slate-500 hover:text-[#0077b5] hover:border-[#0077b5]">
                                                                <Linkedin className="w-4 h-4" />
                                                            </Button>
                                                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-slate-200 text-slate-500 hover:text-black hover:border-black">
                                                                <Github className="w-4 h-4" />
                                                            </Button>
                                                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-slate-200 text-slate-500 hover:text-primary hover:border-primary">
                                                                <Globe className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* Contact & Bio */}
                                                    <div className="flex-1 space-y-6">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="space-y-1">
                                                                <label className="text-xs font-bold text-slate-400 uppercase">Email Address</label>
                                                                <div className="flex items-center gap-2 text-slate-900 font-medium">
                                                                    <Mail className="w-4 h-4 text-slate-400" />
                                                                    {app.profile?.email}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-xs font-bold text-slate-400 uppercase">Phone Number</label>
                                                                <div className="flex items-center gap-2 text-slate-900 font-medium">
                                                                    <Phone className="w-4 h-4 text-slate-400" />
                                                                    +1 (555) 000-0000 <span className="text-xs text-slate-400 font-normal">(Placeholder)</span>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-xs font-bold text-slate-400 uppercase">Current Role</label>
                                                                <div className="flex items-center gap-2 text-slate-900 font-medium">
                                                                    <User className="w-4 h-4 text-slate-400" />
                                                                    GIS Analyst <span className="text-xs text-slate-400 font-normal">(Previous)</span>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-xs font-bold text-slate-400 uppercase">Education</label>
                                                                <div className="flex items-center gap-2 text-slate-900 font-medium">
                                                                    <GraduationCap className="w-4 h-4 text-slate-400" />
                                                                    M.Sc. Geoinformatics
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Cover Letter Box */}
                                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                                            <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                                                                <FileText className="w-4 h-4 text-primary" /> Cover Letter / Summary
                                                            </h4>
                                                            <p className="text-sm text-slate-600 leading-relaxed">
                                                                I am highly interested in this position and believe my 5 years of experience in GIS analysis make me a perfect fit. I have worked with similar stacks including PostGIS, QGIS, and Python scripting for automation. In my previous role at GeoTech Solutions, I led a team of 3 analysts to complete a city-wide mapping project ahead of schedule. I am eager to bring this expertise to your team.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Skills & Experience Section */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Skills */}
                                                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                                                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                        <Award className="w-5 h-5 text-primary" /> Technical Skills
                                                    </h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {["ArcGIS Pro", "QGIS", "Python", "PostgreSQL/PostGIS", "Remote Sensing", "React.js", "Leaflet", "Data Analysis"].map((skill, i) => (
                                                            <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 px-3 py-1">
                                                                {skill}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Professional Metrics */}
                                                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                                                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                        <Briefcase className="w-5 h-5 text-primary" /> Professional Detail
                                                    </h3>
                                                    <div className="space-y-4">
                                                        <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                                                            <span className="text-sm text-slate-500 font-medium">Total Experience</span>
                                                            <span className="text-sm font-bold text-slate-900">5 Years</span>
                                                        </div>
                                                        <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                                                            <span className="text-sm text-slate-500 font-medium">Expected Salary</span>
                                                            <span className="text-sm font-bold text-slate-900">$65,000 / Year</span>
                                                        </div>
                                                        <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                                                            <span className="text-sm text-slate-500 font-medium">Notice Period</span>
                                                            <span className="text-sm font-bold text-slate-900">30 Days</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-slate-500 font-medium">English Proficiency</span>
                                                            <span className="text-sm font-bold text-slate-900">Native / Fluent</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Experience Timeline (Mock) */}
                                            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                                                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                                    <Clock className="w-5 h-5 text-primary" /> Experience History
                                                </h3>
                                                <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                                                    <div className="relative">
                                                        <div className="absolute -left-[1.6rem] w-3 h-3 rounded-full bg-primary ring-4 ring-white"></div>
                                                        <h4 className="font-bold text-slate-900 text-base">Senior GIS Analyst</h4>
                                                        <p className="text-sm text-primary font-medium">GeoTech Solutions Inc.</p>
                                                        <p className="text-xs text-slate-400 mt-1">2021 - Present</p>
                                                        <p className="text-sm text-slate-600 mt-2">Led a team of analysts in urban planning projects using ArcGIS and Python automation.</p>
                                                    </div>
                                                    <div className="relative">
                                                        <div className="absolute -left-[1.6rem] w-3 h-3 rounded-full bg-slate-300 ring-4 ring-white"></div>
                                                        <h4 className="font-bold text-slate-700 text-base">Junior Surveyor</h4>
                                                        <p className="text-sm text-slate-500 font-medium">MapWorks Ltd.</p>
                                                        <p className="text-xs text-slate-400 mt-1">2019 - 2021</p>
                                                        <p className="text-sm text-slate-600 mt-2">Conducted field surveys and processed LIDAR data for terrain modeling.</p>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>

                                        {/* RIGHT SIDEBAR (Actions & Status) */}
                                        <div className="lg:col-span-3 h-full bg-white border-l border-slate-200 p-0 flex flex-col shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)] z-10">

                                            {/* Status Header */}
                                            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Application Status</label>
                                                <Select value={app.status || 'PENDING'} onValueChange={(v) => updateStatus(app.id, v)}>
                                                    <SelectTrigger className="w-full h-12 bg-white border-slate-200 text-base font-medium shadow-sm hover:border-primary/50 transition-all">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${app.status === 'ACCEPTED' ? 'bg-green-500 shadow-green-200' :
                                                                    app.status === 'REJECTED' ? 'bg-red-500 shadow-red-200' :
                                                                        app.status === 'SHORTLISTED' ? 'bg-purple-500 shadow-purple-200' :
                                                                            'bg-amber-500 shadow-amber-200'
                                                                }`} />
                                                            <SelectValue />
                                                        </div>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="PENDING">New Application</SelectItem>
                                                        <SelectItem value="REVIEWING">Under Review</SelectItem>
                                                        <SelectItem value="SHORTLISTED">Shortlisted</SelectItem>
                                                        <SelectItem value="ACCEPTED">Hired</SelectItem>
                                                        <SelectItem value="REJECTED">Rejected</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Sidebar Content */}
                                            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                                                {/* Attachments */}
                                                <div className="space-y-3">
                                                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                                        <Paperclip className="w-4 h-4 text-slate-400" /> Attachments
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {app.profile?.cv_url ? (
                                                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group cursor-pointer hover:bg-white hover:border-primary/30 hover:shadow-md transition-all duration-200">
                                                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600 shrink-0">
                                                                    <FileText className="w-5 h-5" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-bold text-slate-900 truncate">Resume.pdf</p>
                                                                    <p className="text-[10px] text-slate-400 uppercase font-semibold">1.2 MB</p>
                                                                </div>
                                                                <a href={app.profile.cv_url} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-primary transition-colors">
                                                                    <Download className="w-4 h-4" />
                                                                </a>
                                                            </div>
                                                        ) : (
                                                            <div className="p-4 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs bg-slate-50">
                                                                No documents attached
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <Separator />

                                                {/* Score */}
                                                <div className="space-y-3">
                                                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                                        <Award className="w-4 h-4 text-slate-400" /> AI Match Score
                                                    </h4>
                                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                                                        <div className="text-3xl font-black text-slate-900 mb-1">85%</div>
                                                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                                            <div className="bg-green-500 h-full w-[85%] rounded-full"></div>
                                                        </div>
                                                        <p className="text-xs text-slate-500 mt-2 font-medium">Strong match for "GIS Analyst" requirements.</p>
                                                    </div>
                                                </div>

                                                <Separator />

                                                {/* Actions */}
                                                <div className="space-y-3">
                                                    <Button className="w-full justify-start gap-3 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-sm h-12 text-sm font-semibold">
                                                        <MessageSquare className="w-4 h-4 text-primary" />
                                                        Send Message
                                                    </Button>
                                                    <Button className="w-full justify-start gap-3 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-sm h-12 text-sm font-semibold">
                                                        <Phone className="w-4 h-4 text-primary" />
                                                        Schedule Interview
                                                    </Button>
                                                </div>

                                            </div>

                                            {/* Sidebar Footer */}
                                            <div className="p-4 border-t border-slate-100 bg-slate-50/80">
                                                <Button className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg h-12 font-bold transition-all hover:scale-[1.02] active:scale-[0.98]">
                                                    Save & Close
                                                </Button>
                                            </div>

                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
