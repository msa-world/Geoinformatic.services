"use client"

import * as React from "react"
import { ProfileStepProps } from "../types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ArrowRight, Mail, Phone, MapPin, Building2, ExternalLink, Edit2, User as UserIcon, FileText } from "lucide-react"
import Link from "next/link"
import Confetti from "react-confetti"
import { useWindowSize } from "react-use"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

export default function CompletionStep({ profile, goToStep }: ProfileStepProps) {
    const { width, height } = useWindowSize()
    const [showConfetti, setShowConfetti] = React.useState(true)

    React.useEffect(() => {
        const timer = setTimeout(() => setShowConfetti(false), 5000)
        return () => clearTimeout(timer)
    }, [])

    const handleEdit = () => {
        if (goToStep) {
            goToStep(0)
        }
    }

    const getInitials = (name?: string) => {
        if (!name) return "U"
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    }

    return (
        <div className="flex flex-col items-center justify-center pt-6 pb-12">
            {showConfetti && <Confetti width={width} height={height} numberOfPieces={200} recycle={false} />}

            <div className="text-center mb-10 space-y-2">
                <div className="inline-flex items-center justify-center p-3 bg-green-100 rounded-full mb-4 animate-bounce-slow">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold">Profile Completed!</h2>
                <p className="text-muted-foreground">Your profile is now live and up to date.</p>
            </div>

            <Card className="w-full max-w-2xl shadow-xl border-t-4 border-t-primary overflow-hidden">
                <CardHeader className="bg-secondary/10 pb-8 pt-8 text-center relative">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground gap-1"
                        onClick={handleEdit}
                    >
                        <Edit2 className="w-4 h-4" /> Edit
                    </Button>

                    <div className="flex flex-col items-center">
                        <Avatar className="w-24 h-24 border-4 border-background shadow-lg mb-4">
                            <AvatarImage src={profile.avatar_url} />
                            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                {getInitials(profile.full_name)}
                            </AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-2xl mb-1">{profile.full_name || "User Name"}</CardTitle>
                        <p className="text-primary font-medium flex items-center gap-1.5">
                            {profile.role || "No Role Set"}
                        </p>
                    </div>
                </CardHeader>

                <CardContent className="space-y-8 pt-8">
                    {/* Contact Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/5">
                            <div className="p-2 bg-background rounded-md shadow-sm text-primary">
                                <Mail className="w-4 h-4" />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs text-muted-foreground">Email</p>
                                <p className="text-sm font-medium truncate" title={profile.email}>{profile.email}</p>
                            </div>
                        </div>

                        {profile.phone_number && (
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/5">
                                <div className="p-2 bg-background rounded-md shadow-sm text-primary">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Phone</p>
                                    <p className="text-sm font-medium">{profile.phone_number}</p>
                                </div>
                            </div>
                        )}

                        {(profile.company || profile.location) && (
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/5">
                                <div className="p-2 bg-background rounded-md shadow-sm text-primary">
                                    {profile.company ? <Building2 className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Work</p>
                                    <p className="text-sm font-medium">
                                        {profile.company && profile.location ? `${profile.company}, ${profile.location}` : profile.company || profile.location}
                                    </p>
                                </div>
                            </div>
                        )}

                        {profile.cv_url && (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50/50 border border-blue-100 cursor-pointer hover:bg-blue-50 transition-colors">
                                        <div className="p-2 bg-blue-100 rounded-md text-blue-600">
                                            <ExternalLink className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-blue-600/80">Resume</p>
                                            <p className="text-sm font-medium text-blue-700 hover:underline flex items-center gap-1">
                                                View CV
                                            </p>
                                        </div>
                                    </div>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl h-[80vh]">
                                    <div className="w-full h-full flex flex-col">
                                        <div className="flex-1 w-full bg-muted rounded-md overflow-hidden relative">
                                            <iframe
                                                src={profile.cv_url}
                                                className="w-full h-full"
                                                title="CV Preview"
                                            />
                                        </div>
                                        <div className="mt-4 flex justify-end">
                                            <Button asChild variant="outline" size="sm">
                                                <a href={profile.cv_url} target="_blank" rel="noreferrer">
                                                    Open in New Tab <ExternalLink className="ml-2 w-4 h-4" />
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>

                    {/* Bio */}
                    {profile.bio && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">About</h4>
                            <p className="text-sm leading-relaxed text-foreground/80 bg-secondary/5 p-4 rounded-lg border border-secondary/20">
                                {profile.bio}
                            </p>
                        </div>
                    )}

                    {/* Skills */}
                    {profile.skills && profile.skills.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Skills</h4>
                            <div className="flex flex-wrap gap-2">
                                {profile.skills.map(skill => (
                                    <Badge key={skill} variant="secondary" className="px-2.5 py-0.5 text-xs font-normal bg-secondary/20 hover:bg-secondary/30 text-foreground transition-colors border-0">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 mt-10 w-full max-w-md">
                <Button asChild size="lg" className="w-full shadow-lg hover:shadow-xl transition-all">
                    <Link href="/jobs">
                        <Building2 className="mr-2 w-4 h-4" /> Search Jobs
                    </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full">
                    <Link href="/profile/applications">
                        <FileText className="mr-2 w-4 h-4" /> My Applications
                    </Link>
                </Button>
            </div>
        </div>
    )
}
