"use client"

import React, { useState, useRef } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { motion } from "framer-motion"

const testimonialsData = [
    {
        name: "LIMS",
        title: "Land Information Management System",
        quote:
            "The digitization of land records was a massive undertaking. Geoinformatic Services provided the technical expertise, accuracy, and innovative solutions we needed to modernize our land management infrastructure.",
        image: "/company-grid/lims.jpg",
    },
    {
        name: "Survey Of Pakistan",
        title: "National Surveying Agency",
        quote:
            "GEOINFORMATIC precise analysis verified our benchmarks and helped refine our topographic models. Their adherence to national standards and technical rigor is commendable.",
        image: "/testterminols/survey of pakistan.png",
    },
    {
        name: "Asian Consulting Engineers",
        title: "Infrastructure Consultants",
        quote:
            "Transforming complex BIM and CAD utility data into a GIS driven solution was seamless with their help. Their precise spatial analysis has significantly enhanced our infrastructure planning capabilities.",
        image: "/company-grid/asian.png",
    },
]

const TestimonialCard = ({ testimonial }: { testimonial: (typeof testimonialsData)[0] }) => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [isHovered, setIsHovered] = useState(false)
    const cardRef = useRef<HTMLDivElement>(null)

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return
        const rect = cardRef.current.getBoundingClientRect()
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        })
    }

    return (
        <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative h-[400px] sm:h-[500px] md:h-[600px] w-full overflow-hidden rounded-2xl sm:rounded-3xl group cursor-pointer shadow-2xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Background Image with Zoom Effect */}
            <div className="absolute inset-0 bg-white">
                <div className="absolute inset-0 flex items-center justify-center p-10">
                    <div className="relative w-full h-full max-w-[80%] max-h-[80%]">
                        <Image
                            src={testimonial.image || "/placeholder.svg"}
                            alt={`Testimonial from ${testimonial.name}`}
                            fill
                            className="object-contain transition-transform duration-1000 ease-out group-hover:scale-110"
                        />
                    </div>
                </div>
                {/* Dark Gradient Overlay for Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-90" />
            </div>

            {/* Spotlight Effect */}
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                    background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(0,0,0,0.1), transparent 40%)`,
                }}
            />

                    {/* Content Container */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 md:p-12">
                {/* Glassmorphism Card for Text */}
                <motion.div
                    className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-6 sm:p-8"
                    animate={{
                        y: isHovered ? 0 : 10,
                        backgroundColor: isHovered ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.1)",
                        backdropFilter: isHovered ? "blur(12px)" : "blur(0px)",
                    }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                >
                    {/* Shine Effect on Glass Card */}
                    <div
                        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        style={{
                            background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y - (cardRef.current?.getBoundingClientRect().height || 0) + 200}px, rgba(255,255,255,0.2), transparent 40%)`,
                        }}
                    />

                    <Quote className="mb-4 sm:mb-6 h-8 w-8 sm:h-10 sm:w-10 text-[#D97D25]" />

                    <p className="mb-6 sm:mb-8 text-lg sm:text-xl leading-relaxed text-white font-normal">
                        "{testimonial.quote}"
                    </p>

                    <div className="flex items-center gap-4 border-t border-white/10 pt-4 sm:pt-6">
                        <div>
                            <h3 className="text-xl sm:text-2xl font-bold text-white">
                                <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                    {testimonial.name}
                                </span>
                            </h3>
                            <p className="text-sm sm:text-base font-medium text-[#D97D25]">{testimonial.title}</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    )
}

export default function TestimonialsCarousel() {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000, stopOnInteraction: false })])

    const scrollPrev = React.useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev()
    }, [emblaApi])

    const scrollNext = React.useCallback(() => {
        if (emblaApi) emblaApi.scrollNext()
    }, [emblaApi])

    return (
        <section className="relative overflow-hidden bg-white py-16 sm:py-24 md:py-32">
            {/* Background Pattern */}
            <div
                className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40"
                aria-hidden="true"
            />

            <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 md:px-20">
                <div className="grid grid-cols-1 gap-8 sm:gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
                    {/* Left Side: Heading & Text */}
                    <div className="flex flex-col justify-center text-center lg:text-left">
                        <h2 className="text-3xl sm:text-4xl font-normal tracking-tight text-gray-900 md:text-6xl leading-tight mb-4 sm:mb-6 uppercase">
                            What Our Clients
                            <br />
                            <span className="bg-gradient-to-r from-[#D97D25] to-[#b56010] bg-clip-text text-transparent font-bold">
                                Say About Us
                            </span>
                        </h2>
                        <p className="text-base sm:text-lg leading-7 sm:leading-8 text-gray-600 max-w-lg mb-6 sm:mb-8 mx-auto lg:mx-0">
                            Hear from those who have mapped success with us. Our clients trust us to deliver precise, actionable
                            geospatial solutions that drive real-world impact.
                        </p>

                        {/* Decorative Element */}
                        <div className="h-1 w-20 bg-[#D97D25] rounded-full mx-auto lg:mx-0" />
                    </div>

                    {/* Right Side: Carousel */}
                    <div className="relative">
                        <div className="overflow-hidden rounded-3xl shadow-2xl" ref={emblaRef}>
                            <div className="flex">
                                {testimonialsData.map((testimonial, index) => (
                                    <div className="min-w-0 flex-[0_0_100%]" key={index}>
                                        <TestimonialCard testimonial={testimonial} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Navigation Arrows - Vertically Centered */}
                        <button
                            onClick={scrollPrev}
                            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/10 p-3 text-white backdrop-blur-md transition-all hover:bg-[#D97D25] hover:text-white border border-white/20 shadow-lg"
                            aria-label="Previous testimonial"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                        <button
                            onClick={scrollNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/10 p-3 text-white backdrop-blur-md transition-all hover:bg-[#D97D25] hover:text-white border border-white/20 shadow-lg"
                            aria-label="Next testimonial"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    )
}
