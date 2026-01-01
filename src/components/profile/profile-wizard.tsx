"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { User, Building2, FileText, CheckCircle2 } from "lucide-react"
import { UserProfile } from "./types"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"

import PersonalDetailsStep from "./steps/personal-details-step"
import ProfessionalStep from "./steps/professional-step"
import DocumentsStep from "./steps/documents-step"
import CompletionStep from "./steps/completion-step"

const steps = [
    {
        id: "details",
        label: "Your details",
        description: "Name and email",
        icon: User,
    },
    {
        id: "professional",
        label: "Professional",
        description: "Role and skills",
        icon: Building2,
    },
    {
        id: "documents",
        label: "Documents",
        description: "CV and Photo",
        icon: FileText,
    },
    {
        id: "completion",
        label: "All Set",
        description: "Review & Finish",
        icon: CheckCircle2,
    },
]

export default function ProfileWizard() {
    const [currentStep, setCurrentStep] = React.useState(0)
    const [profile, setProfile] = React.useState<UserProfile>({
        id: "",
        email: "",
        skills: [],
    })
    const [isLoading, setIsLoading] = React.useState(true)
    const [isSaving, setIsSaving] = React.useState(false)

    const { user, loading: authLoading } = useAuth()
    const supabase = createClient()
    const router = useRouter()

    React.useEffect(() => {
        const fetchProfile = async () => {
            if (authLoading) return

            try {
                if (!user) {
                    router.push("/auth/login")
                    return
                }

                const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()

                if (data) {
                    const skills = Array.isArray(data.skills) ? data.skills : []
                    setProfile({ ...data, skills })

                    // Strict Check for "Completion" status
                    // Only jump to completion if ALL critical fields are present
                    const isFullyComplete =
                        data.full_name &&
                        data.role &&
                        data.email &&
                        data.phone_number &&
                        data.location &&
                        data.bio && // Require bio
                        Array.isArray(data.skills) && data.skills.length > 0
                        // data.cv_url // Optional or Required? User said "COMPLETE ALL ITS FIELDS". Let's verify cv_url too if we want "very robust".
                        // Let's assume cv_url is required as per "ALL ITS FEILDS" request.
                        && data.cv_url

                    if (isFullyComplete) {
                        setCurrentStep(steps.length - 1)
                    } else {
                        // If not complete, start at 0 (or find the first incomplete step, but 0 makes sense to force review)
                        setCurrentStep(0)
                    }
                } else {
                    setProfile(p => ({ ...p, id: user.id, email: user.email || "" }))
                }

            } catch (error) {
                console.error("Error loading profile", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchProfile()
    }, [user, authLoading])

    const handleNext = async () => {
        if (currentStep < steps.length - 1) {
            await saveProfile()
            setCurrentStep((prev) => prev + 1)
        }
    }

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1)
        }
    }

    const saveProfile = async () => {
        setIsSaving(true)
        try {
            const { error } = await supabase.from("profiles").update({
                ...profile,
                updated_at: new Date().toISOString(),
            }).eq("id", profile.id)

            if (error) throw error
        } catch (e) {
            console.error("Error saving profile:", e)
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return <div className="flex h-[50vh] items-center justify-center text-muted-foreground">Loading profile...</div>
    }

    const CurrentStepComponent = [
        PersonalDetailsStep,
        ProfessionalStep,
        DocumentsStep,
        CompletionStep
    ][currentStep]

    const progress = ((currentStep) / (steps.length - 1)) * 100

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8">
            {/* Stepper Header */}
            <div className="relative">
                <div className="absolute top-5 left-0 w-full h-0.5 bg-secondary -z-10" />
                <div
                    className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500 ease-in-out -z-10"
                    style={{ width: `${progress}%` }}
                />

                <div className="flex justify-between items-start">
                    {steps.map((step, index) => {
                        const isActive = index === currentStep
                        const isCompleted = index < currentStep
                        const Icon = step.icon

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2">
                                <div
                                    className={cn(
                                        "flex items-center justify-center w-10 h-10 rounded-lg border-2 transition-all duration-300 bg-background",
                                        isActive ? "border-primary text-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]" :
                                            isCompleted ? "border-primary bg-primary text-primary-foreground" :
                                                "border-muted-foreground/30 text-muted-foreground"
                                    )}
                                >
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="text-center space-y-0.5">
                                    <p className={cn(
                                        "text-sm font-semibold transition-colors duration-300",
                                        isActive || isCompleted ? "text-foreground" : "text-muted-foreground"
                                    )}>
                                        {step.label}
                                    </p>
                                    <p className="text-xs text-muted-foreground hidden sm:block">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Step Content */}
            <div className="mt-8">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                >
                    <CurrentStepComponent
                        profile={profile}
                        setProfile={setProfile}
                        onNext={handleNext}
                        onPrev={handlePrev}
                        goToStep={setCurrentStep}
                        isSaving={isSaving}
                    />
                </motion.div>
            </div>
        </div>
    )
}
