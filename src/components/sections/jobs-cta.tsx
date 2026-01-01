"use client"

import { motion } from "framer-motion"
import { ArrowRight, Briefcase, TrendingUp, Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const features = [
    {
        icon: Briefcase,
        title: "Exciting Roles",
        description: "Find a position that matches your skills and career aspirations.",
    },
    {
        icon: TrendingUp,
        title: "Career Growth",
        description: "Join a rapidly growing team with opportunities for advancement.",
    },
    {
        icon: Users,
        title: "Expert Team",
        description: "Collaborate with industry experts in geospatial technology.",
    },
]

export default function JobsCTA() {
    return (
        <section className="py-20 lg:py-32 bg-white relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D97D25]/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#C7A24D]/5 rounded-full blur-[80px] pointer-events-none translate-y-1/2 -translate-x-1/2" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center mb-16 space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D97D25]/10 border border-[#D97D25]/20"
                    >
                        <div className="w-2 h-2 rounded-full bg-[#D97D25] animate-pulse" />
                        <span className="text-sm font-bold text-[#D97D25] uppercase tracking-wide">We Are Hiring</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight"
                    >
                        Join Our Mission to <br className="hidden md:block" /> Map the Future
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-gray-600 max-w-2xl mx-auto"
                    >
                        We are looking for passionate individuals to join our team. Explore our current openings and help us build the next generation of geospatial solutions.
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mb-16">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 + index * 0.1 }}
                            className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:border-[#D97D25]/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group text-center"
                        >
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-white border border-gray-100 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                <feature.icon className="w-8 h-8 text-[#D97D25]" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                            <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="text-center"
                >
                    <Button
                        asChild
                        className="h-16 px-10 rounded-full bg-[#D97D25] hover:bg-[#D97D25]/90 text-white font-bold text-lg shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
                    >
                        <Link href="/jobs" className="flex items-center gap-2">
                            Explore Open Positions <ArrowRight className="w-5 h-5" />
                        </Link>
                    </Button>
                </motion.div>
            </div>
        </section>
    )
}
