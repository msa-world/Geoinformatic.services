"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronRight } from "lucide-react"
import { servicesData, ServiceCategory } from "@/data/services-data"

export default function ServiceDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [service, setService] = useState<ServiceCategory | null>(null)

    // Parallax Hero Ops
    const { scrollY } = useScroll()
    const yRange = useTransform(scrollY, [0, 500], [0, 200])
    const opacityRange = useTransform(scrollY, [0, 400], [1, 0])

    // Find service
    useEffect(() => {
        if (params.id) {
            const found = servicesData.find(s => s.id === params.id)
            if (found) setService(found)
            else router.push("/")
        }
    }, [params.id, router])

    if (!service) return null

    // Nav Logic
    const currentIndex = servicesData.findIndex(s => s.id === service.id)
    const nextService = servicesData[(currentIndex + 1) % servicesData.length]
    const prevService = servicesData[(currentIndex - 1 + servicesData.length) % servicesData.length]

    // Animation Variants
    const containerVars = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3
            }
        }
    }

    const itemVars = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
    }

    return (
        <main className="bg-slate-50 min-h-screen relative overflow-hidden">

            {/* Animated Background Blobs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    animate={{
                        x: [0, 100, 0],
                        y: [0, -50, 0],
                        scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] opacity-70"
                />
                <motion.div
                    animate={{
                        x: [0, -100, 0],
                        y: [0, 50, 0],
                        scale: [1, 1.3, 1]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 2 }}
                    className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[100px] opacity-70"
                />
            </div>

            {/* HERO SECTION */}
            <section className="relative h-[85vh] w-full overflow-hidden flex items-end shadow-2xl">
                <motion.div style={{ y: yRange }} className="absolute inset-0 w-full h-full">
                    <Image
                        src={service.imageUrl || "/placeholder.jpg"}
                        alt={service.title}
                        fill
                        priority
                        className="object-cover"
                    />
                </motion.div>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute inset-0 bg-black/20" /> {/* Dimmer */}

                <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 w-full mb-24">
                    <motion.div style={{ opacity: opacityRange }}>
                        <Link href="/#services" className="inline-flex items-center text-white/90 hover:text-white mb-8 transition-all group px-4 py-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/10">
                            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                            Back to All Services
                        </Link>

                        <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter mb-6 drop-shadow-lg relative">
                            <motion.span
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, ease: "backOut" }}
                                className="block"
                            >
                                {service.title}
                            </motion.span>
                        </h1>

                        <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "120px" }}
                            transition={{ delay: 0.6, duration: 1 }}
                            className="h-2 bg-gradient-to-r from-primary to-secondary rounded-full"
                        />
                    </motion.div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 flex flex-col items-center gap-2 animate-bounce"
                >
                    <span className="text-xs tracking-widest uppercase">Scroll to Explore</span>
                    <div className="w-px h-12 bg-gradient-to-b from-white to-transparent" />
                </motion.div>
            </section>

            {/* CONTENT SECTION */}
            <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 -mt-32 pb-32">
                {/* Summary Card */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-16 shadow-2xl shadow-black/5 border border-white/40 mb-20"
                >
                    <p className="text-2xl md:text-3xl text-gray-700 leading-relaxed font-medium md:max-w-4xl mx-auto text-center">
                        <span className="text-primary text-4xl mr-2">❝</span>
                        {service.shortDescription}
                    </p>
                </motion.div>

                {/* Sub-Services Grid */}
                <motion.div
                    variants={containerVars}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12"
                >
                    {service.subCategories.map((sub, idx) => (
                        <motion.div
                            key={idx}
                            variants={itemVars}
                            className="group relative bg-white rounded-3xl p-8 md:p-10 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 border border-gray-100 overflow-hidden"
                        >
                            {/* Hover Gradient Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-8">
                                    <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-700 text-white text-xl font-bold shadow-lg shadow-gray-900/20 group-hover:scale-110 transition-transform duration-500">
                                        {idx + 1}
                                    </span>
                                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                                        {sub.title}
                                    </h3>
                                </div>

                                <ul className="space-y-4 pl-2">
                                    {sub.items?.map((item, i) => (
                                        <li key={i} className="flex items-start gap-4 text-gray-600 group-hover:text-gray-800 transition-colors py-1">
                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-secondary ring-4 ring-secondary/20 group-hover:bg-primary group-hover:ring-primary/20 transition-all font-bold" />
                                            <span className="text-lg leading-relaxed">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            {/* FOOTER NAVIGATION */}
            <section className="border-t border-gray-200 bg-white">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                        {/* PREV */}
                        <Link href={`/services/${prevService.id}`} className="group relative block p-12 md:p-24 hover:bg-gray-50 transition-colors text-left">
                            <span className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 group-hover:text-primary transition-colors">Previous Service</span>
                            <div className="text-3xl md:text-5xl font-black text-gray-900 flex items-center gap-4">
                                <ArrowLeft className="w-8 h-8 md:w-12 md:h-12 text-gray-300 group-hover:-translate-x-4 transition-transform duration-300" />
                                {prevService.title}
                            </div>
                        </Link>

                        {/* NEXT */}
                        <Link href={`/services/${nextService.id}`} className="group relative block p-12 md:p-24 hover:bg-gray-50 transition-colors text-right">
                            <span className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 group-hover:text-primary transition-colors">Next Service</span>
                            <div className="text-3xl md:text-5xl font-black text-gray-900 flex items-center justify-end gap-4">
                                {nextService.title}
                                <ArrowRight className="w-8 h-8 md:w-12 md:h-12 text-gray-300 group-hover:translate-x-4 transition-transform duration-300" />
                            </div>
                        </Link>
                    </div>
                </div>
            </section>

        </main>
    )
}
