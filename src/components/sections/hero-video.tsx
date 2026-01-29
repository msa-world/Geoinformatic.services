"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import dynamic from "next/dynamic"

// Dynamically import DottedMap to avoid SSR issues with Three.js
const DottedMap = dynamic(() => import("@/components/ui/dotted-map"), {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-black" />
})

const slides = [
    {
        title: "Geoinformatic Services",
        description:
            "At Geoinformatic Services, we specialize in providing high-quality Geographic Information System (GIS) solutions tailored to meet the evolving needs of modern times.",
    },
    {
        title: "Your Fastest Route To Precise Mapping",
        description:
            "Our team of experts delivers precision-driven geospatial solutions that empower businesses and governments to make informed evidence-based decisions.",
    },
    {
        title: "Advanced Technology & Innovation",
        description:
            "We leverage cutting-edge technology including AI, drone surveys, and satellite imagery to provide comprehensive mapping and analysis services.",
    },
]

export default function HeroVideo() {
    const [currentSlide, setCurrentSlide] = useState(0)
    const [isAutoPlaying, setIsAutoPlaying] = useState(true)

    useEffect(() => {
        if (!isAutoPlaying) return

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length)
        }, 6000)

        return () => clearInterval(interval)
    }, [isAutoPlaying])

    const goToSlide = (index: number) => {
        setCurrentSlide(index)
        setIsAutoPlaying(false)
        setTimeout(() => setIsAutoPlaying(true), 10000)
    }

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
        setIsAutoPlaying(false)
        setTimeout(() => setIsAutoPlaying(true), 10000)
    }

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length)
        setIsAutoPlaying(false)
        setTimeout(() => setIsAutoPlaying(true), 10000)
    }

    return (
        <section className="relative h-screen min-h-[500px] md:min-h-[600px] overflow-hidden bg-gradient-to-b from-[#023e8a] to-[#001529]">
            {/* Particle World Map Background */}
            <DottedMap />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60 z-[1] pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 flex h-full items-center justify-center pointer-events-none">
                <div className="container mx-auto px-4 md:px-6 text-center mt-16 md:mt-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentSlide}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            className="max-w-4xl mx-auto touch-pan-y" // touch-pan-y allows vertical scroll while dragging
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={1}
                            onDragEnd={(e, { offset, velocity }) => {
                                const swipe = offset.x; // Drag distance
                                const threshold = 50; // Min distance to trigger slide change

                                if (swipe < -threshold) {
                                    nextSlide(); // Swipe Left -> Next
                                } else if (swipe > threshold) {
                                    prevSlide(); // Swipe Right -> Prev
                                }
                            }}
                        >
                            <motion.h1
                                className="mb-4 md:mb-6 text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight px-2 leading-tight"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.6 }}
                            >
                                {slides[currentSlide].title.split(" ").map((word, i) =>
                                    word === "Geoinformatic" ? (
                                        <span
                                            key={i}
                                            className="text-transparent bg-clip-text bg-gradient-to-r from-[#C7A24D] to-[#D97D25]"
                                        >
                                            {word}{" "}
                                        </span>
                                    ) : (
                                        <span key={i}>{word} </span>
                                    )
                                )}
                            </motion.h1>
                            <motion.p
                                className="mb-8 text-base sm:text-xl text-gray-200 md:text-2xl max-w-3xl mx-auto leading-relaxed px-4"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.6 }}
                            >
                                {slides[currentSlide].description}
                            </motion.p>
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6, duration: 0.6 }}
                                className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full px-4"
                            >
                                <a
                                    href="/contact"
                                    className="pointer-events-auto w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-[#C7A24D] to-[#D97D25] text-white font-semibold rounded-full hover:shadow-lg hover:shadow-orange-500/30 transition-all hover:scale-105 text-sm sm:text-lg"
                                >
                                    Get Started
                                </a>
                                <a
                                    href="/projects"
                                    className="pointer-events-auto w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 border-2 border-white/30 text-white font-semibold rounded-full hover:bg-white/10 transition-all text-sm sm:text-lg"
                                >
                                    View Projects
                                </a>
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Navigation Arrows */}
            <button
                onClick={prevSlide}
                className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all border border-white/20"
                aria-label="Previous slide"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
            <button
                onClick={nextSlide}
                className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all border border-white/20"
                aria-label="Next slide"
            >
                <ChevronRight className="w-6 h-6" />
            </button>

            {/* Slide Indicators */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-3">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`w-3 h-3 rounded-full transition-all ${index === currentSlide
                            ? "bg-gradient-to-r from-[#C7A24D] to-[#D97D25] scale-125"
                            : "bg-white/40 hover:bg-white/60"
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>

            {/* Scroll Indicator */}
            <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10"
            >
                <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center p-1">
                    <div className="w-1.5 h-3 bg-white/60 rounded-full"></div>
                </div>
            </motion.div>
        </section>
    )
}
