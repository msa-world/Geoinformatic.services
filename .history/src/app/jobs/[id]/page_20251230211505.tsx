"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import HeaderNavigation from "@/components/sections/header-navigation";
import Footer from "@/components/sections/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Briefcase,
    MapPin,
    Clock,
    Building2,
    Calendar,
    ArrowLeft,
    Share2,
    Bookmark,
    BookmarkCheck,
    Globe,
    Database,
    Satellite,
    DollarSign,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    UserCircle2,
    ArrowRight,
    FileText,
    ShieldCheck,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Job, UserProfile } from "@/components/profile/types";

export default function JobDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const supabase = createClient();

    const [job, setJob] = useState<Job | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [hasApplied, setHasApplied] = useState(false);

    const fetchJobDetails = useCallback(async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Job
            const { data: jobData, error: jobError } = await supabase
                .from("jobs")
                .select("*")
                .eq("id", id)
                .single();

            if (jobError) throw jobError;
            setJob(jobData);

            // 2. Fetch User & Profile & State (serialized getUser)
            const { getUserOnce } = await import("@/lib/supabase/auth-client")
            const authUser = await getUserOnce()
            setUser(authUser);

            if (authUser) {
                // Check if saved
                const { data: savedData, error: savedErr } = await supabase
                    .from("saved_jobs")
                    .select("id")
                    .eq("user_id", authUser.id)
                    .eq("job_id", id)
                    .maybeSingle();
                if (savedErr) console.error("Error fetching saved state:", savedErr);
                setIsSaved(!!savedData);

                // Check if applied
                const { data: appData, error: appErr } = await supabase
                    .from("job_applications")
                    .select("id")
                    .eq("user_id", authUser.id)
                    .eq("job_id", id)
                    .maybeSingle();
                if (appErr) console.error("Error fetching application state:", appErr);
                setHasApplied(!!appData);

                // Fetch Profile for completion check
                const { data: profileData, error: profileErr } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", authUser.id)
                    .maybeSingle();
                if (profileErr) console.error("Error fetching profile:", profileErr);
                setProfile(profileData || null);
            }
        } catch (error) {
            console.error("Error fetching job:", error);
            toast.error("Job position not found");
            router.push("/jobs");
        } finally {
            setIsLoading(false);
        }
    }, [id, supabase, router]);

    useEffect(() => {
        fetchJobDetails();
    }, [fetchJobDetails]);

    const toggleSave = async () => {
        if (!user) {
            toast.error("Please sign in to save jobs");
            router.push(`/auth/login?redirect=/jobs/${id}`);
            return;
        }

        setIsSaving(true);
        try {
            if (isSaved) {
                await supabase.from("saved_jobs").delete().eq("user_id", user.id).eq("job_id", id);
                setIsSaved(false);
                toast.success("Removed from saved jobs");
            } else {
                await supabase.from("saved_jobs").insert([{ user_id: user.id, job_id: id }]);
                setIsSaved(true);
                toast.success("Job saved!");
            }
        } catch (err) {
            toast.error("Failed to update saved status");
        } finally {
            setIsSaving(false);
        }
    };

    // Profile completion check logic
    const isProfileComplete = profile && (
        profile.full_name &&
        profile.role &&
        profile.phone_number &&
        profile.location &&
        profile.bio &&
        profile.cv_url &&
        Array.isArray(profile.skills) && profile.skills.length > 0
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex flex-col pt-32">
                <HeaderNavigation />
                <div className="flex-1 container mx-auto px-4 text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-[#C7A24D] mx-auto mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest">Decrypting Position Intel...</p>
                </div>
            </div>
        );
    }

    if (!job) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pt-[80px]">
            <HeaderNavigation />

            {/* Hero Section (Light) */}
            <section className="bg-white border-b border-gray-100 py-20 relative">
                <div className="container mx-auto px-4 max-w-6xl relative z-10">
                    <Link
                        href="/jobs"
                        className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors mb-12"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                        <div className="lg:col-span-8">
                            <div className="space-y-6">
                                <Badge className="bg-[#C7A24D] text-white px-5 py-1.5 font-black uppercase text-[10px] tracking-[0.2em] rounded-full shadow-lg shadow-[#C7A24D]/20">
                                    {job.type}
                                </Badge>
                                <h1 className="text-4xl md:text-6xl font-black text-gray-900 leading-[1.1] tracking-tight">
                                    {job.title}
                                </h1>
                                <div className="flex flex-wrap gap-8 text-sm font-bold text-gray-400 uppercase tracking-[0.15em]">
                                    <span className="flex items-center gap-3"><MapPin className="w-5 h-5 text-[#C7A24D]" /> {job.location}</span>
                                    <span className="flex items-center gap-3"><Building2 className="w-5 h-5 text-[#C7A24D]" /> {job.department}</span>
                                    <span className="flex items-center gap-3"><Clock className="w-5 h-5 text-[#C7A24D]" /> {job.type}</span>
                                    <span className="flex items-center gap-3"><Globe className="w-5 h-5 text-[#C7A24D]" /> Global Operations</span>
                                    {job.salary_min && (
                                        <span className="flex items-center gap-3 text-gray-900 bg-gray-50 px-4 py-1.5 rounded-full">
                                            <DollarSign className="w-5 h-5 text-[#C7A24D]" />
                                            {job.salary_min.toLocaleString()} - {job.salary_max?.toLocaleString()} {job.salary_currency}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="pt-12 flex flex-wrap gap-4">
                                {hasApplied ? (
                                    <Button disabled className="h-16 px-12 bg-green-500/10 text-green-600 border border-green-500/20 font-black text-xs tracking-widest uppercase rounded-2xl">
                                        <CheckCircle2 className="mr-3 w-6 h-6" /> Application Submitted
                                    </Button>
                                ) : (
                                    <Button
                                        asChild
                                        className="h-16 px-12 bg-gradient-to-r from-[#C7A24D] to-[#D97D25] text-white font-black text-xs tracking-widest uppercase rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <Link href={`/jobs/${id}/apply`}>
                                            Proceed to Apply <ArrowRight className="ml-3 w-6 h-6" />
                                        </Link>
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    onClick={toggleSave}
                                    className={`h-16 px-8 rounded-2xl border-gray-200 text-gray-600 font-bold transition-all ${isSaved ? 'bg-gray-50' : ''}`}
                                >
                                    {isSaved ? <BookmarkCheck className="w-6 h-6 text-[#C7A24D]" /> : <Bookmark className="w-6 h-6" />}
                                </Button>
                                <Button variant="outline" className="h-16 px-8 rounded-2xl border-gray-200 text-gray-600 font-bold">
                                    <Share2 className="w-6 h-6" />
                                </Button>
                            </div>
                        </div>

                        {/* Sidebar: Profile Integrity Check */}
                        <div className="lg:col-span-4">
                            <Card className="bg-white border border-gray-100 shadow-2xl rounded-[32px] overflow-hidden">
                                <CardContent className="p-8">
                                    <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-50">
                                        <ShieldCheck className="w-8 h-8 text-[#C7A24D]" />
                                        <h3 className="font-black text-gray-900 tracking-tight uppercase text-lg">Application Status</h3>
                                    </div>

                                    {!user ? (
                                        <div className="space-y-6 text-center py-4">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <AlertCircle className="w-8 h-8 text-gray-300" />
                                            </div>
                                            <p className="text-gray-500 font-bold text-sm uppercase tracking-widest leading-relaxed">Identity verification required to access mission application.</p>
                                            <Button asChild variant="outline" className="w-full h-14 border-gray-100 font-bold rounded-xl">
                                                <Link href="/auth/login">Login to GEOINFORMATIC</Link>
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Profile Integrity</span>
                                                {isProfileComplete ? (
                                                    <Badge className="bg-green-500 text-white font-bold px-3 py-1 uppercase text-[9px] tracking-widest">Secure & Complete</Badge>
                                                ) : (
                                                    <Badge className="bg-amber-500 text-white font-bold px-3 py-1 uppercase text-[9px] tracking-widest">Action Required</Badge>
                                                )}
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                                    <div className="flex items-center gap-3">
                                                        <UserCircle2 className="w-5 h-5 text-gray-400" />
                                                        <span className="text-xs font-bold text-gray-600">Personal Details</span>
                                                    </div>
                                                    {profile?.full_name ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                                                </div>
                                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                                    <div className="flex items-center gap-3">
                                                        <Sparkles className="w-5 h-5 text-gray-400" />
                                                        <span className="text-xs font-bold text-gray-600">Bio & Skills</span>
                                                    </div>
                                                    {profile?.bio && profile?.skills?.length ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                                                </div>
                                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="w-5 h-5 text-gray-400" />
                                                        <span className="text-xs font-bold text-gray-600">Intelligence Dossier (CV)</span>
                                                    </div>
                                                    {profile?.cv_url ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                                                </div>
                                            </div>

                                            {!isProfileComplete && (
                                                <div className="p-6 bg-[#C7A24D]/5 border border-[#C7A24D]/10 rounded-2xl space-y-4">
                                                    <p className="text-[10px] font-black text-[#C7A24D] uppercase tracking-widest text-center">Your profile intel is insufficient for this mission.</p>
                                                    <Button asChild className="w-full bg-[#C7A24D] text-white hover:bg-[#C7A24D]/90 h-12 font-bold rounded-xl text-xs uppercase tracking-widest">
                                                        <Link href="/profile/wizard">Update Professional Profile</Link>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* Detailed Info Section */}
            <main className="flex-grow container mx-auto px-4 py-20 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    <div className="lg:col-span-8 space-y-20">
                        {/* Mission Briefing Metadata */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-6 bg-white border border-gray-100 rounded-3xl space-y-2">
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Hiring Speed</p>
                                <p className="text-sm font-black text-gray-900 uppercase">Fast Tracking</p>
                            </div>
                            <div className="p-6 bg-white border border-gray-100 rounded-3xl space-y-2">
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Security Level</p>
                                <p className="text-sm font-black text-gray-900 uppercase">Verified Professional</p>
                            </div>
                            <div className="p-6 bg-white border border-gray-100 rounded-3xl space-y-2">
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Career Path</p>
                                <p className="text-sm font-black text-gray-900 uppercase">Linear Growth</p>
                            </div>
                            <div className="p-6 bg-white border border-gray-100 rounded-3xl space-y-2">
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Operational Shift</p>
                                <p className="text-sm font-black text-gray-900 uppercase">Hybrid-Flexible</p>
                            </div>
                        </div>

                        {/* Description */}
                        <section className="space-y-8">
                            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-4 tracking-tight uppercase">
                                <div className="w-2 h-10 bg-[#C7A24D] rounded-full" /> Mission Narrative
                            </h2>
                            <div className="prose prose-slate max-w-none text-gray-600 leading-relaxed text-lg font-medium">
                                {job.description.split('\n').map((para, i) => (
                                    <p key={i} className="mb-6">{para}</p>
                                ))}
                            </div>
                        </section>

                        {/* Requirements */}
                        <section className="space-y-8">
                            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-4 tracking-tight uppercase">
                                <div className="w-2 h-10 bg-[#C7A24D] rounded-full" /> Intelligence Requirements
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                {job.requirements.split('\n').filter(r => r.trim()).map((req, i) => (
                                    <div key={i} className="flex gap-4 items-start group">
                                        <div className="mt-2 w-2 h-2 rounded-full bg-gray-200 group-hover:bg-[#C7A24D] transition-colors" />
                                        <p className="text-gray-500 font-bold text-sm tracking-wide leading-relaxed">{req}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Metadata Column */}
                    <div className="lg:col-span-4 space-y-10">
                        <section className="p-10 bg-white border border-gray-100 rounded-[40px] shadow-sm">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-10 text-center">Role Specifications</h3>
                            <div className="space-y-8">
                                <div className="flex flex-col items-center text-center gap-2">
                                    <Globe className="w-8 h-8 text-gray-100" />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global Focus</span>
                                    <span className="font-bold text-gray-900">Geospatial Intelligence</span>
                                </div>
                                <div className="w-full h-px bg-gray-50" />
                                <div className="flex flex-col items-center text-center gap-2">
                                    <Database className="w-8 h-8 text-gray-100" />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Data Integrity</span>
                                    <span className="font-bold text-gray-900">High Precision</span>
                                </div>
                                <div className="w-full h-px bg-gray-50" />
                                <div className="flex flex-col items-center text-center gap-2">
                                    <Satellite className="w-8 h-8 text-gray-100" />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sector</span>
                                    <span className="font-bold text-gray-900">{job.department} Intelligence</span>
                                </div>
                            </div>
                        </section>

                        <div className="bg-gradient-to-br from-[#C7A24D] to-[#D97D25] p-8 rounded-[40px] text-white space-y-6 shadow-xl shadow-[#C7A24D]/20">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Corporate Ethics</p>
                            <h4 className="text-2xl font-black leading-tight tracking-tight italic">"Navigating the Future of Geographic Excellence."</h4>
                            <p className="text-sm font-bold opacity-80 leading-relaxed">Join a global team dedicated to the evolution of spatial intelligence at GEOINFORMATIC.</p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
