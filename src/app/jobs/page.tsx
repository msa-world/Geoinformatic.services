"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import HeaderNavigation from "@/components/sections/header-navigation";
import Footer from "@/components/sections/footer";
import ProfileSidebar from "@/components/sections/profile-sidebar";
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
    Users,
    Flag,
    Link as LinkIcon,
    BookOpen
} from "lucide-react";
import Link from "next/link";
import { JobAlertToggle } from "@/components/jobs/job-alert-toggle";
import { motion, AnimatePresence } from "framer-motion";
import { Job, UserProfile } from "@/components/profile/types";
import { formatDistanceToNow, isAfter, subDays } from "date-fns";
import { toast } from "sonner";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
    PopoverAnchor,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    const { user } = useAuth();
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

    const [openSearch, setOpenSearch] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Derived suggestions
    const suggestions = jobs
        .map(j => j.title)
        .filter((val, idx, self) => self.indexOf(val) === idx)
        .filter(title => title.toLowerCase().includes(searchTerm.toLowerCase()));

    const [showMobileDetail, setShowMobileDetail] = useState(false);
    const [showProfileSidebar, setShowProfileSidebar] = useState(false);

    useEffect(() => {
        fetchJobsAndUserStates();
    }, []);

    // If user is not signed in, show a single centered prompt and don't render the full jobs UI
    if (!user) {
        return (
            <div className="min-h-screen bg-[#FDFDFD] flex flex-col pt-[80px]">
                <HeaderNavigation />
                <main className="flex-1 flex items-center justify-center py-20 px-4">
                    <div className="w-full max-w-3xl">
                        <div className="bg-white border-2 border-dashed border-[#D97D25]/20 rounded-2xl p-12 text-center shadow-sm">
                            <div className="w-24 h-24 mx-auto rounded-full bg-orange-50 flex items-center justify-center mb-6 border border-[#D97D25]/20">
                                <Briefcase className="w-10 h-10 text-[#D97D25]" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 uppercase mb-3">LOGIN TO VIEW JOBS</h2>
                            <p className="text-gray-500 mb-6">Create an account or sign in to explore and apply for openings.</p>
                            <div className="flex justify-center">
                                <Link href="/auth/login">
                                    <Button className="bg-[#D97D25] text-white px-6 py-3 rounded-lg shadow">Sign In Now</Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    useEffect(() => {
        filterJobs();
    }, [searchTerm, locationSearch, selectedType, selectedDept, selectedSalary, selectedDate, jobs]);

    async function fetchJobsAndUserStates() {
        setIsLoading(true);
        try {
            // 1. Fetch Jobs
            const resp = await fetch('/api/jobs/list')
            const json = await resp.json()
            if (!resp.ok) throw new Error(json?.error || 'failed to fetch jobs')
            const data = json.jobs || []

            setJobs(data || []);
            if (data && data.length > 0) setSelectedJob(data[0]);

            // 2. Fetch User State (Saved & Applied)
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const [savedResp, appliedResp] = await Promise.all([
                    supabase.from("saved_jobs").select("job_id").eq("user_id", user.id),
                    supabase.from("job_applications").select("job_id").eq("user_id", user.id)
                ]);

                if (savedResp.data) setSavedJobIds(new Set(savedResp.data.map((i: any) => i.job_id)));
                if (appliedResp.data) setAppliedJobIds(new Set(appliedResp.data.map((i: any) => i.job_id)));
            }

        } catch (error) {
            console.error("Error fetching jobs:", error);
            toast.error("Failed to load recruitment data");
        } finally {
            setIsLoading(false);
        }
    }

    const handleShare = async (e: React.MouseEvent, job: Job) => {
        e.preventDefault();
        e.stopPropagation();
        const url = `${window.location.origin}/jobs/${job.id}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Apply for ${job.title} at Geoinformatics Services`,
                    text: `Check out this ${job.title} position!`,
                    url: url,
                });
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            navigator.clipboard.writeText(url);
            toast.success("Job link copied to clipboard!");
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
                    <div className="max-w-6xl mx-auto space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-3">
                                <Badge className="bg-primary/10 text-primary border-none px-4 py-1.5 font-bold uppercase text-[10px] tracking-widest rounded-full">
                                    Careers at Geoinformatics Services
                                </Badge>
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.1]">
                                    Jobs
                                </h1>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Link href="/jobs/guide">
                                    <Button variant="outline" className="h-12 px-6 rounded-xl border-gray-200 font-bold text-gray-600 space-x-2 hover:bg-white hover:shadow-md transition-all">
                                        <BookOpen className="w-4 h-4 text-primary" />
                                        <span>How it Works</span>
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowProfileSidebar(true)}
                                    className="h-12 px-6 rounded-xl border-gray-200 font-bold text-gray-600 space-x-2 hover:bg-white hover:shadow-md transition-all"
                                >
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                    <span>Update Profile</span>
                                </Button>
                                <Link href="/jobs/new">
                                    <Button className="h-12 px-6 rounded-xl bg-gray-900 text-white font-bold space-x-2 hover:bg-gray-800 transition-all shadow-xl">
                                        <Zap className="w-4 h-4 text-primary" />
                                        <span>Post a Job</span>
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Advanced Indeed-style Search Bar - Sticky/Floating */}
                    <div className="sticky top-24 z-40 my-4">
                        <div className="bg-white p-2 rounded-[24px] border border-gray-200 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] backdrop-blur-sm relative transition-all duration-300">
                            <div className="flex flex-col md:flex-row md:items-center gap-2">
                                <div className="flex-1 relative group w-full">
                                    <Popover open={openSearch && suggestions.length > 0} onOpenChange={setOpenSearch} modal={false}>
                                        <PopoverAnchor asChild>
                                            <div className="relative bg-gray-50 rounded-xl border border-transparent focus-within:border-primary/20 focus-within:bg-white transition-all">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                                <Input
                                                    placeholder="Job title, keywords, or skills"
                                                    className="h-14 pl-12 bg-transparent border-none text-gray-900 font-bold placeholder:text-gray-400 placeholder:font-medium focus-visible:ring-0 w-full"
                                                    value={searchTerm}
                                                    onChange={(e) => {
                                                        setSearchTerm(e.target.value);
                                                        setOpenSearch(true);
                                                    }}
                                                    onFocus={() => setOpenSearch(true)}
                                                />
                                            </div>
                                        </PopoverAnchor>
                                        <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
                                            <Command>
                                                <CommandList>
                                                    <CommandGroup heading="Suggestions">
                                                        {suggestions.map((suggestion) => (
                                                            <CommandItem
                                                                key={suggestion}
                                                                onSelect={() => {
                                                                    setSearchTerm(suggestion);
                                                                    setOpenSearch(false);
                                                                }}
                                                            >
                                                                <Search className="mr-2 h-4 w-4" />
                                                                {suggestion}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="hidden md:block w-px h-8 bg-gray-100" />
                                <div className="flex-1 relative group bg-gray-50 rounded-xl border border-transparent focus-within:border-primary/20 focus-within:bg-white transition-all w-full">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                    <Input
                                        placeholder="Location or 'Remote Operations'"
                                        className="h-14 pl-12 bg-transparent border-none text-gray-900 font-bold placeholder:text-gray-400 placeholder:font-medium focus-visible:ring-0 w-full"
                                        value={locationSearch}
                                        onChange={(e) => setLocationSearch(e.target.value)}
                                    />
                                </div>
                                <Button className="h-14 w-full md:w-auto px-10 bg-gradient-to-r from-primary to-[#D97D25] text-white font-bold text-sm uppercase tracking-wider rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
                                    Search
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Expanded Filter Bar */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                        <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-50 border border-gray-100">
                            <Filter className="w-4 h-4 text-primary" />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filters</span>
                        </div>

                        <Select value={selectedDept} onValueChange={setSelectedDept}>
                            <SelectTrigger className="w-fit min-w-[140px] bg-white border-gray-100 rounded-full px-4 py-6 text-xs font-bold text-gray-600 uppercase tracking-widest hover:border-primary/30 shadow-sm h-12">
                                <SelectValue placeholder="Department" />
                            </SelectTrigger>
                            <SelectContent>
                                {departments.map(d => (
                                    <SelectItem key={d} value={d}>
                                        {d === 'All' ? 'All Departments' : d}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedType} onValueChange={setSelectedType}>
                            <SelectTrigger className="w-fit min-w-[140px] bg-white border-gray-100 rounded-full px-4 py-6 text-xs font-bold text-gray-600 uppercase tracking-widest hover:border-primary/30 shadow-sm h-12">
                                <SelectValue placeholder="Contract Type" />
                            </SelectTrigger>
                            <SelectContent>
                                {types.map(t => (
                                    <SelectItem key={t} value={t}>
                                        {t === 'All' ? 'All Types' : t}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedSalary} onValueChange={setSelectedSalary}>
                            <SelectTrigger className="w-fit min-w-[140px] bg-white border-gray-100 rounded-full px-4 py-6 text-xs font-bold text-gray-600 uppercase tracking-widest hover:border-primary/30 shadow-sm h-12">
                                <SelectValue placeholder="Salary Range" />
                            </SelectTrigger>
                            <SelectContent>
                                {salaryRanges.map(s => (
                                    <SelectItem key={s.value} value={s.value}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedDate} onValueChange={setSelectedDate}>
                            <SelectTrigger className="w-fit min-w-[140px] bg-white border-gray-100 rounded-full px-4 py-6 text-xs font-bold text-gray-600 uppercase tracking-widest hover:border-primary/30 shadow-sm h-12">
                                <SelectValue placeholder="Posted Date" />
                            </SelectTrigger>
                            <SelectContent>
                                {dateFilters.map(d => (
                                    <SelectItem key={d.value} value={d.value}>
                                        {d.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {(searchTerm || locationSearch || selectedType !== "All" || selectedDept !== "All" || selectedSalary !== "All" || selectedDate !== "All") && (
                            <button
                                onClick={clearFilters}
                                className="text-[10px] text-primary font-black uppercase tracking-widest hover:underline px-4 transition-all"
                            >
                                Reset Filters
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* Split View Content - Sticky Layout */}
            <main className="flex-1 container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-7xl mx-auto h-[calc(100vh-140px)]">

                    {/* Left Rail: List (Scrollable) */}
                    <div className="lg:col-span-5 space-y-4 h-full overflow-y-auto px-2 scrollbar-hide">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-[11px] font-black text-gray-300 uppercase tracking-[0.25em] flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" /> {filteredJobs.length} Jobs Found
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
                        ) : !user ? (
                            <div className="text-center py-24 border-2 border-dashed border-[#D97D25]/20 rounded-[40px] bg-orange-50/10 group">
                                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                    <ArrowRight className="w-10 h-10 text-[#D97D25]" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase mb-2">Login to View Jobs</h3>
                                <p className="text-gray-400 font-bold text-sm tracking-wide mb-6">Create an account or sign in to explore and apply for openings.</p>
                                <Button
                                    asChild
                                    className="bg-[#D97D25] hover:bg-[#D97D25]/90 text-white font-bold rounded-xl px-8 h-12 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                                >
                                    <Link href="/auth/login?redirect=/jobs">
                                        Sign In Now
                                    </Link>
                                </Button>
                            </div>
                        ) : filteredJobs.length === 0 ? (
                            <div className="text-center py-24 border-2 border-dashed border-gray-100 rounded-[40px] bg-white group">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                    <Search className="w-10 h-10 text-gray-200" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase mb-2">No Jobs Found</h3>
                                <p className="text-gray-400 font-bold text-sm tracking-wide">Adjust your search parameters to find available positions.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 pb-20">
                                {filteredJobs.map((job) => {
                                    const matchScore = getMatchScore(job);
                                    const isNew = isAfter(new Date(job.created_at), subDays(new Date(), 3));
                                    const postedDate = formatDistanceToNow(new Date(job.created_at), { addSuffix: true }).replace("about ", "");
                                    const companyName = job.profiles?.company || job.department || "Geoinformatic Services";
                                    const logoUrl = job.brand_logo_url || job.profiles?.avatar_url;

                                    return (
                                        <div
                                            key={job.id}
                                            onClick={() => {
                                                setSelectedJob(job);
                                                setShowMobileDetail(true);
                                                if (window.innerWidth >= 1024) {
                                                    detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                }
                                            }}
                                            className={`
                                                relative p-5 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden group
                                                ${selectedJob?.id === job.id
                                                    ? 'bg-[#D97D25]/5 border-[#D97D25]/30 ring-1 ring-[#D97D25]'
                                                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'}
                                            `}
                                        >
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {isNew && (
                                                    <span className="text-[10px] font-bold text-[#D97D25] bg-[#D97D25]/10 px-2 py-0.5 rounded-sm uppercase tracking-wide">
                                                        New
                                                    </span>
                                                )}
                                                {job.urgently_hiring && (
                                                    <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-sm uppercase tracking-wide">
                                                        Urgently hiring
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-start gap-4">
                                                {logoUrl && (
                                                    <div className="w-12 h-12 rounded-lg border border-gray-100 p-1 bg-white shrink-0">
                                                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className={`text-xl font-bold text-gray-900 mb-1 ${selectedJob?.id === job.id ? 'text-[#D97D25]' : 'group-hover:underline'}`}>
                                                        {job.title}
                                                    </h3>

                                                    <div className="text-sm text-gray-600 mb-2">
                                                        {companyName}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-sm text-gray-500 mb-3 space-y-1">
                                                <div className="font-semibold text-gray-700">
                                                    {job.location}
                                                </div>
                                                {(job.salary_min || job.salary_max) && (
                                                    <div className="bg-gray-100 w-fit px-2 py-1 rounded text-xs font-bold text-gray-700 flex items-center gap-1">
                                                        <DollarSign className="w-3 h-3" />
                                                        {job.salary_min && !job.salary_max && `Rs ${job.salary_min.toLocaleString()} a month`}
                                                        {job.salary_min && job.salary_max && `Rs ${job.salary_min.toLocaleString()} - Rs ${job.salary_max.toLocaleString()} a month`}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4 mt-4 text-xs font-semibold text-gray-500">
                                                {!job.external_link && (
                                                    <div className="flex items-center gap-2 text-[#D97D25]">
                                                        <Users className="w-3 h-3" />
                                                        <span>Simple Apply</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{postedDate}</span>
                                                </div>
                                            </div>

                                            {/* Absolute Actions */}
                                            <button
                                                onClick={(e) => toggleSaveJob(e, job.id)}
                                                className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 transition-colors"
                                            >
                                                {savedJobIds.has(job.id)
                                                    ? <BookmarkCheck className={`w-6 h-6 text-gray-900 ${isSaving === job.id ? 'animate-pulse' : ''}`} />
                                                    : <Bookmark className={`w-6 h-6 text-gray-400 hover:text-gray-900 ${isSaving === job.id ? 'animate-pulse' : ''}`} />
                                                }
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Rail: Details (Sticky on Desktop, Modal/Full on Mobile) */}
                    <div className={`
                        fixed inset-0 z-50 bg-white lg:static lg:bg-transparent lg:z-auto lg:col-span-7 lg:block
                        ${showMobileDetail ? 'block animate-in slide-in-from-bottom duration-300' : 'hidden'}
                    `}>
                        {/* Mobile Header for Close */}
                        <div className="lg:hidden p-4 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-50">
                            <Button variant="ghost" size="icon" onClick={() => setShowMobileDetail(false)}>
                                <ChevronLeft className="w-6 h-6" />
                            </Button>
                            <span className="font-bold text-gray-900">Job Details</span>
                            <div className="w-10" /> {/* Spacer */}
                        </div>

                        {/* Right Rail: Detail (Sticky) */}
                        <div className="h-full lg:h-[calc(100vh-100px)] lg:sticky lg:top-24 w-full">
                            <div ref={detailRef} className="bg-white border-2 border-slate-100/80 shadow-xl rounded-[24px] overflow-hidden h-full flex flex-col relative w-full">
                                <AnimatePresence mode="wait">
                                    {selectedJob ? (
                                        <motion.div
                                            key={selectedJob.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="h-full flex flex-col bg-white"
                                        >
                                            {/* Detailed Header */}
                                            {/* Detailed Header - Indeed Style */}
                                            <div className="p-6 border-b border-gray-200 bg-white relative shrink-0">
                                                <div className="flex items-start gap-4 mb-4">
                                                    {(selectedJob.brand_logo_url || selectedJob.profiles?.avatar_url) && (
                                                        <div className="w-16 h-16 rounded-xl border border-gray-100 p-2 bg-white shadow-sm shrink-0">
                                                            <img
                                                                src={selectedJob.brand_logo_url || selectedJob.profiles?.avatar_url}
                                                                alt="Company Logo"
                                                                className="w-full h-full object-contain"
                                                            />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h2 className="text-2xl font-bold text-gray-900 mb-1">
                                                            {selectedJob.title}
                                                        </h2>
                                                        <div className="flex items-center gap-2 text-sm text-gray-900 font-bold cursor-pointer hover:underline w-fit">
                                                            {selectedJob.profiles?.company || selectedJob.department || "Geoinformatics"}
                                                            <ExternalLink className="w-3 h-3 text-gray-500" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-sm text-gray-600 space-y-1 mb-6">
                                                    <div>{selectedJob.location}</div>
                                                    {(selectedJob.salary_min || selectedJob.salary_max) && (
                                                        <div className="font-semibold">
                                                            {selectedJob.salary_min && !selectedJob.salary_max && `Rs ${selectedJob.salary_min.toLocaleString()} a month`}
                                                            {selectedJob.salary_min && selectedJob.salary_max && `Rs ${selectedJob.salary_min.toLocaleString()} - Rs ${selectedJob.salary_max.toLocaleString()} a month`}
                                                        </div>
                                                    )}
                                                    {appliedJobIds.has(selectedJob.id) && (
                                                        <div className="text-green-600 font-bold flex items-center gap-1 text-xs uppercase tracking-wide mt-2">
                                                            <CheckCircle2 className="w-4 h-4" /> Application Submitted
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex gap-3">
                                                    {selectedJob.external_link ? (
                                                        <Button
                                                            asChild
                                                            className="bg-[#D97D25] hover:bg-[#D97D25]/90 text-white font-bold rounded-lg px-8 h-11"
                                                        >
                                                            {user ? (
                                                                <a href={selectedJob.external_link} target="_blank" rel="noopener noreferrer">
                                                                    Apply on Company Site <ExternalLink className="ml-2 w-4 h-4" />
                                                                </a>
                                                            ) : (
                                                                <Link href={`/auth/login?redirect=/jobs`}>
                                                                    Apply on Company Site <ExternalLink className="ml-2 w-4 h-4" />
                                                                </Link>
                                                            )}
                                                        </Button>
                                                    ) : appliedJobIds.has(selectedJob.id) ? (
                                                        <Button disabled className="bg-gray-100 text-gray-400 font-bold rounded-lg px-8 h-11">
                                                            Applied
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            asChild
                                                            className="bg-[#D97D25] hover:bg-[#D97D25]/90 text-white font-bold rounded-lg px-8 h-11"
                                                        >
                                                            <Link href={user ? `/jobs/${selectedJob.id}/apply` : `/auth/login?redirect=/jobs/${selectedJob.id}/apply`}>
                                                                Apply now
                                                            </Link>
                                                        </Button>
                                                    )}

                                                    <Link href={`/jobs/${selectedJob.id}`} className="hidden md:block">
                                                        <Button variant="ghost" className="h-11 px-4 text-gray-600 font-bold hover:bg-gray-100 rounded-lg">
                                                            View full details
                                                        </Button>
                                                    </Link>

                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg w-11 h-11"
                                                            onClick={(e) => toggleSaveJob(e, selectedJob.id)}
                                                        >
                                                            {savedJobIds.has(selectedJob.id)
                                                                ? <BookmarkCheck className="w-5 h-5 text-gray-900" />
                                                                : <Bookmark className="w-5 h-5" />
                                                            }
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg w-11 h-11"
                                                            onClick={(e) => handleShare(e, selectedJob)}
                                                        >
                                                            <Share2 className="w-5 h-5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Detailed Scroll Area */}
                                            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-32">
                                                <section className="space-y-4">
                                                    <h3 className="text-lg font-bold text-gray-900">Job Description</h3>
                                                    <div className="prose prose-sm max-w-none text-gray-700">
                                                        {selectedJob.description.split('\n').map((p, i) => (
                                                            <p key={i} className="mb-4">{p}</p>
                                                        ))}
                                                    </div>
                                                </section>

                                                <section className="space-y-4 pt-4 border-t border-gray-100">
                                                    <h3 className="text-lg font-bold text-gray-900">Requirements</h3>
                                                    <ul className="list-disc pl-5 space-y-2 text-gray-700 text-sm">
                                                        {selectedJob.requirements.split('\n').filter(r => r.trim()).map((req, i) => (
                                                            <li key={i}>{req}</li>
                                                        ))}
                                                    </ul>
                                                </section>
                                            </div>
                                        </motion.div>
                                    ) : !user ? (
                                        <div className="bg-white border-2 border-dashed border-[#D97D25]/20 rounded-[64px] h-[calc(100vh-160px)] flex flex-col items-center justify-center text-center p-20 scale-95 opacity-80">
                                            <div className="w-28 h-28 rounded-full bg-orange-50 flex items-center justify-center mb-10 border border-[#D97D25]/20">
                                                <Briefcase className="w-12 h-12 text-[#D97D25]" />
                                            </div>
                                            <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase mb-4">Login Required</h2>
                                            <p className="text-gray-400 font-bold text-lg tracking-wide max-w-sm">
                                                Please sign in to view full job details and apply for positions.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-white border-2 border-dashed border-gray-100 rounded-[64px] h-[calc(100vh-160px)] flex flex-col items-center justify-center text-center p-20 scale-95 opacity-50">
                                            <div className="w-28 h-28 rounded-full bg-gray-50 flex items-center justify-center mb-10 border border-gray-100">
                                                <Briefcase className="w-12 h-12 text-gray-200" />
                                            </div>
                                            <h3 className="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tight">Select a Job</h3>
                                            <p className="text-gray-400 font-bold max-w-sm tracking-wide">Select a job from the list to view details.</p>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            </main >


            <ProfileSidebar open={showProfileSidebar} onOpenChange={setShowProfileSidebar} />
            <Footer />

            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
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

            {/* Floating Job Alert Toggle (only when logged in) */}
            {user && (
                <div className="fixed bottom-6 right-6 z-50">
                    <JobAlertToggle
                        className="h-14 w-14 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-primary/20 hover:scale-110 transition-transform duration-300"
                        showLabel={false}
                    />
                </div>
            )}
        </div >
    );
}
