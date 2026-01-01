"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import HeaderNavigation from "@/components/sections/header-navigation";
import Footer from "@/components/sections/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Send,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Job, UserProfile } from "@/components/profile/types";

export default function SimpleApplyPage() {
    const { id } = useParams();
    const router = useRouter();
    const supabase = createClient();

    const { user, loading: authLoading } = useAuth();
    const [job, setJob] = useState<Job | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (authLoading) return;
            setIsLoading(true);
            try {
                // 1. Auth Check
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

                // Redirect if external link exists (should use external apply)
                if (jobData?.external_link) {
                    window.location.href = jobData.external_link;
                    return;
                }

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
    }, [id, supabase, router, user, authLoading]);

    // Profile Completion Check
    const isProfileComplete = profile && (
        profile.full_name &&
        profile.email &&
        profile.phone_number &&
        profile.location &&
        profile.bio &&
        profile.cv_url &&
        Array.isArray(profile.skills) && profile.skills.length > 0
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isProfileComplete || !job || !profile) return;

        setIsSubmitting(true);
        try {
            const resp = await fetch('/api/jobs/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ job_id: job.id }) // Removed coverLetter
            })
            const json = await resp.json()
            if (!resp.ok) {
                if (resp.status === 401) {
                    router.push(`/auth/login?redirect=/jobs/${id}/apply`)
                    return
                }
                if (resp.status === 409 && json?.error === 'already_applied') {
                    toast.info('You have already applied for this position.')
                    router.push(`/jobs/${id}`)
                    return
                }
                throw new Error(json?.error || 'Application failed')
            }

            toast.success("Application Submitted Successfully!");
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
                <div className="flex-1 container mx-auto px-4 text-center flex flex-col items-center justify-center">
                    <Loader2 className="w-12 h-12 animate-spin text-[#C7A24D] mb-4" />
                    <p className="text-gray-400 font-medium">Loading application...</p>
                </div>
            </div>
        );
    }

    if (!job) return null;

    return (
        <div className="min-h-screen bg-[#FDFDFD] flex flex-col pt-[80px]">
            <HeaderNavigation />

            <main className="flex-grow container mx-auto px-4 py-16 max-w-4xl">
                <Link
                    href={`/jobs/${id}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-primary mb-10 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Job Details
                </Link>

                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Apply for <span className="text-primary">{job.title}</span></h1>
                    <p className="text-lg font-medium text-gray-500">{job.department} • {job.location}</p>
                </div>

                {!isProfileComplete ? (
                    <Card className="border-amber-200 bg-amber-50 rounded-[32px] overflow-hidden">
                        <CardContent className="p-12 text-center space-y-8">
                            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                <AlertCircle className="w-10 h-10 text-amber-600" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-2xl font-black text-gray-900">Complete Your Profile</h3>
                                <p className="text-gray-600 text-lg max-w-lg mx-auto leading-relaxed">
                                    To apply for this position, you need to complete your professional profile. Please ensure you have added your <strong>Resume (CV)</strong>, <strong>Bio</strong>, <strong>Skills</strong>, and <strong>Phone Number</strong>.
                                </p>
                            </div>
                            <Button asChild size="lg" className="h-14 px-8 rounded-xl bg-[#C7A24D] hover:bg-[#b08d3b] text-white font-bold shadow-lg hover:shadow-xl transition-all">
                                <Link href="/profile/wizard">Go to Profile Settings</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] bg-white rounded-[40px] overflow-hidden">
                        <CardContent className="p-12">
                            <form onSubmit={handleSubmit} className="space-y-10">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="h-12 w-1.5 bg-primary rounded-full" />
                                        <div>
                                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Your Information</h3>
                                            <p className="text-gray-400 font-medium">Verify your details before applying</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-1">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Full Name</span>
                                            <div className="text-lg font-bold text-gray-900">{profile?.full_name}</div>
                                        </div>
                                        <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-1">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email Address</span>
                                            <div className="text-lg font-bold text-gray-900">{profile?.email}</div>
                                        </div>
                                        <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-1">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Phone Number</span>
                                            <div className="text-lg font-bold text-gray-900">{profile?.phone_number}</div>
                                        </div>
                                        <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-1 flex flex-col justify-center">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Attached Resume</span>
                                            <a href={profile?.cv_url || '#'} target="_blank" className="text-primary font-bold hover:underline flex items-center gap-2">
                                                View Document <ArrowLeft className="w-3 h-3 rotate-180" />
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-sm text-gray-500 bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                                        <span>Your profile information will be sent directly to the hiring team.</span>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-50">
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full h-16 text-lg bg-gradient-to-r from-primary to-[#D97D25] hover:opacity-90 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                                    >
                                        {isSubmitting ? (
                                            <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Processing Application...</>
                                        ) : (
                                            <><Send className="w-5 h-5 mr-3" /> Submit Application</>
                                        )}
                                    </Button>
                                    <p className="text-center text-xs text-gray-300 font-bold uppercase tracking-widest mt-6">
                                        By applying you agree to our terms of service
                                    </p>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}
            </main>

            <Footer />
        </div>
    );
}
