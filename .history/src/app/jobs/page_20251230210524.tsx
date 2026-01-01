"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import HeaderNavigation from "@/components/sections/header-navigation";
import Footer from "@/components/sections/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Briefcase,
    MapPin,
    Clock,
    Search,
    Filter,
    Bookmark,
    BookmarkCheck,
    ChevronRight,
    ArrowRight,
    Building2,
    Calendar,
    Layers,
    Sparkles,
    Loader2,
    Globe,
    Database,
    Satellite,
    DollarSign,
    Share2,
    Mail,
    ExternalLink,
    ChevronLeft,
    X,
    CheckCircle2,
    TrendingUp,
    Zap,
    Users
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Job, UserProfile } from "@/components/profile/types";
import { formatDistanceToNow, subDays, isAfter } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function LightIndeedJobsPage() {
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
    const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState("");
    const [locationSearch, setLocationSearch] = useState("");
    const [selectedType, setSelectedType] = useState("All");
    const [selectedDept, setSelectedDept] = useState("All");
    const [selectedSalary, setSelectedSalary] = useState("All");
    const [selectedDate, setSelectedDate] = useState("All");

    const supabase = createClient();
    const detailRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchJobsAndUserStates();
    }, []);

    useEffect(() => {
        filterJobs();
    }, [searchTerm, locationSearch, selectedType, selectedDept, selectedSalary, selectedDate, jobs]);

    const fetchJobsAndUserStates = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Jobs
            const { data, error } = await supabase
                .from("jobs")
                .select("*")
                .eq("status", "OPEN")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setJobs(data || []);
            if (data && data.length > 0) setSelectedJob(data[0]);

            // 2. Fetch User & States (use serialized getter to avoid concurrent refreshes)
            const { getUserOnce } = await import("@/lib/supabase/auth-client")
            const authUser = await getUserOnce()
            setUser(authUser);
            if (authUser) {
                // Saved Jobs
                const { data: saved, error: savedError } = await supabase
                    .from("saved_jobs")
                    .select("job_id")
                    .eq("user_id", authUser.id);
                if (savedError) {
                    console.error("Error fetching saved_jobs:", savedError);
                } else if (saved) {
                    setSavedJobIds(new Set(saved.map((s: any) => s.job_id)));
                }

                // Applications
                const { data: apps, error: appsError } = await supabase
                    .from("job_applications")
                    .select("job_id")
                    .eq("user_id", authUser.id);
                if (appsError) {
                    console.error("Error fetching job_applications:", appsError);
                } else if (apps) {
                    setAppliedJobIds(new Set(apps.map((a: any) => a.job_id)));
                }

                // Profile for matching
                const { data: profileData } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", authUser.id)
                    .single();
                setProfile(profileData);
            }
        } catch (error) {
            console.error("Error fetching jobs:", error);
            toast.error("Failed to load recruitment data");
        } finally {
            setIsLoading(false);
        }
    };

    const filterJobs = () => {
        let temp = [...jobs];

        if (searchTerm) {
            temp = temp.filter(j =>
                j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                j.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (locationSearch) {
            temp = temp.filter(j =>
                j.location.toLowerCase().includes(locationSearch.toLowerCase())
            );
        }

        if (selectedType !== "All") {
            temp = temp.filter(j => j.type === selectedType);
        }

        if (selectedDept !== "All") {
            temp = temp.filter(j => j.department === selectedDept);
        }

        // Salary Filter (Min Salary)
        if (selectedSalary !== "All") {
            const minV = parseInt(selectedSalary);
            temp = temp.filter(j => (j.salary_min || 0) >= minV);
        }

        // Date Filter
        if (selectedDate !== "All") {
            const days = parseInt(selectedDate);
            const limitDate = subDays(new Date(), days);
            temp = temp.filter(j => isAfter(new Date(j.created_at), limitDate));
        }

        setFilteredJobs(temp);

        // Auto-select logic
        if (temp.length > 0 && (!selectedJob || !temp.find(j => j.id === selectedJob.id))) {
            setSelectedJob(temp[0]);
        } else if (temp.length === 0) {
            setSelectedJob(null);
        }
    };

    const toggleSaveJob = async (e: React.MouseEvent, jobId: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            toast.error("Please sign in to save jobs");
            router.push(`/auth/login?redirect=/jobs`);
            return;
        }

        setIsSaving(jobId);
        const isSaved = savedJobIds.has(jobId);

        try {
            if (isSaved) {
                await supabase.from("saved_jobs").delete().eq("user_id", user.id).eq("job_id", jobId);
                const next = new Set(savedJobIds);
                next.delete(jobId);
                setSavedJobIds(next);
                toast.success("Removed from saved jobs");
            } else {
                await supabase.from("saved_jobs").insert([{ user_id: user.id, job_id: jobId }]);
                setSavedJobIds(new Set([...Array.from(savedJobIds), jobId]));
                toast.success("Job saved!");
            }
        } catch (err: any) {
            toast.error("Failed to update saved status");
        } finally {
            setIsSaving(null);
        }
    };

    const clearFilters = () => {
        setSearchTerm("");
        setLocationSearch("");
        setSelectedType("All");
        setSelectedDept("All");
        setSelectedSalary("All");
        setSelectedDate("All");
    };

    const departments = ["All", ...Array.from(new Set(jobs.map(j => j.department)))];
    const types = ["All", "Full-time", "Part-time", "Contract", "Internship", "Remote"];
    const salaryRanges = [
        { label: "Any Salary", value: "All" },
        { label: "$50,000+", value: "50000" },
        { label: "$80,000+", value: "80000" },
        { label: "$100,000+", value: "100000" },
        { label: "$120,000+", value: "120000" },
    ];
    const dateFilters = [
        { label: "All time", value: "All" },
        { label: "Last 24 hours", value: "1" },
        { label: "Last 7 days", value: "7" },
        { label: "Last 14 days", value: "14" },
        { label: "Last 30 days", value: "30" },
    ];

    // Profile match logic
    const getMatchScore = (job: Job) => {
        if (!profile || !profile.skills) return 0;
        const jobKeywords = (job.title + " " + job.description + " " + job.requirements).toLowerCase();
        const matchingSkills = profile.skills.filter(skill => jobKeywords.includes(skill.toLowerCase()));
        return Math.min(Math.round((matchingSkills.length / 3) * 100), 100);
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD] flex flex-col pt-[80px]">
            <HeaderNavigation />

            {/* Premium Light Header */}
            <section className="bg-white border-b border-gray-100 py-20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-6xl mx-auto space-y-10">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="space-y-4">
                                <Badge className="bg-primary/10 text-primary border-none px-4 py-1.5 font-black uppercase text-[10px] tracking-[0.2em] rounded-full">
                                    Career Intelligence
                                </Badge>
                                <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-[1.1]">
                                    Navigate the <span className="text-primary italic">Future</span> of <br className="hidden md:block" /> Geospatial Services
                                </h1>
                                <p className="text-gray-400 text-lg font-medium max-w-xl">
                                    Join <span className="text-gray-900 font-bold">GEOINFORMATIC</span> and work on missions that define high-precision geographic excellence.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <Link href="/profile/wizard">
                                    <Button variant="outline" className="h-14 px-8 rounded-2xl border-gray-200 font-bold text-gray-600 space-x-2 hover:bg-white hover:shadow-md transition-all">
                                        <TrendingUp className="w-5 h-5 text-primary" />
                                        <span>Update Profile</span>
                                    </Button>
                                </Link>
                                <Link href="/jobs/new">
                                    <Button className="h-14 px-8 rounded-2xl bg-gray-900 text-white font-bold space-x-2 hover:bg-gray-800 transition-all shadow-xl">
                                        <Zap className="w-5 h-5 text-primary" />
                                        <span>Post a Mission</span>
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Advanced Indeed-style Search Bar */}
                        <div className="bg-white p-3 rounded-[32px] border border-gray-200 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] backdrop-blur-sm">
                            <div className="flex flex-col md:flex-row md:items-center gap-2">
                                <div className="flex-1 relative group bg-gray-50 rounded-2xl border border-transparent focus-within:border-primary/20 focus-within:bg-white transition-all">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                    <Input
                                        placeholder="Job title, keywords, or specialized skills"
                                        className="h-16 pl-14 bg-transparent border-none text-gray-900 font-bold placeholder:text-gray-300 placeholder:font-normal focus-visible:ring-0"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="hidden md:block w-px h-10 bg-gray-100" />
                                <div className="flex-1 relative group bg-gray-50 rounded-2xl border border-transparent focus-within:border-primary/20 focus-within:bg-white transition-all">
                                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                    <Input
                                        placeholder="Location or 'Remote Operations'"
                                        className="h-16 pl-14 bg-transparent border-none text-gray-900 font-bold placeholder:text-gray-300 placeholder:font-normal focus-visible:ring-0"
                                        value={locationSearch}
                                        onChange={(e) => setLocationSearch(e.target.value)}
                                    />
                                </div>
                                <Button className="h-16 px-12 bg-gradient-to-r from-primary to-[#D97D25] text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:scale-[1.02]">
                                    Execute Search
                                </Button>
                            </div>
                        </div>

                        {/* Expanded Filter Bar */}
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                            <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-50 border border-gray-100">
                                <Filter className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Intelligence Filter</span>
                            </div>

                            <select
                                className="bg-white border border-gray-100 rounded-full px-6 py-2.5 text-xs font-black text-gray-600 uppercase tracking-widest outline-none hover:border-primary/30 transition-all appearance-none cursor-pointer shadow-sm"
                                value={selectedDept}
                                onChange={(e) => setSelectedDept(e.target.value)}
                            >
                                {departments.map(d => <option key={d} value={d}>{d === 'All' ? 'Department' : d}</option>)}
                            </select>

                            <select
                                className="bg-white border border-gray-100 rounded-full px-6 py-2.5 text-xs font-black text-gray-600 uppercase tracking-widest outline-none hover:border-primary/30 transition-all appearance-none cursor-pointer shadow-sm"
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                            >
                                {types.map(t => <option key={t} value={t}>{t === 'All' ? 'Contract Type' : t}</option>)}
                            </select>

                            <select
                                className="bg-white border border-gray-100 rounded-full px-6 py-2.5 text-xs font-black text-gray-600 uppercase tracking-widest outline-none hover:border-primary/30 transition-all appearance-none cursor-pointer shadow-sm"
                                value={selectedSalary}
                                onChange={(e) => setSelectedSalary(e.target.value)}
                            >
                                {salaryRanges.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>

                            <select
                                className="bg-white border border-gray-100 rounded-full px-6 py-2.5 text-xs font-black text-gray-600 uppercase tracking-widest outline-none hover:border-primary/30 transition-all appearance-none cursor-pointer shadow-sm"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            >
                                {dateFilters.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                            </select>

                            {(searchTerm || locationSearch || selectedType !== "All" || selectedDept !== "All" || selectedSalary !== "All" || selectedDate !== "All") && (
                                <button
                                    onClick={clearFilters}
                                    className="text-[10px] text-primary font-black uppercase tracking-widest hover:underline px-4 transition-all"
                                >
                                    Reset Protocols
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Split View Content */}
            <main className="flex-1 container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start max-w-7xl mx-auto">

                    {/* Left Rail: List */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-[11px] font-black text-gray-300 uppercase tracking-[0.25em] flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" /> {filteredJobs.length} Missions Identified
                            </h2>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                <span>Recent</span>
                                <ChevronRight className="w-3 h-3" />
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map(i => <div key={i} className="h-44 bg-gray-100 animate-pulse rounded-3xl" />)}
                            </div>
                        ) : filteredJobs.length === 0 ? (
                            <div className="text-center py-24 border-2 border-dashed border-gray-100 rounded-[40px] bg-white group">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                    <Search className="w-10 h-10 text-gray-200" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase mb-2">No Matching Intel</h3>
                                <p className="text-gray-400 font-bold text-sm tracking-wide">Adjust your search parameters to find available missions.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 pb-20">
                                {filteredJobs.map((job) => {
                                    const matchScore = getMatchScore(job);
                                    return (
                                        <div
                                            key={job.id}
                                            onClick={() => {
                                                setSelectedJob(job);
                                                if (window.innerWidth < 1024) {
                                                    detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                }
                                            }}
                                            className={`
                                                relative p-8 rounded-[36px] border transition-all duration-500 cursor-pointer overflow-hidden
                                                ${selectedJob?.id === job.id
                                                    ? 'bg-white border-primary shadow-[0_30px_70px_-20px_rgba(199,162,77,0.15)] ring-1 ring-primary/20 scale-[1.02]'
                                                    : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-xl hover:translate-y-[-4px]'}
                                            `}
                                        >
                                            {selectedJob?.id === job.id && (
                                                <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
                                            )}

                                            <div className="flex justify-between items-start mb-6">
                                                <div className="pr-12 space-y-3">
                                                    <div className="flex gap-2 items-center">
                                                        <Badge className="bg-gray-100 text-gray-500 border-none px-3 py-1 font-black uppercase tracking-widest text-[9px] rounded-lg">
                                                            {job.type}
                                                        </Badge>
                                                        {matchScore > 70 && (
                                                            <Badge className="bg-primary/10 text-primary border-none px-3 py-1 font-black uppercase tracking-widest text-[9px] rounded-lg">
                                                                High Match {matchScore}%
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <h3 className={`text-2xl font-black text-gray-900 tracking-tight leading-tight transition-colors ${selectedJob?.id === job.id ? 'text-primary' : ''}`}>
                                                        {job.title}
                                                    </h3>
                                                </div>
                                                <button
                                                    onClick={(e) => toggleSaveJob(e, job.id)}
                                                    className="absolute top-8 right-8 p-3 rounded-2xl bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 transition-all"
                                                >
                                                    {savedJobIds.has(job.id)
                                                        ? <BookmarkCheck className={`w-6 h-6 text-primary ${isSaving === job.id ? 'animate-pulse' : ''}`} />
                                                        : <Bookmark className={`w-6 h-6 text-gray-300 ${isSaving === job.id ? 'animate-pulse' : ''}`} />
                                                    }
                                                </button>
                                            </div>

                                            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-gray-500">
                                                <span className="flex items-center gap-2"><Building2 className="w-4 h-4 text-gray-300" /> {job.department}</span>
                                                <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-300" /> {job.location}</span>
                                                {job.salary_min && (
                                                    <span className="flex items-center gap-2 text-gray-900"><DollarSign className="w-4 h-4 text-primary" /> {job.salary_min.toLocaleString()} /yr</span>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between pt-8 mt-8 border-t border-gray-50">
                                                <div className="flex gap-2 items-center">
                                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                        Protocol Active • {formatDistanceToNow(new Date(job.created_at))} ago
                                                    </span>
                                                </div>
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${selectedJob?.id === job.id ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-gray-50 text-gray-300'}`}>
                                                    <ChevronRight className="w-5 h-5" />
                                                </div>
                                            </div>

                                            {/* Applied marker */}
                                            {appliedJobIds.has(job.id) && (
                                                <div className="absolute bottom-0 right-0 p-1 bg-green-500 rounded-tl-xl">
                                                    <CheckCircle2 className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Rail: Details (Sticky) */}
                    <div className="lg:col-span-7 sticky top-[112px]" ref={detailRef}>
                        <AnimatePresence mode="wait">
                            {selectedJob ? (
                                <motion.div
                                    key={selectedJob.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="bg-white border border-gray-100 rounded-[48px] shadow-2xl overflow-hidden h-[calc(100vh-160px)] flex flex-col"
                                >
                                    {/* Detailed Header */}
                                    <div className="p-10 border-b border-gray-50 bg-[#FCFCFD] relative">
                                        <div className="absolute top-0 right-0 p-10 flex gap-3">
                                            <Button size="icon" variant="outline" className="w-12 h-12 rounded-2xl border-gray-200 text-gray-400 hover:text-gray-900 hover:bg-white shadow-sm transition-all focus:ring-0">
                                                <Share2 className="w-5 h-5" />
                                            </Button>
                                            <button
                                                onClick={(e) => toggleSaveJob(e, selectedJob.id)}
                                                className="w-12 h-12 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-white transition-all shadow-sm"
                                            >
                                                {savedJobIds.has(selectedJob.id)
                                                    ? <BookmarkCheck className="w-6 h-6 text-primary" />
                                                    : <Bookmark className="w-6 h-6 text-gray-300" />
                                                }
                                            </button>
                                        </div>

                                        <div className="space-y-6 max-w-[85%]">
                                            <div className="flex gap-2">
                                                <Badge className="bg-primary text-white border-none px-5 py-1.5 font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-primary/20">
                                                    {selectedJob.type}
                                                </Badge>
                                                <Badge className="bg-gray-100 text-gray-600 border-none px-5 py-1.5 font-black uppercase text-[10px] tracking-widest rounded-xl">
                                                    LVL 0{selectedJob.requirements.split('\n').length % 5 || 4} Intelligence
                                                </Badge>
                                            </div>
                                            <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-[1.1] tracking-tight">
                                                {selectedJob.title}
                                            </h2>
                                            <div className="flex flex-wrap gap-8 text-xs font-black text-gray-400 uppercase tracking-widest">
                                                <span className="flex items-center gap-3"><MapPin className="w-5 h-5 text-primary" /> {selectedJob.location}</span>
                                                <span className="flex items-center gap-3"><Building2 className="w-5 h-5 text-primary" /> {selectedJob.department}</span>
                                                <span className="flex items-center gap-3"><Users className="w-5 h-5 text-primary" /> Remote Compatible</span>
                                            </div>
                                        </div>

                                        <div className="pt-12 flex gap-5">
                                            <Button
                                                asChild
                                                className="h-16 px-14 bg-gradient-to-r from-primary to-[#D97D25] text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-[1.03] active:scale-95"
                                            >
                                                <Link href={`/jobs/${selectedJob.id}/apply`}>
                                                    Transmit Application <ArrowRight className="ml-3 w-6 h-6" />
                                                </Link>
                                            </Button>
                                            <Link href={`/jobs/${selectedJob.id}`}>
                                                <Button variant="outline" className="h-16 px-10 border-gray-200 rounded-2xl text-gray-600 font-black text-xs uppercase tracking-widest hover:bg-white hover:shadow-lg transition-all">
                                                    Full Intel dossier <ExternalLink className="ml-2 w-4 h-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Detailed Scroll Area */}
                                    <div className="flex-1 overflow-y-auto p-12 space-y-16 custom-scrollbar pb-32">
                                        <section className="space-y-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-1 h-px bg-gray-100 flex-1" />
                                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-4">
                                                    <Sparkles className="w-7 h-7 text-primary" /> Mission parameters
                                                </h3>
                                                <div className="w-10 h-1 h-px bg-gray-100 flex-1" />
                                            </div>
                                            <div className="prose prose-slate max-w-none text-gray-600 leading-relaxed text-lg font-medium">
                                                {selectedJob.description.split('\n').map((p, i) => (
                                                    <p key={i} className="mb-6">{p}</p>
                                                ))}
                                            </div>
                                        </section>

                                        <section className="space-y-10">
                                            <div className="bg-gray-50/50 border border-gray-100 rounded-[40px] p-10 relative overflow-hidden group">
                                                <div className="absolute top-0 left-0 w-2 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                                                <h3 className="text-lg font-black text-gray-900 flex items-center gap-4 mb-10 uppercase tracking-tight">
                                                    <Layers className="w-7 h-7 text-primary" /> Critical Tech Stack & Requirements
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                                                    {selectedJob.requirements.split('\n').filter(r => r.trim()).map((req, i) => (
                                                        <div key={i} className="flex gap-4 text-sm font-bold text-gray-500 items-start">
                                                            <div className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0 shadow-[0_0_10px_rgba(199,162,77,0.5)]" />
                                                            <span className="leading-snug">{req}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </section>

                                        {/* Indeed-style match section */}
                                        <section className="pt-10 border-t border-gray-50 flex flex-col md:flex-row justify-between items-end gap-10">
                                            <div className="space-y-4">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Operational Oversight</p>
                                                <div className="flex gap-8 opacity-10">
                                                    <Globe className="w-12 h-12" />
                                                    <Database className="w-12 h-12" />
                                                    <Satellite className="w-12 h-12" />
                                                </div>
                                            </div>
                                            <div className="text-right space-y-2">
                                                <p className="text-xs font-bold text-gray-900 uppercase tracking-widest">GEOINFORMATIC Recruitment HQ</p>
                                                <p className="text-[10px] font-bold text-gray-400 italic">Established Global Intelligence Provider</p>
                                            </div>
                                        </section>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="bg-white border-2 border-dashed border-gray-100 rounded-[64px] h-[calc(100vh-160px)] flex flex-col items-center justify-center text-center p-20 scale-95 opacity-50">
                                    <div className="w-28 h-28 rounded-full bg-gray-50 flex items-center justify-center mb-10 border border-gray-100">
                                        <Briefcase className="w-12 h-12 text-gray-200" />
                                    </div>
                                    <h3 className="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tight">Awaiting Intel Selection</h3>
                                    <p className="text-gray-400 font-bold max-w-sm tracking-wide">Select a mission profile from the terminal on the left to review the operational dataset.</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            <Footer />

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.05);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #C7A24D;
                }
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }
                .float { animation: float 6s ease-in-out infinite; }
            `}</style>
        </div>
    );
}
