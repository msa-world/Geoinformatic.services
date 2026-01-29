"use client"

import HeaderNavigation from "@/components/sections/header-navigation";
import Footer from "@/components/sections/footer";
import Image from "next/image";
import { Target, Users, Award, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";
import { useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const stats = [
    { icon: Award, label: "Years of Experience", value: "5+" },
    { icon: Users, label: "Projects Completed", value: "10+" },
    { icon: TrendingUp, label: "Satisfied Customers", value: "15+" },
    { icon: Target, label: "Area Analyzed", value: "5000+ km²" },
];

const values = [
    {
        title: "Technical Excellence",
        description: "We leverage cutting-edge GIS technologies and methodologies to deliver precise, reliable geospatial solutions that meet the highest industry standards.",
        icon: Award
    },
    {
        title: "Client-Focused Approach",
        description: "Your success is our priority. We work closely with clients to understand their unique challenges and deliver tailored solutions that exceed expectations.",
        icon: Users
    },
    {
        title: "Innovation & Expertise",
        description: "Our team combines deep technical expertise with innovative thinking to solve complex geospatial challenges and unlock new possibilities.",
        icon: TrendingUp
    },
    {
        title: "Quality & Precision",
        description: "We maintain rigorous quality control standards throughout every project, ensuring accuracy, reliability, and actionable insights.",
        icon: Target
    },
];

import ParticleGlobe from "@/components/ui/particle-globe";

export default function AboutPage() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const yHero = useTransform(scrollYProgress, [0, 0.2], [0, 100]);
    const opacityHero = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

    return (
        <div ref={containerRef} className="min-h-screen w-full bg-white selection:bg-primary/30">
            <HeaderNavigation />

            <main className="w-full overflow-hidden">
                {/* Hero Section with Video Background */}
                <section className="relative h-screen min-h-[800px] flex items-center justify-center overflow-hidden bg-black">
                    {/* Particle Globe Layer */}
                    <div className="absolute inset-0 w-full h-full z-0">
                        <ParticleGlobe variant="map" />
                        <div className="absolute inset-0 bg-black/50 pointer-events-none z-10"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none z-10"></div>
                    </div>

                    <motion.div
                        style={{ y: yHero, opacity: opacityHero }}
                        className="container relative z-20 mx-auto px-4 text-center pointer-events-none"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="max-w-4xl mx-auto"
                        >
                            <div className="inline-block mb-4 px-6 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md">
                                <span className="text-white/90 text-sm font-medium tracking-wider uppercase">Pioneering Geospatial Intelligence</span>
                            </div>
                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 tracking-tight leading-tight">
                                About <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C7A24D] to-[#D97D25]">geo-informatic</span>
                            </h1>
                            <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-3xl mx-auto leading-relaxed font-light">
                                Leading provider of innovative GIS solutions, transforming spatial data into strategic insights for a better world.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                                <motion.a
                                    href="#overview"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="group relative px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full overflow-hidden transition-all duration-300"
                                >
                                    <span className="relative z-10 font-semibold text-white flex items-center gap-2">
                                        Discover More <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#C7A24D]/20 to-[#D97D25]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </motion.a>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Scroll Indicator */}
                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
                    >
                        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center p-1">
                            <div className="w-1.5 h-3 bg-white/60 rounded-full"></div>
                        </div>
                    </motion.div>
                </section>

                {/* Company Overview with Grid Background */}
                <section id="overview" className="relative py-24 lg:py-32 overflow-hidden">
                    {/* Grid Background */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10"></div>
                    </div>

                    <div className="container relative z-10 mx-auto px-4">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="w-12 h-[2px] bg-primary"></span>
                                    <span className="text-primary font-semibold uppercase tracking-widest text-sm">Who We Are</span>
                                </div>
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight">
                                    Transforming Data into <span className="text-primary">Actionable Insights</span>
                                </h2>
                                <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
                                    <p>
                                        At <strong className="text-gray-900">Geoinformatic Services</strong>, we specialize in providing high-quality Geographic Information System (GIS) solutions tailored to meet the evolving needs of modern industries.
                                    </p>
                                    <p>
                                        Our team consists of experienced GIS professionals, analysts, and engineers dedicated to delivering reliable, cost-effective, and innovative geospatial solutions. We combine technical precision with on-ground experience.
                                    </p>
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                                        {['Strategic Planning', 'Spatial Analysis', 'Remote Sensing', 'Data Visualization'].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3">
                                                <CheckCircle2 className="w-5 h-5 text-primary" />
                                                <span className="font-medium text-gray-700">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
                                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="relative"
                            >
                                {/* Mockup Image Container */}
                                <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border-8 border-white bg-white transform hover:scale-[1.02] transition-transform duration-500">
                                    <Image
                                        src="/extra-images/mockup.png"
                                        alt="GIS Analysis Interface Mockup"
                                        width={800}
                                        height={600}
                                        className="w-full h-auto object-cover"
                                    />

                                    {/* Glass Card Overlay */}
                                    <div className="absolute bottom-6 left-6 right-6 bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-xl hidden md:block">
                                        <div className="flex justify-between items-center text-white">
                                            <div>
                                                <p className="text-sm font-medium opacity-80">Accuracy Rate</p>
                                                <p className="text-2xl font-bold">99.8%</p>
                                            </div>
                                            <div className="h-8 w-[1px] bg-white/20"></div>
                                            <div>
                                                <p className="text-sm font-medium opacity-80">Data Points</p>
                                                <p className="text-2xl font-bold">5M+</p>
                                            </div>
                                            <div className="h-8 w-[1px] bg-white/20"></div>
                                            <div>
                                                <p className="text-sm font-medium opacity-80">Processing Time</p>
                                                <p className="text-2xl font-bold">-40%</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Decorative Elements */}
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#D97D25]/10 rounded-full blur-2xl -z-10"></div>
                                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#7FA89A]/10 rounded-full blur-2xl -z-10"></div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Stats Section - Floating Cards */}
                <section className="py-20 bg-gray-50 relative">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
                    <div className="container mx-auto px-4 relative z-10">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            {stats.map((stat, index) => {
                                const Icon = stat.icon;
                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1, duration: 0.6 }}
                                        className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group"
                                    >
                                        <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-transparent rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <Icon className="w-7 h-7 text-primary" />
                                        </div>
                                        <div className="text-4xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                                            {stat.value}
                                        </div>
                                        <div className="text-gray-500 font-medium text-sm uppercase tracking-wide">
                                            {stat.label}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Values Section */}
                <section className="py-24 lg:py-32 relative bg-white">
                    <div className="container mx-auto px-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-16 max-w-3xl mx-auto"
                        >
                            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Our Core Values</h2>
                            <p className="text-xl text-gray-600">The principles that guide everything we do and drive our commitment to excellence</p>
                        </motion.div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {values.map((value, index) => {
                                const Icon = value.icon;
                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1, duration: 0.6 }}
                                        className="relative group p-8 rounded-2xl bg-gray-50 hover:bg-white border border-gray-100 hover:border-primary/20 hover:shadow-2xl transition-all duration-500"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                                        <div className="relative z-10">
                                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 group-hover:bg-primary group-hover:text-white">
                                                <Icon className="w-8 h-8 text-primary group-hover:text-white transition-colors" />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                                            <p className="text-gray-600 leading-relaxed text-sm">{value.description}</p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* CTA Section - Gradient Glass */}
                <section className="py-24 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#C7A24D] to-[#D97D25]"></div>
                    <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-10"></div>

                    <div className="container mx-auto px-4 relative z-10 text-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg border border-white/20 p-12 lg:p-16 rounded-3xl"
                        >
                            <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">
                                Ready to Transform Your Spatial Data?
                            </h2>
                            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
                                Join hundreds of satisfied clients who have unlocked the power of location intelligence with our expert services.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <motion.a
                                    href="/contact"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-8 py-4 bg-white text-primary font-bold rounded-full shadow-lg hover:shadow-xl transition-all"
                                >
                                    Contact Us Now
                                </motion.a>
                                <motion.a
                                    href="/projects"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-all"
                                >
                                    View Our Projects
                                </motion.a>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
