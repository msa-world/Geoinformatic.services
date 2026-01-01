"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import HeaderNavigation from "@/components/sections/header-navigation";
import Footer from "@/components/sections/footer";
import { ArrowRight, CheckCircle2, Layers, Map as MapIcon, Globe, BarChart3 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Feature {
    title: string;
    description: string;
    icon?: React.ElementType;
}

interface ServicePageLayoutProps {
    title: string;
    subtitle: string;
    heroImage: string;
    overviewTitle: string;
    overviewContent: React.ReactNode; // Can be text or paragraphs
    features: Feature[];
    benefits: string[];
    ctaTitle?: string;
    ctaDescription?: string;
    children?: React.ReactNode;
}

export default function ServicePageLayout({
    title,
    subtitle,
    heroImage,
    overviewTitle,
    overviewContent,
    features,
    benefits,
    ctaTitle = "Ready to start your project?",
    ctaDescription = "Contact our team of experts to discuss your specific requirements.",
    children
}: ServicePageLayoutProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    const yHero = useTransform(scrollYProgress, [0, 0.2], [0, 150]);
    const opacityHero = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
    const scaleHero = useTransform(scrollYProgress, [0, 0.2], [1, 1.1]);

    return (
        <div ref={containerRef} className="min-h-screen w-full bg-white selection:bg-primary/30">
            <HeaderNavigation />

            <main className="w-full overflow-hidden">
                {/* Hero Section */}
                <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden bg-black">
                    <motion.div
                        style={{ y: yHero, scale: scaleHero, opacity: opacityHero }}
                        className="absolute inset-0 z-0"
                    >
                        <Image
                            src={heroImage}
                            alt={title}
                            fill
                            className="object-cover opacity-60"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />
                    </motion.div>

                    <div className="container relative z-10 px-4 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        >
                            <div className="inline-block mb-4 px-6 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md">
                                <span className="text-white/90 text-sm font-medium tracking-wider uppercase">Professional Service</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                                {title}
                            </h1>
                            <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed font-light">
                                {subtitle}
                            </p>
                        </motion.div>
                    </div>

                    {/* Scroll Indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, y: [0, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
                    >
                        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center p-1">
                            <div className="w-1.5 h-3 bg-white/60 rounded-full"></div>
                        </div>
                    </motion.div>
                </section>

                {/* Overview Section */}
                <section className="py-24 bg-white relative">
                    <div className="container mx-auto px-4">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                            >
                                <h2 className="text-4xl font-bold text-gray-900 mb-8 border-l-4 border-primary pl-6">
                                    {overviewTitle}
                                </h2>
                                <div className="text-lg text-gray-600 space-y-6 leading-relaxed">
                                    {overviewContent}
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-2xl transform translate-x-4 translate-y-4"></div>
                                <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                                    <Image src={heroImage} alt="Overview" fill className="object-cover" />
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-24 bg-gray-50 relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] bg-[url('/grid-pattern.png')]"></div>

                    <div className="container mx-auto px-4 relative z-10">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Core Capabilities</h2>
                            <div className="w-20 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full"></div>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {features.map((feature, index) => {
                                const Icon = feature.icon || Layers;
                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                        className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1 group"
                                    >
                                        <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                                            <Icon className="w-7 h-7 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                        <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Custom Content Slot */}
                {children}

                {/* Benefits / Why Choose Us */}
                <section className="py-24 bg-white">
                    <div className="container mx-auto px-4">
                        <div className="bg-[#111] rounded-3xl p-8 md:p-16 relative overflow-hidden text-white">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>

                            <div className="grid lg:grid-cols-2 gap-12 relative z-10 items-center">
                                <div>
                                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Why Choose Our Services?</h2>
                                    <p className="text-gray-400 text-lg mb-8">We deliver precision, reliability, and actionable insights through our advanced geospatial solutions.</p>
                                    <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors">
                                        Get Started <ArrowRight size={18} />
                                    </Link>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-6">
                                    {benefits.map((benefit, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                                            <span className="text-lg text-gray-200">{benefit}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-20 bg-gradient-to-b from-white to-gray-50 text-center">
                    <div className="container mx-auto px-4">
                        <h2 className="text-4xl font-bold text-gray-900 mb-6">{ctaTitle}</h2>
                        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">{ctaDescription}</p>
                        <div className="flex justify-center gap-4">
                            <Link href="/contact" className="px-10 py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                                Contact Us Now
                            </Link>
                            <Link href="/projects" className="px-10 py-4 bg-white text-gray-900 border border-gray-200 font-bold rounded-full hover:bg-gray-50 transition-all">
                                View Portfolio
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
