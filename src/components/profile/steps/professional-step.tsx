"use client"

import * as React from "react"
import { ProfileStepProps } from "../types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, X, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const ROLE_OPTIONS = [
    "Student",
    "GIS Analyst",
    "Developer",
    "Digital Marketer",
    "Cartographer",
    "Surveyor",
    "Other",
]

export default function ProfessionalStep({ profile, setProfile, onNext, onPrev }: ProfileStepProps) {
    const [skillInput, setSkillInput] = React.useState("")
    const [errors, setErrors] = React.useState<Record<string, string>>({})

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setProfile({ ...profile, [name]: value })
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }))
        }
    }

    const handleRoleChange = (value: string) => {
        setProfile({ ...profile, role: value })
        if (errors.role) {
            setErrors(prev => ({ ...prev, role: "" }))
        }
    }

    const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent) => {
        if ((e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') && e.type !== 'click') return
        e.preventDefault()

        const trimmed = skillInput.trim().toUpperCase()
        if (!trimmed) return

        if (!profile.skills?.includes(trimmed)) {
            setProfile({
                ...profile,
                skills: [...(profile.skills || []), trimmed]
            })
            if (errors.skills) {
                setErrors(prev => ({ ...prev, skills: "" }))
            }
        }
        setSkillInput("")
    }

    const removeSkill = (skillToRemove: string) => {
        setProfile({
            ...profile,
            skills: (profile.skills || []).filter(s => s !== skillToRemove)
        })
    }

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (!profile.role?.trim()) {
            newErrors.role = "Please select your role"
        }
        if (!profile.location?.trim()) {
            newErrors.location = "Location is required"
        }
        if (!profile.skills || profile.skills.length === 0) {
            newErrors.skills = "Please add at least one skill"
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
                <CardTitle className="text-2xl">Professional Details</CardTitle>
                <CardDescription>Share your professional background. All fields marked with * are required.</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
                <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="role" className="flex items-center gap-1">
                                Current Role <span className="text-red-500">*</span>
                            </Label>
                            <Select value={profile.role || ""} onValueChange={handleRoleChange}>
                                <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                                    <SelectValue placeholder="Select your role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLE_OPTIONS.map(role => (
                                        <SelectItem key={role} value={role}>{role}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.role && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> {errors.role}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company">Company / Organization</Label>
                            <Input
                                id="company"
                                name="company"
                                value={profile.company || ""}
                                onChange={handleChange}
                                placeholder="Example Corp"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location" className="flex items-center gap-1">
                            Location <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="location"
                            name="location"
                            value={profile.location || ""}
                            onChange={handleChange}
                            placeholder="City, Country"
                            className={errors.location ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors.location && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> {errors.location}
                            </p>
                        )}
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="skills" className="flex items-center gap-1">
                            Skills <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="skills"
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                onKeyDown={handleAddSkill}
                                placeholder="Type a skill and press Enter (e.g. ArcGIS, React, Python)"
                                className={errors.skills ? "border-red-500 focus-visible:ring-red-500" : ""}
                            />
                            <Button type="button" onClick={handleAddSkill} variant="secondary">Add</Button>
                        </div>
                        {errors.skills && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> {errors.skills}
                            </p>
                        )}

                        <div className="flex flex-wrap gap-2 min-h-[40px] p-3 rounded-lg bg-secondary/30 border border-dashed border-gray-200">
                            {!profile.skills?.length && <span className="text-sm text-muted-foreground self-center px-1">No skills added yet. Add at least one skill.</span>}
                            {profile.skills?.map(skill => (
                                <Badge key={skill} className="pl-3 pr-1.5 py-1.5 gap-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                                    {skill}
                                    <button
                                        type="button"
                                        onClick={() => removeSkill(skill)}
                                        className="hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between pt-6">
                        <Button type="button" variant="outline" onClick={onPrev} className="gap-2">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </Button>
                        <Button type="submit" size="lg" className="gap-2">
                            Next Step <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
