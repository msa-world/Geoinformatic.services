"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import HeaderNavigation from "@/components/sections/header-navigation"
import Footer from "@/components/sections/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Briefcase, Loader2, CheckCircle2, ChevronRight, ChevronLeft, Upload, MapPin, DollarSign, Building2, Globe, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

const STEPS = [
    { id: 1, title: "Job Basics", description: "Title, location, and type" },
    { id: 2, title: "Details & Salary", description: "Description and compensation" },
    { id: 3, title: "Branding", description: "Logo and external links" },
    { id: 4, title: "Review & Post", description: "Final check before posting" }
]

export default function PostNewJobPage() {
    const [currentStep, setCurrentStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true) // Start loading true
    const [isUploadingLogo, setIsUploadingLogo] = useState(false)
    const [jobLimitReached, setJobLimitReached] = useState(false)

    const [formData, setFormData] = useState({
        title: "",
        department: "General",
        location: "",
        type: "Full-time",
        description: "",
        requirements: "",
        salary_min: "",
        salary_max: "",
        salary_currency: "USD",
        brand_logo_url: "",
        external_link: "",
        urgently_hiring: false
    })

    const router = useRouter()
    const supabase = createClient()
    const { toast } = useToast()
    const { user, loading: authLoading } = useAuth()

    useEffect(() => {
        const checkJobLimit = async () => {
            if (authLoading) return

            if (!user) {
                router.push("/auth/login")
                return
            }

            try {
                const { count, error } = await supabase
                    .from("jobs")
                    .select("*", { count: 'exact', head: true })
                    .eq("posted_by", user.id)
                    .neq("status", "EXPIRED")
                    .neq("status", "DELETED") // Don't count deleted jobs

                if (error) throw error

                if (count !== null && count >= 3) {
                    setJobLimitReached(true)
                }
            } catch (error) {
                console.error("Error checking limits:", error)
            } finally {
                setIsLoading(false)
            }
        }

        checkJobLimit()
    }, [user, authLoading])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleNext = () => {
        if (jobLimitReached) return // Prevent any progress

        // Basic validation per step
        if (currentStep === 1) {
            if (!formData.title || !formData.type) {
                toast({ title: "Required Fields", description: "Please fill in Title and Employment Type.", variant: "destructive" })
                return
            }
        } else if (currentStep === 2) {
            if (!formData.description) {
                toast({ title: "Required Fields", description: "Job Description is required.", variant: "destructive" })
                return
            }
        } else if (currentStep === 3) {
            // 2. Real URL check
            if (formData.external_link) {
                try {
                    new URL(formData.external_link);
                } catch (_) {
                    toast({
                        title: "Invalid URL",
                        description: "Please enter a valid URL (including http:// or https://) for the External Link, or leave it empty.",
                        variant: "destructive"
                    })
                    return;
                }
            }
        }
        setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
    }

    const handlePrev = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1))
    }

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        const file = e.target.files[0]

        // 1. Real limit check (2MB)
        const maxSizeInBytes = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSizeInBytes) {
            toast({
                title: "File Too Large",
                description: "Logo image must be less than 2MB.",
                variant: "destructive"
            })
            return
        }

        setIsUploadingLogo(true)
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `brand-logos/${fileName}`

        try {
            // Check if bucket exists, or just try upload. 
            // We try to upload to 'job-assets' bucket.
            const { error: uploadError } = await supabase.storage
                .from('job-assets')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('job-assets')
                .getPublicUrl(filePath)

            setFormData(prev => ({ ...prev, brand_logo_url: publicUrl }))
            toast({ title: "Logo Uploaded", description: "Brand logo attached successfully." })

        } catch (error: any) {
            console.error("Upload error:", error)
            toast({
                title: "Upload Failed",
                description: "Could not upload logo. Ensure you have a 'job-assets' public bucket in Supabase.",
                variant: "destructive"
            })
        } finally {
            setIsUploadingLogo(false)
        }
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)

        if (!user) {
            toast({ title: "Authentication Required", description: "Please log in to post a job.", variant: "destructive" })
            router.push("/auth/login")
            setIsSubmitting(false)
            return
        }

        const payload = {
            title: formData.title,
            department: formData.department,
            location: formData.location || "Remote",
            type: formData.type,
            description: formData.description,
            requirements: formData.requirements || "See description",
            status: "OPEN",
            posted_by: user.id,
            salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
            salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
            salary_currency: formData.salary_currency,
            brand_logo_url: formData.brand_logo_url,
            external_link: formData.external_link,
            urgently_hiring: formData.urgently_hiring
        }

        const { data, error } = await supabase
            .from("jobs")
            .insert([payload])
            .select()

        if (error) {
            console.error("Error posting job:", error)
            // Specific check for missing column error
            if (error.code === "PGRST204" && error.message.includes("brand_logo_url")) {
                toast({
                    title: "System Error",
                    description: "Database schema is outdated. Please run the migration script we provided.",
                    variant: "destructive"
                })
            } else {
                toast({ title: "Error", description: `Failed to post job: ${error.message}`, variant: "destructive" })
            }
        } else {
            // Trigger Job Alerts (Fire and forget)
            fetch('/api/jobs/alert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId: data[0].id })
            }).catch(err => console.error("Failed to trigger alerts:", err));

            toast({ title: "Job Posted!", description: "Your job listing is now live." })
            router.push("/profile/my-jobs")
        }

        setIsSubmitting(false)
    }

    // Step Content Renderers
    const renderStep1 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="title" className="text-sm font-semibold">Job Title <span className="text-red-500">*</span></Label>
                    <Input
                        id="title"
                        name="title"
                        placeholder="e.g., Senior GIS Analyst"
                        value={formData.title}
                        onChange={handleChange}
                        className="h-11"
                        autoFocus
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="department" className="text-sm font-semibold">Department</Label>
                    <div className="relative">
                        <Briefcase className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <Input
                            id="department"
                            name="department"
                            placeholder="e.g., Remote Sensing"
                            value={formData.department}
                            onChange={handleChange}
                            className="h-11 pl-9"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-semibold">Location</Label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <Input
                            id="location"
                            name="location"
                            placeholder="e.g., Islamabad / Remote"
                            value={formData.location}
                            onChange={handleChange}
                            className="h-11 pl-9"
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-2 md:col-span-2 bg-orange-50 p-4 rounded-lg border border-orange-100">
                    <input
                        type="checkbox"
                        id="urgently_hiring"
                        checked={formData.urgently_hiring}
                        onChange={(e) => setFormData(prev => ({ ...prev, urgently_hiring: e.target.checked }))}
                        className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <div className="grid gap-1.5 leading-none">
                        <label
                            htmlFor="urgently_hiring"
                            className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-orange-900"
                        >
                            Urgently hiring
                        </label>
                        <p className="text-xs text-orange-700">
                            Highlight this job with a special tag to attract more candidates fast.
                        </p>
                    </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="type" className="text-sm font-semibold">Employment Type <span className="text-red-500">*</span></Label>
                    <Select value={formData.type} onValueChange={(val) => setFormData(prev => ({ ...prev, type: val }))}>
                        <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Full-time">Full-time</SelectItem>
                            <SelectItem value="Part-time">Part-time</SelectItem>
                            <SelectItem value="Contract">Contract</SelectItem>
                            <SelectItem value="Internship">Internship</SelectItem>
                            <SelectItem value="Remote">Remote</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    )

    const renderStep2 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold">Job Description <span className="text-red-500">*</span></Label>
                <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe the role responsibilities..."
                    value={formData.description}
                    onChange={handleChange}
                    rows={8}
                    className="resize-none"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="requirements" className="text-sm font-semibold">Requirements</Label>
                <Textarea
                    id="requirements"
                    name="requirements"
                    placeholder="List key skills and qualifications..."
                    value={formData.requirements}
                    onChange={handleChange}
                    rows={6}
                    className="resize-none"
                />
            </div>

            <div className="space-y-2 pt-4 border-t">
                <Label className="text-sm font-semibold flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" /> Salary Range (Optional)
                </Label>
                <div className="flex gap-4">
                    <Input
                        type="number"
                        name="salary_min"
                        placeholder="Min"
                        value={formData.salary_min}
                        onChange={handleChange}
                        className="h-11"
                    />
                    <span className="self-center text-gray-400 font-medium">-</span>
                    <Input
                        type="number"
                        name="salary_max"
                        placeholder="Max"
                        value={formData.salary_max}
                        onChange={handleChange}
                        className="h-11"
                    />
                    <Select value={formData.salary_currency} onValueChange={(val) => setFormData(prev => ({ ...prev, salary_currency: val }))}>
                        <SelectTrigger className="w-[110px] h-11">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                            <SelectItem value="PKR">PKR</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    )

    const renderStep3 = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Branding Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-indigo-500" /> Brand Logo
                    </Label>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Optional</span>
                </div>

                <Card className="border-dashed border-2 bg-slate-50 shadow-none">
                    <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                        {formData.brand_logo_url ? (
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-lg border-2 border-white shadow-lg overflow-hidden bg-white flex items-center justify-center">
                                    <img src={formData.brand_logo_url} alt="Logo" className="w-full h-full object-contain" />
                                </div>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 shadow-sm"
                                    onClick={() => setFormData(prev => ({ ...prev, brand_logo_url: "" }))}
                                >
                                    ×
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-slate-100">
                                    <Upload className="w-8 h-8 text-slate-300" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Click to upload brand logo</p>
                                    <p className="text-xs text-slate-500">SVG, PNG, JPG (Max 2MB)</p>
                                </div>
                                <div className="relative">
                                    <Input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        disabled={isUploadingLogo}
                                    />
                                    <Button variant="outline" size="sm" disabled={isUploadingLogo}>
                                        {isUploadingLogo ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                                        Select File
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* URL Failover */}
                        <div className="w-full mt-6 pt-6 border-t border-dashed relative">
                            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-50 px-2 text-xs text-muted-foreground">OR</span>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Paste image URL directly..."
                                    value={formData.brand_logo_url}
                                    onChange={handleChange}
                                    name="brand_logo_url"
                                    className="bg-white"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* External Link */}
            <div className="space-y-4">
                <Label className="text-base font-semibold flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-500" /> External Application Link
                </Label>
                <div className="relative">
                    <Globe className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                        name="external_link"
                        placeholder="e.g., https://yourcompany.com/careers/job-123"
                        value={formData.external_link}
                        onChange={handleChange}
                        className="pl-9 h-11"
                    />
                </div>
                <p className="text-sm text-muted-foreground">
                    If provided, applicants will be redirected to this URL to apply.
                </p>
            </div>
        </div>
    )

    const renderStep4 = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>

                {/* Preview Card matching Jobs Page */}
                <div className="relative p-5 rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 overflow-hidden group">
                    <div className="flex flex-wrap gap-2 mb-3">
                        <span className="text-[10px] font-bold text-[#D97D25] bg-[#D97D25]/10 px-2 py-0.5 rounded-sm uppercase tracking-wide">
                            New
                        </span>
                        {formData.urgently_hiring && (
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-sm uppercase tracking-wide">
                                Urgently hiring
                            </span>
                        )}
                    </div>

                    <div className="flex items-start gap-4">
                        {formData.brand_logo_url ? (
                            <div className="w-12 h-12 rounded-lg border border-gray-100 p-1 bg-white shrink-0">
                                <img src={formData.brand_logo_url} alt="Logo" className="w-full h-full object-contain" />
                            </div>
                        ) : (
                            <div className="w-12 h-12 rounded-lg border border-gray-100 p-1 bg-white shrink-0 flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-gray-300" />
                            </div>
                        )}
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-[#D97D25] transition-colors">
                                {formData.title || "Job Title"}
                            </h3>

                            <div className="text-sm text-gray-600 mb-2">
                                {formData.department || "General"}
                            </div>
                        </div>
                    </div>

                    <div className="text-sm text-gray-500 mb-3 space-y-1">
                        <div className="font-semibold text-gray-700">
                            {formData.location || "Remote"}
                        </div>
                        {(formData.salary_min || formData.salary_max) && (
                            <div className="bg-gray-100 w-fit px-2 py-1 rounded text-xs font-bold text-gray-700 flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                {formData.salary_min && !formData.salary_max && `${formData.salary_currency || '$'} ${parseInt(formData.salary_min).toLocaleString()} a month`}
                                {formData.salary_min && formData.salary_max && `${formData.salary_currency || '$'} ${parseInt(formData.salary_min).toLocaleString()} - ${parseInt(formData.salary_max).toLocaleString()} a month`}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4 mt-4 text-xs font-semibold text-gray-500">
                        {!formData.external_link ? (
                            <div className="flex items-center gap-2 text-[#D97D25]">
                                <Briefcase className="w-3 h-3" />
                                <span>Simple Apply</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-blue-600">
                                <Globe className="w-3 h-3" />
                                <span>External Apply</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Just now</span>
                        </div>
                    </div>

                    <div className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
                        <div className="w-6 h-6 text-gray-400" >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bookmark"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></svg>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                    <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description Preview</Label>
                    <div className="mt-2 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                        {formData.description}
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen flex flex-col bg-slate-50/50">
            <HeaderNavigation />

            <main className="flex-1 pt-24 pb-16">
                <div className="bg-white border-b py-8 mb-8 shadow-sm">
                    <div className="container mx-auto px-4 max-w-3xl">
                        <Link href="/profile/my-jobs" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to My Jobs
                        </Link>

                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">Post a New Job</h1>
                                <p className="text-muted-foreground">Find the perfect candidate for your position.</p>

                                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-20"></div>
                                        <div className="relative p-1.5 bg-amber-100 rounded-full">
                                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-amber-800">
                                            Auto-Expiration Notice
                                        </p>
                                        <p className="text-xs text-amber-600 mt-0.5">
                                            All posted jobs will automatically close after <span className="font-semibold">30 days</span> to keep listing fresh.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="hidden sm:block">
                                <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground bg-slate-100 px-3 py-1 rounded-full">
                                    Step {currentStep} of {STEPS.length}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 max-w-3xl">
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : jobLimitReached ? (
                        <div className="animate-in fade-in zoom-in-95 duration-300">
                            <Card className="border-red-100 shadow-lg bg-white overflow-hidden">
                                <div className="h-2 bg-red-500 w-full"></div>
                                <CardContent className="flex flex-col items-center justify-center py-16 text-center px-8">
                                    <div className="p-4 bg-red-50 rounded-full mb-6 relative">
                                        <div className="absolute inset-0 bg-red-200 rounded-full animate-ping opacity-20"></div>
                                        <Briefcase className="w-12 h-12 text-red-600 relative z-10" />
                                    </div>

                                    <h2 className="text-3xl font-bold text-gray-900 mb-3">Limit Reached</h2>

                                    <div className="max-w-md space-y-4">
                                        <p className="text-lg text-gray-600">
                                            You have reached the maximum limit of <span className="font-bold text-gray-900">3 active jobs</span> per account.
                                        </p>

                                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-500">
                                            To maintain quality and freshness on our platform, we limit the number of simultaneous job postings.
                                        </div>

                                        <p className="text-muted-foreground">
                                            To post a new opportunity, please remove an older listing or wait for one to expire.
                                        </p>
                                    </div>

                                    <Button asChild size="lg" className="mt-8 bg-red-600 hover:bg-red-700 shadow-md transition-all hover:scale-105">
                                        <Link href="/profile/my-jobs">
                                            Manage My Jobs
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto pb-12">
                            {/* Mobile Progress Bar */}
                            <div className="sm:hidden w-full bg-slate-200 h-1.5 rounded-full mb-6 overflow-hidden">
                                <div
                                    className="bg-[#D97D25] h-full transition-all duration-300"
                                    style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                                />
                            </div>

                            <Card className="shadow-lg border-0 overflow-hidden bg-white">
                                {/* Stepper Header (Desktop) */}
                                <div className="hidden sm:grid grid-cols-4 border-b divide-x bg-gray-50/50">
                                    {STEPS.map((step) => (
                                        <div
                                            key={step.id}
                                            className={`
                                        p-4 flex items-center gap-3 transition-colors
                                        ${currentStep === step.id ? 'bg-white text-[#D97D25]' : 'text-muted-foreground'}
                                        ${currentStep > step.id ? 'text-green-600' : ''}
                                    `}
                                        >
                                            <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                                        ${currentStep === step.id ? 'border-[#D97D25] bg-[#D97D25]/10' : 'border-gray-200 bg-white'}
                                        ${currentStep > step.id ? 'bg-green-100 border-green-600 text-green-700' : ''}
                                    `}>
                                                {currentStep > step.id ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                                            </div>
                                            <div className="flex flex-col leading-none gap-1">
                                                <span className="font-semibold text-sm">{step.title}</span>
                                                <span className="text-xs opacity-70">{step.description}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <CardContent className="p-6 sm:p-8 min-h-[400px]">
                                    {isLoading ? (
                                        <div className="space-y-4">
                                            <Skeleton className="h-10 w-3/4" />
                                            <Skeleton className="h-32 w-full" />
                                            <Skeleton className="h-10 w-1/2" />
                                        </div>
                                    ) : (
                                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                            {currentStep === 1 && renderStep1()}
                                            {currentStep === 2 && renderStep2()}
                                            {currentStep === 3 && renderStep3()}
                                            {currentStep === 4 && renderStep4()}
                                        </div>
                                    )}
                                </CardContent>

                                <CardFooter className="p-6 bg-gray-50/50 border-t flex justify-between items-center">
                                    <Button
                                        variant="outline"
                                        onClick={handlePrev}
                                        disabled={currentStep === 1 || isSubmitting}
                                        className="h-11 px-6 border-gray-300 hover:bg-white"
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-2" /> Back
                                    </Button>

                                    {currentStep < STEPS.length ? (
                                        <Button
                                            onClick={handleNext}
                                            className="bg-[#D97D25] hover:bg-[#D97D25]/90 text-white font-bold px-8 h-12 rounded-xl"
                                        >
                                            Next Step <ChevronRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                            className="h-11 px-8 shadow-md bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            {isSubmitting ? (
                                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publishing...</>
                                            ) : (
                                                <><CheckCircle2 className="w-4 h-4 mr-2" /> Post Job Now</>
                                            )}
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        </div>
                    )}
                </div>
            </main >

            <Footer />
        </div >
    )
}
