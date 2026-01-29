"use client"

import * as React from "react"
import { ProfileStepProps } from "../types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Upload, FileText, UserCircle, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function DocumentsStep({ profile, setProfile, onNext, onPrev }: ProfileStepProps) {
    const [activeUpload, setActiveUpload] = React.useState<"avatar" | "cv" | null>(null)
    const [errors, setErrors] = React.useState<Record<string, string>>({})

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "cv_url" | "avatar_url") => {
        const file = e.target.files?.[0]
        if (!file) return

        setActiveUpload(field === "cv_url" ? "cv" : "avatar")

        try {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("field", field)

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })

            if (!res.ok) throw new Error("Upload failed")

            const data = await res.json()

            setProfile({ ...profile, [field]: data.url || profile[field] })

            // Clear CV error if CV was uploaded
            if (field === "cv_url" && errors.cv_url) {
                setErrors(prev => ({ ...prev, cv_url: "" }))
            }

        } catch (error) {
            console.error("Upload error", error)
            alert("Failed to upload file.")
        } finally {
            setActiveUpload(null)
        }
    }

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (!profile.cv_url) {
            newErrors.cv_url = "CV is required. Please upload your resume."
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleNext = () => {
        if (validate()) {
            onNext()
        }
    }

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0">
                <CardTitle className="text-2xl">Documents & Photos</CardTitle>
                <CardDescription>Upload your profile picture and CV. <strong>CV is required</strong> to apply for jobs.</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
                <div className="space-y-6 max-w-2xl">

                    {/* Avatar Upload */}
                    <div className="flex flex-col sm:flex-row gap-6 items-start p-6 border rounded-xl bg-card">
                        <div className="shrink-0 relative">
                            {profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt="Avatar"
                                    className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-sm"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center">
                                    <UserCircle className="w-12 h-12 text-muted-foreground" />
                                </div>
                            )}
                            {activeUpload === "avatar" && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                                </div>
                            )}
                        </div>
                        <div className="space-y-3 flex-1">
                            <h4 className="font-semibold text-lg">Profile Picture</h4>
                            <p className="text-sm text-muted-foreground">
                                Upload a professional photo to help others recognize you. JPG, PNG or GIF.
                            </p>
                            <div className="flex gap-3">
                                <Button variant="outline" size="sm" className="relative" disabled={activeUpload === "avatar"}>
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(e, "avatar_url")}
                                    />
                                    Upload new photo
                                </Button>
                                {profile.avatar_url && (
                                    <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Uploaded</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* CV Upload */}
                    <div className={`flex flex-col sm:flex-row gap-6 items-start p-6 border rounded-xl ${errors.cv_url ? 'border-red-300 bg-red-50/30' : 'bg-card'}`}>
                        <div className="shrink-0">
                            <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${profile.cv_url ? 'bg-green-50 text-green-600' : 'bg-blue-50/50 text-blue-600'}`}>
                                <FileText className="w-8 h-8" />
                            </div>
                        </div>
                        <div className="space-y-3 flex-1">
                            <h4 className="font-semibold text-lg flex items-center gap-2">
                                Curriculum Vitae (CV) <span className="text-red-500 text-sm">*</span>
                            </h4>
                            <div className="text-sm text-muted-foreground">
                                {profile.cv_url ? (
                                    <div className="flex items-center gap-2 text-green-600 font-medium my-1">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>CV Uploaded</span>
                                        <a href={profile.cv_url} target="_blank" className="underline text-xs text-blue-600" rel="noreferrer">View</a>
                                    </div>
                                ) : (
                                    "Upload your latest CV/Resume to apply for jobs. PDF, DOC, DOCX accepted."
                                )}
                            </div>
                            {errors.cv_url && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> {errors.cv_url}
                                </p>
                            )}
                            <Button variant={profile.cv_url ? "outline" : "default"} size="sm" className="relative" disabled={activeUpload === "cv"}>
                                {activeUpload === "cv" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => handleFileUpload(e, "cv_url")}
                                />
                                {profile.cv_url ? "Replace CV" : "Upload CV"}
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-between pt-6">
                        <Button type="button" variant="outline" onClick={onPrev} className="gap-2">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </Button>
                        <Button type="button" onClick={handleNext} size="lg" className="gap-2">
                            Review & Finish <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
