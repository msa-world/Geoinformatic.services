"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import HeaderNavigation from "@/components/sections/header-navigation";
import Footer from "@/components/sections/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    MapPin,
    Clock,
    Building2,
    ArrowLeft,
    Share2,
    Bookmark,
    BookmarkCheck,
    Globe,
    DollarSign,
    CheckCircle2,
    ArrowRight,
    Loader2,
    ExternalLink
} from "lucide-react";
import Link from "next/link";
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
    const { user } = useAuth();
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

            if (user) {
                // Check if saved
                const { data: savedData, error: savedErr } = await supabase
                    .from("saved_jobs")
                    .select("id")
                    .eq("user_id", user.id)
                    .eq("job_id", id)
                    .maybeSingle();
                if (savedErr) console.error("Error fetching saved state:", savedErr);
                setIsSaved(!!savedData);

                // Check if applied
                const { data: appData, error: appErr } = await supabase
                    .from("job_applications")
                    .select("id")
                    .eq("user_id", user.id)
                    .eq("job_id", id)
                    .maybeSingle();
                if (appErr) console.error("Error fetching application state:", appErr);
                setHasApplied(!!appData);
            }
        } catch (error) {
            console.error("Error fetching job:", error);
            toast.error("Job position not found");
            router.push("/jobs");
        } finally {
            setIsLoading(false);
        }
    }, [id, supabase, router, user]);

    useEffect(() => {
        fetchJobDetails();
    }, [fetchJobDetails]);

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: job?.title || 'Job Opportunity',
                    text: `Check out this job: ${job?.title} at ${job?.department}`,
                    url: window.location.href,
                });
            } catch (err) {
                console.error("Error sharing:", err);
            }
        } else {
            // Fallback to clipboard
            try {
                await navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied to clipboard");
            } catch (err) {
                toast.error("Failed to copy link");
            }
        }
    };

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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex flex-col pt-32">
                <HeaderNavigation />
                <div className="flex-1 container mx-auto px-4 text-center flex flex-col items-center justify-center">
                    <Loader2 className="w-12 h-12 animate-spin text-[#D97D25] mb-4" />
                    <p className="text-gray-400 font-medium">Loading position details...</p>
                </div>
            </div>
        );
    }

    if (!job) return null;

    return (
        <>
            {/* Structured Data for Google Job Search */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org/",
                        "@type": "JobPosting",
                        "title": job.title,
                        "description": job.description,
                        "datePosted": job.created_at,
                        "validThrough": new Date(new Date(job.created_at).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                        "employmentType": job.type,
                        "hiringOrganization": {
                            "@type": "Organization",
                            "name": "Geoinformatic Services",
                            "sameAs": "https://geoinformatic.services",
                            "logo": "https://geoinformatic.services/extra-images/logo.png"
                        },
                        "jobLocation": {
                            "@type": "Place",
                            "address": {
                                "@type": "PostalAddress",
                                "addressLocality": job.location,
                                "addressRegion": "Punjab",
                                "addressCountry": "PK"
                            }
                        },
                        "baseSalary": job.salary_min ? {
                            "@type": "MonetaryAmount",
                            "currency": job.salary_currency || "PKR",
                            "value": {
                                "@type": "QuantitativeValue",
                                "minValue": job.salary_min,
                                "maxValue": job.salary_max,
                                "unitText": "MONTH"
                            }
                        } : undefined
                    })
                }}
            />
            <div className="min-h-screen bg-gray-50 flex flex-col pt-[80px]">
                <HeaderNavigation />

                {/* Header Section */}
                <div className="bg-white border-b border-gray-200">
                    <div className="container mx-auto px-4 py-8 max-w-5xl">
                        <Link
                            href="/jobs"
                            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-6"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Jobs
                        </Link>

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                    <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> {job.department}</span>
                                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>
                                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {job.type}</span>
                                    {job.salary_min && (
                                        <span className="flex items-center gap-1 font-medium text-gray-900">
                                            <DollarSign className="w-4 h-4" />
                                            {job.salary_min.toLocaleString()} - {job.salary_max?.toLocaleString()} {job.salary_currency}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={handleShare}
                                    className="h-11 px-4 border-gray-300"
                                >
                                    <Share2 className="w-5 h-5 text-gray-600" />
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={toggleSave}
                                    className="h-11 px-4 border-gray-300"
                                >
                                    {isSaved ? <BookmarkCheck className="w-5 h-5 text-[#D97D25]" /> : <Bookmark className="w-5 h-5" />}
                                </Button>

                                {hasApplied ? (
                                    <Button disabled className="h-11 px-8 bg-green-600 text-white opacity-100">
                                        <CheckCircle2 className="mr-2 w-4 h-4" /> Applied
                                    </Button>
                                ) : job.external_link ? (
                                    <Button
                                        asChild
                                        className="h-11 px-8 bg-[#D97D25] hover:bg-[#D97D25]/90 text-white font-bold"
                                    >
                                        {user ? (
                                            <a href={job.external_link} target="_blank" rel="noopener noreferrer">
                                                Apply on Company Site <ExternalLink className="ml-2 w-4 h-4" />
                                            </a>
                                        ) : (
                                            <Link href={`/auth/login?redirect=/jobs`}>
                                                Apply on Company Site <ExternalLink className="ml-2 w-4 h-4" />
                                            </Link>
                                        )}
                                    </Button>
                                ) : (
                                    <Button
                                        asChild
                                        className="h-11 px-8 bg-[#D97D25] hover:bg-[#D97D25]/90 text-white font-bold"
                                    >
                                        <Link href={user ? `/jobs/${id}/apply` : `/auth/login?redirect=/jobs/${id}/apply`}>
                                            Apply Now <ArrowRight className="ml-2 w-4 h-4" />
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <main className="flex-grow container mx-auto px-4 py-12 max-w-5xl">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2 space-y-10 text-lg text-gray-700 leading-relaxed">
                            <section>
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
                                <div className="whitespace-pre-wrap">{job.description}</div>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Requirements</h2>
                                <ul className="list-disc pl-5 space-y-2">
                                    {job.requirements.split('\n').filter(r => r.trim()).map((req, i) => (
                                        <li key={i}>{req}</li>
                                    ))}
                                </ul>
                            </section>
                        </div>

                        {/* Simple Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="font-semibold text-gray-900 mb-4">Job Info</h3>
                                <div className="space-y-4 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Posted</span>
                                        <span className="font-medium text-gray-900">{new Date(job.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Type</span>
                                        <span className="font-medium text-gray-900">{job.type}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Department</span>
                                        <span className="font-medium text-gray-900">{job.department}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Location</span>
                                        <span className="font-medium text-gray-900">{job.location}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                <Footer />
            </div>
        </>
    );
}
