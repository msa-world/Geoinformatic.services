"use client"

import * as React from "react"
import { ProfileStepProps } from "../types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ArrowRight, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function PersonalDetailsStep({ profile, setProfile, onNext }: ProfileStepProps) {
    const [errors, setErrors] = React.useState<Record<string, string>>({})

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setProfile({ ...profile, [name]: value })
        // Clear error on change
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }))
        }
    }

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (!profile.full_name?.trim()) {
            newErrors.full_name = "Full name is required"
        }
        if (!profile.phone_number?.trim()) {
            newErrors.phone_number = "Phone number is required"
        }
        if (!profile.bio?.trim()) {
            newErrors.bio = "Bio is required"
        } else if (profile.bio.trim().length < 20) {
            newErrors.bio = "Bio must be at least 20 characters"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (validate()) {
            onNext()
        }
    }

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0">
                <CardTitle className="text-2xl">Personal Information</CardTitle>
                <CardDescription>Tell us about yourself. All fields are required.</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
                <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="full_name" className="flex items-center gap-1">
                                Full Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="full_name"
                                name="full_name"
                                value={profile.full_name || ""}
                                onChange={handleChange}
                                placeholder="John Doe"
                                className={errors.full_name ? "border-red-500 focus-visible:ring-red-500" : ""}
                            />
                            {errors.full_name && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> {errors.full_name}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone_number" className="flex items-center gap-1">
                                Phone Number <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="phone_number"
                                name="phone_number"
                                value={profile.phone_number || ""}
                                onChange={handleChange}
                                placeholder="+1 (555) 000-0000"
                                className={errors.phone_number ? "border-red-500 focus-visible:ring-red-500" : ""}
                            />
                            {errors.phone_number && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> {errors.phone_number}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bio" className="flex items-center gap-1">
                            Bio <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="bio"
                            name="bio"
                            value={profile.bio || ""}
                            onChange={handleChange}
                            placeholder="Write a short bio about yourself (at least 20 characters)..."
                            rows={5}
                            className={`resize-none ${errors.bio ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                        />
                        {errors.bio && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> {errors.bio}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            {profile.bio?.length || 0} / 20 minimum characters
                        </p>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" size="lg" className="gap-2">
                            Next Step <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
