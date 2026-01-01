"use client"

import Image from "next/image"
import { useRef, useEffect, useState } from "react"
import { Check } from "lucide-react"
import {
    motion,
    useInView,
    useScroll,
    useTransform,
    useSpring,
    useMotionValue,
    useVelocity,
    useMotionTemplate
} from "framer-motion"

// Advanced Counter with Motion Blur
const MotionBlurCounter = ({ value, duration = 2.5 }) => {
    const ref = useRef(null)
    const motionValue = useMotionValue(0)
    const springValue = useSpring(motionValue, {
        damping: 40,
        stiffness: 80,
        mass: 1.5
    })
    const isInView = useInView(ref, { once: true, margin: "-50px" })

    const velocity = useVelocity(springValue)
    const blurValue = useTransform(velocity, [-1000, 0, 1000], [8, 0, 8])
    const opacityValue = useTransform(velocity, [-1000, 0, 1000], [0.7, 1, 0.7])

    useEffect(() => {
        if (isInView) {
            motionValue.set(value)
        }
    }, [isInView, value, motionValue])

    useEffect(() => {
        return springValue.on("change", (latest) => {
            if (ref.current) {
                ref.current.textContent = Intl.NumberFormat('en-US').format(Math.floor(latest))
            }
        })
    }, [springValue])

    return (
        <motion.span
            ref={ref}
            style={{
                filter: useTransform(blurValue, (v) => `blur(${v}px)`),
                opacity: opacityValue,
                display: "inline-block",
                willChange: "transform, filter"
            }}
        />
    )
}

// New Component: Glassy Oval Button with Gold Edges and Silver Spotlight
const GoldGlassyCard = ({ children, index }) => {
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    function handleMouseMove({ currentTarget, clientX, clientY }) {
        const { left, top } = currentTarget.getBoundingClientRect()
        mouseX.set(clientX - left)
        mouseY.set(clientY - top)
    }

    return (
        <motion.li
            initial={{ x: -50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{
                type: "spring",
                stiffness: 100,
                damping: 12,
                delay: index * 0.1
            }}
            onMouseMove={handleMouseMove}
            className="group relative flex items-center p-1 rounded-full overflow-hidden"
        >
            {/* Gold Border Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] opacity-50 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />

            {/* Inner Content Container */}
            <div className="relative flex items-center w-full h-full bg-white/90 backdrop-blur-xl rounded-full p-3 md:p-4 border border-white/20 z-10">

                {/* Silver Spotlight Effect */}
                <motion.div
                    className="pointer-events-none absolute -inset-px rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                        background: useMotionTemplate`
                            radial-gradient(
                                250px circle at ${mouseX}px ${mouseY}px,
                                rgba(192, 192, 192, 0.4),
                                transparent 80%
                            )
                        `,
                    }}
                />

                {children}
            </div>
        </motion.li>
    )
}

const ProfessionalApproach = () => {
    const sectionRef = useRef(null)
    const titleRef = useRef(null)
    const isInView = useInView(sectionRef, { once: true, amount: 0.2 })
    const isTitleInView = useInView(titleRef, { once: true, amount: 0.5 })

    // Parallax effects
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"],
    })

    const yBackground = useTransform(scrollYProgress, [0, 1], [0, -100])

    const listItems = [
        { value: 10, suffix: "+", text: "projects" },
        { value: 5, suffix: "+", text: "years of commercial experience" },
        { value: 15, suffix: "+", text: "satisfied customers" },
        { value: 5000, suffix: "+", text: "km² worked out and analyzed" },
    ]

    return (
        <section
            ref={sectionRef}
            className="relative overflow-hidden bg-white py-16 md:py-24 lg:py-32"
        >
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    style={{ y: yBackground }}
                    className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] opacity-60"
                />
                <motion.div
                    style={{ y: useTransform(scrollYProgress, [0, 1], [0, -50]) }}
                    className="absolute top-[40%] -left-[10%] w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[80px] opacity-60"
                />

                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            </div>

            <div className="container relative z-10 px-4 md:px-6">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">

                    {/* Left Column: Content */}
                    <div className="w-full lg:w-1/2">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        >
                            <motion.h2
                                ref={titleRef}
                                className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-6"
                                initial={{ backgroundPosition: "100% 0" }}
                                animate={isTitleInView ? { backgroundPosition: "0% 0" } : { backgroundPosition: "100% 0" }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                style={{
                                    background: "linear-gradient(to right, #111827 0%, #111827 50%, #9CA3AF 50%, #E5E7EB 100%)",
                                    backgroundSize: "200% 100%",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundClip: "text",
                                }}
                            >
                                Looking For Professional Approach And Quality Services?
                            </motion.h2>

                            <motion.p
                                className="text-base md:text-lg text-gray-600 mb-8 leading-relaxed max-w-xl"
                                initial={{ opacity: 0, x: -20 }}
                                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                            >
                                Our experts are ready to guide you in finding the perfect GIS solutions for your needs.
                                We combine technical expertise with creative problem-solving to deliver exceptional results.
                            </motion.p>

                            <ul className="space-y-4 md:space-y-5">
                                {listItems.map((item, index) => (
                                    <GoldGlassyCard key={index} index={index}>
                                        <div className="flex-shrink-0 mr-4 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 text-primary group-hover:scale-110 transition-transform duration-300">
                                            <Check className="h-5 w-5 md:h-6 md:w-6" />
                                        </div>
                                        <span className="text-base md:text-lg font-medium text-gray-800 group-hover:text-primary transition-colors duration-300 flex items-center gap-2">
                                            <span className="font-bold tabular-nums text-xl md:text-2xl min-w-[3ch]">
                                                <MotionBlurCounter value={item.value} />
                                                {item.suffix}
                                            </span>
                                            <span className="text-sm md:text-base text-gray-600 group-hover:text-gray-900 transition-colors">{item.text}</span>
                                        </span>
                                    </GoldGlassyCard>
                                ))}
                            </ul>
                        </motion.div>
                    </div>

                    {/* Right Column: Image */}
                    <div className="w-full lg:w-1/2 relative">
                        <div className="relative z-10">
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white group">
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent z-10 mix-blend-overlay pointer-events-none transition-opacity duration-700 opacity-0 group-hover:opacity-100" />
                                <Image
                                    src="/extra-images/mockup.png"
                                    alt="Professional GIS Services"
                                    width={800}
                                    height={600}
                                    className="w-full h-auto object-cover"
                                />
                            </div>

                            {/* Floating Decorative Elements - Static */}
                            <div className="absolute -bottom-10 -left-10 z-20 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 hidden md:block">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                                    <span className="font-semibold text-gray-800">100% Success Rate</span>
                                </div>
                            </div>

                            <div className="absolute -top-10 -right-10 z-20 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 hidden md:block">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                        <MotionBlurCounter value={15} />+
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-500">Happy</span>
                                        <span className="font-bold text-gray-800">Customers</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Background Blob behind image */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-3xl -z-10" />
                    </div>
                </div>
            </div>
        </section>
    )
}

export default ProfessionalApproach
