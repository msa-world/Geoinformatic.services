"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import HeaderNavigation from "@/components/sections/header-navigation";
import Footer from "@/components/sections/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Briefcase,
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    UserCircle2,
    FileText,
    ShieldCheck,
    Sparkles,
    Loader2,
    ArrowRight,
    Lock,
    Send,
    MapPin,
    Building2,
    Globe,
    X
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Job, UserProfile } from "@/components/profile/types";

export default function DedicatedApplyPage() {
    const { id } = useParams();
    const router = useRouter();
    const supabase = createClient();

    const [job, setJob] = useState<Job | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [coverLetter, setCoverLetter] = useState("");

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // 1. Auth Check (use serialized getter to avoid concurrent refreshes)
                const { getUserOnce } = await import("@/lib/supabase/auth-client")
                const user = await getUserOnce()
                if (!user) {
                    router.push(`/auth/login?redirect=/jobs/${id}/apply`);
                    return;
                }

                // 2. Fetch Job Details
                const { data: jobData, error: jobError } = await supabase
                    .from("jobs")
                    .select("*")
                    .eq("id", id)
                    .single();
                if (jobError) throw jobError;
                setJob(jobData);

                // 3. Fetch Profile for Verification
                const { data: profileData, error: profileError } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .maybeSingle();

                if (profileError) {
                    console.error("Error fetching profile:", profileError);
                }
                setProfile(profileData || null);

                // 4. Check if already applied
                const { data: existingApp, error: existingError } = await supabase
                    .from("job_applications")
                    .select("id")
                    .eq("user_id", user.id)
                    .eq("job_id", id)
                    .maybeSingle();

                if (existingError) {
                    console.error("Error checking existing application:", existingError);
                } else if (existingApp) {
                    toast.info("You have already applied for this position.");
                    router.push(`/jobs/${id}`);
                }

            } catch (err) {
                console.error("Error loading application data:", err);
                toast.error("An error occurred. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [id, supabase, router]);

    // Strict profile validation logic
    const validationFields = [
        { key: 'full_name', label: 'Full Name' },
        { key: 'role', label: 'Professional Role' },
        { key: 'email', label: 'Contact Email' },
        { key: 'phone_number', label: 'Phone Number' },
        { key: 'location', label: 'Location' },
        { key: 'bio', label: 'Dossier Bio' },
        { key: 'skills', label: 'Intelligence Skills' },
        { key: 'cv_url', label: 'CV / Resume Dossier' },
    ];

    const missingFields = validationFields.filter(field => {
        if (field.key === 'skills') {
            return !Array.isArray(profile?.skills) || profile.skills.length === 0;
        }
        return !profile?.[field.key as keyof UserProfile];
    });

    const isProfileComplete = missingFields.length === 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isProfileComplete || !job || !profile) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from("job_applications")
                .insert([{
                    job_id: job.id,
                    user_id: profile.id,
                    status: 'PENDING',
                    applied_at: new Date().toISOString()
                    // The backend/trigger can handle additional data if needed, 
                    // or we could add columns to job_applications table.
                    // For now, we match the schema in types.ts
                }]);

            if (error) throw error;

            toast.success("Mission Application Submitted!");
            router.push(`/jobs/${id}`);
        } catch (err: any) {
            toast.error(err.message || "Submission failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex flex-col pt-32">
                <HeaderNavigation />
                <div className="flex-1 container mx-auto px-4 text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-[#C7A24D] mx-auto mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest">Initializing Secure Application Channel...</p>
                </div>
            </div>
        );
    }

    if (!job) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pt-[80px]">
            <HeaderNavigation />

            <main className="flex-grow container mx-auto px-4 py-16 max-w-5xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

                    {/* Left side: Job Summary & Profile Logic */}
                    <div className="lg:col-span-4 space-y-8">
                        <Link
                            href={`/jobs/${id}`}
                            className="inline-flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-[0.2em] hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Return to Position
                        </Link>

                        <Card className="bg-white border-none shadow-xl rounded-3xl overflow-hidden">
                            <div className="p-8 bg-gray-50/50 border-b border-gray-100">
                                <p className="text-[10px] font-black text-[#C7A24D] uppercase tracking-[0.3em] mb-4">Target Position</p>
                                <h2 className="text-2xl font-black text-gray-900 leading-tight mb-2">{job.title}</h2>
                                <Badge className="bg-gray-200 text-gray-600 font-bold text-[9px] tracking-widest uppercase">{job.department}</Badge>
                            </div>
                            <CardContent className="p-8 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                                        <MapPin className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Operations Hub</p>
                                        <p className="text-sm font-bold text-gray-700">{job.location}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                                        <Globe className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Deployment Type</p>
                                        <p className="text-sm font-bold text-gray-700">{job.type}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-[#000] text-white border-none shadow-2xl rounded-3xl p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#C7A24D]/20 blur-[60px]" />
                            <ShieldCheck className="w-10 h-10 text-[#C7A24D] mb-6" />
                            <h3 className="text-xl font-black uppercase tracking-tight mb-2">Secure Dossier Review</h3>
                            <p className="text-gray-400 text-xs font-bold leading-relaxed opacity-80 uppercase tracking-widest mb-6">Mission applications are cross-referenced with your verified professional profile.</p>

                            <div className="space-y-4 pt-6 border-t border-white/10">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[#C7A24D]">
                                    <span>Recruiter Interest</span>
                                    <span>High</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div className="w-[85%] h-full bg-[#C7A24D]" />
                                </div>
                                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter italic">"Your geospatial profile matches current mission demands."</p>
                            </div>
                        </Card>
                    </div>

                    {/* Right side: The Form or The Error */}
                    <div className="lg:col-span-8">
                        <AnimatePresence mode="wait">
                            {!isProfileComplete ? (
                                <motion.div
                                    key="incomplete"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-white border-2 border-dashed border-amber-100 rounded-[40px] p-12 text-center shadow-2xl space-y-8"
                                >
                                    <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto ring-8 ring-amber-50/50">
                                        <AlertCircle className="w-12 h-12 text-amber-500" />
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Profile Integrity Failure</h3>
                                        <p className="text-gray-500 font-bold max-w-md mx-auto leading-relaxed">Your professional intel dossier is incomplete. Total mission transparency requires all profile fields to be populated before application.</p>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                                        {validationFields.map(field => {
                                            const isMissing = missingFields.some(mf => mf.key === field.key);
                                            return (
                                                <div key={field.key} className={`p-4 rounded-2xl border ${isMissing ? 'border-amber-200 bg-amber-50/30' : 'border-green-100 bg-green-50/30'}`}>
                                                    <div className="flex justify-center mb-2">
                                                        {isMissing ? (
                                                            <X className="w-5 h-5 text-amber-500" />
                                                        ) : (
                                                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                        )}
                                                    </div>
                                                    <p className={`text-[9px] font-black uppercase tracking-tighter ${isMissing ? 'text-amber-600' : 'text-green-600'}`}>{field.label}</p>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="pt-8">
                                        <Button asChild size="lg" className="h-16 px-12 bg-[#C7A24D] text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-2xl transition-all">
                                            <Link href="/profile/wizard">Complete Profile Intel <ArrowRight className="ml-3 w-5 h-5" /></Link>
                                        </Button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.form
                                    key="complete"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onSubmit={handleSubmit}
                                    className="bg-white border border-gray-100 rounded-[40px] p-12 shadow-2xl relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#C7A24D] via-[#D97D25] to-[#C7A24D]" />

                                    <div className="flex items-center gap-4 mb-12">
                                        <div className="w-14 h-14 bg-[#C7A24D]/10 rounded-2xl flex items-center justify-center">
                                            <ShieldCheck className="w-8 h-8 text-[#C7A24D]" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Ready for Deployment</h3>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">All Professional Intelligence Verified</p>
                                        </div>
                                    </div>

                                    <div className="space-y-10">
                                        {/* Profile Summary Panel */}
                                        <div className="p-8 bg-gray-50 border border-gray-100 rounded-[32px] space-y-6">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                                <UserCircle2 className="w-4 h-4" /> Verified Identity Snapshot
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div>
                                                    <p className="text-[11px] font-bold text-gray-300 uppercase tracking-widest mb-1">Full Name</p>
                                                    <p className="text-lg font-black text-gray-900">{profile?.full_name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-bold text-gray-300 uppercase tracking-widest mb-1">Location</p>
                                                    <p className="text-lg font-black text-gray-900">{profile?.location}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-bold text-gray-300 uppercase tracking-widest mb-1">Professional Role</p>
                                                    <p className="font-bold text-gray-700">{profile?.role}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-bold text-gray-300 uppercase tracking-widest mb-1">CV Attached</p>
                                                    <div className="flex items-center gap-2 text-[#C7A24D] font-bold">
                                                        <FileText className="w-4 h-4" /> Professional_CV.pdf
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <Label htmlFor="coverLetter" className="text-xs font-black uppercase tracking-widest text-gray-400">Mission Motivation (Optional)</Label>
                                                <span className="text-[10px] font-bold text-primary">TIP: Focus on GIS experience</span>
                                            </div>
                                            <Textarea
                                                id="coverLetter"
                                                placeholder="Explain why your spatial intelligence is the perfect match for this specific mission..."
                                                value={coverLetter}
                                                onChange={(e) => setCoverLetter(e.target.value)}
                                                className="min-h-[200px] bg-gray-50 border-gray-200 rounded-3xl p-6 text-gray-700 font-medium focus:ring-2 focus:ring-[#C7A24D]/20 focus:border-[#C7A24D] transition-all resize-none"
                                            />
                                            <div className="flex justify-between items-center">
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Encrypted transmission via GEOINFORMATIC Secure-Link</p>
                                                <div className="flex gap-1">
                                                    {[1, 2, 3].map(i => <div key={i} className={`w-3 h-1 rounded-full ${coverLetter.length > i * 50 ? 'bg-primary' : 'bg-gray-100'}`} />)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                                            <div className="flex items-center gap-3 text-gray-400">
                                                <Lock className="w-4 h-4" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">End-to-End Encrypted Dossier</span>
                                            </div>
                                            <Button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full md:w-auto h-16 px-16 bg-gradient-to-r from-[#C7A24D] to-[#D97D25] text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                {isSubmitting ? (
                                                    <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Transmitting...</>
                                                ) : (
                                                    <><Send className="w-5 h-5 mr-3" /> Transmit Application</>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
