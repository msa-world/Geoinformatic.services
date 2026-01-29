"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, Search, UserPlus, FileText, Send, Building, Briefcase, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

export default function JobGuidePage() {
    const [activeTab, setActiveTab] = useState<'candidate' | 'employer'>('candidate')

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link
                        href="/jobs"
                        className="flex items-center gap-2 text-muted-foreground hover:text-[#D97D25] transition-colors font-medium"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Jobs
                    </Link>
                    <div className="text-sm font-semibold text-gray-900">
                        Recruitment Guide
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h1>
                    <p className="text-xl text-muted-foreground">
                        Complete guide for finding dream jobs and hiring top talent in Geoinformatics
                    </p>
                </div>

                {/* Toggle Switch */}
                <div className="flex justify-center mb-16">
                    <div className="bg-white p-1.5 rounded-full border shadow-sm inline-flex">
                        <button
                            onClick={() => setActiveTab('candidate')}
                            className={`px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 ${activeTab === 'candidate'
                                    ? 'bg-[#D97D25] text-white shadow-md'
                                    : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            For Candidates
                        </button>
                        <button
                            onClick={() => setActiveTab('employer')}
                            className={`px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 ${activeTab === 'employer'
                                    ? 'bg-[#D97D25] text-white shadow-md'
                                    : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            For Employers
                        </button>
                    </div>
                </div>

                <motion.div
                    key={activeTab}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-12"
                >
                    {activeTab === 'candidate' ? (
                        <>
                            <Section
                                number="01"
                                title="Create Your Profile"
                                description="Sign up and complete your profile highlighting your GIS skills, experience, and education."
                                icon={UserPlus}
                            />
                            <Section
                                number="02"
                                title="Browse & Filter Jobs"
                                description="Use our advanced filters to find jobs by location, role type, salary range, and specific GIS keyword."
                                icon={Search}
                            />
                            <Section
                                number="03"
                                title="Review Job Details"
                                description="Click on any job card to view full details. Check 'Urgently Hiring' tags for immediate openings."
                                icon={FileText}
                            />
                            <Section
                                number="04"
                                title="Apply Easily"
                                description="Click 'Apply Now' to submit your application. Some jobs may redirect you to the company's official site."
                                icon={Send}
                            />
                        </>
                    ) : (
                        <>
                            <Section
                                number="01"
                                title="Register as Employer"
                                description="Create a company account to unlock posting features and dashboard access."
                                icon={Building}
                            />
                            <Section
                                number="02"
                                title="Post a Job"
                                description="Click 'Post a Job' and fill in the details. Use rich text for descriptions and set 'Urgently Hiring' if needed."
                                icon={Briefcase}
                            />
                            <Section
                                number="03"
                                title="Manage Applications"
                                description="Track all incoming applications in your dashboard. View CVs and change candidate statuses."
                                icon={FileText}
                            />
                            <Section
                                number="04"
                                title="Hire the Best"
                                description="Connect with top geoinformatics talent and grow your team efficiently."
                                icon={CheckCircle}
                            />
                        </>
                    )}
                </motion.div>

                <div className="mt-20 p-8 bg-blue-50 border border-blue-100 rounded-2xl text-center">
                    <h3 className="text-xl font-bold text-blue-900 mb-2">Still have questions?</h3>
                    <p className="text-blue-700 mb-6">Our support team is here to help you navigate your career journey.</p>
                    <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8">
                        <Link href="/contact">Contact Support</Link>
                    </Button>
                </div>
            </main>
        </div>
    )
}

function Section({ number, title, description, icon: Icon }: { number: string, title: string, description: string, icon: any }) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
            }}
            className="flex gap-6 md:gap-10 items-start md:items-center bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
        >
            <div className="hidden md:flex flex-col items-center gap-2">
                <span className="text-5xl font-black text-gray-100">{number}</span>
                <div className="w-px h-12 bg-gray-100"></div>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-[#D97D25]/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-8 h-8 text-[#D97D25]" />
            </div>

            <div className="flex-1">
                <div className="flex items-baseline gap-3 mb-2">
                    <span className="md:hidden text-lg font-bold text-[#D97D25] opacity-50">#{number}</span>
                    <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
                </div>
                <p className="text-lg text-gray-600 leading-relaxed">{description}</p>
            </div>
        </motion.div>
    )
}
