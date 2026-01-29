"use client"

import { useRef } from "react"
import { motion, useInView, Variants } from "framer-motion"
import { MapPin, Target, Award, Users } from "lucide-react"
import Image from "next/image"

const stats = [
  { icon: MapPin, value: "10+", label: "Projects Delivered" },
  { icon: Target, value: "98%", label: "Client Satisfaction" },
  { icon: Award, value: "5+", label: "Years Experience" },
  { icon: Users, value: "50+", label: "Team Members" },
]

const paragraphVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
}

const statsVariants: Variants = {
  hidden: (index: number) => ({
    opacity: 0,
    x: index % 2 === 0 ? -50 : 50,
    y: 20
  }),
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    y: 0,
    transition: { duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }
  })
}

const iconVariants: Variants = {
  hidden: (index: number) => ({
    scale: 0,
    opacity: 0,
    rotate: -180
  }),
  visible: (index: number) => ({
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: { duration: 0.5, delay: index * 0.1 + 0.2, type: "spring", stiffness: 200, damping: 15 }
  })
}

export default function WelcomeIntro() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="relative py-16 sm:py-24 lg:py-32 bg-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              variants={paragraphVariants}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">About Us</span>
            </motion.div>

            {/* Heading (reduced size) */}
            <motion.h2
              variants={paragraphVariants}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-bold text-gray-900 leading-tight"
              style={{
                background: "linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 50%, #1a1a1a 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
              }}
            >
              Geoinformatic Services
            </motion.h2>

            {/* Description */}
            <motion.p
              variants={paragraphVariants}
              className="text-lg text-gray-600 leading-relaxed hover:text-gray-800 transition-colors duration-300"
            >
              At <strong className="text-primary">GEOINFORMATIC Services</strong>, we specialize in providing
              high-quality Geographic Information System (GIS) solutions tailored to meet the evolving needs of modern
              industries.
            </motion.p>

            <motion.p
              variants={paragraphVariants}
              className="text-lg text-gray-600 leading-relaxed"
            >
              Our team of experienced GIS professionals, analysts, and engineers are dedicated to delivering reliable,
              cost-effective, and innovative geospatial solutions that drive real-world impact.
            </motion.p>

            {/* Stats Grid removed as requested */}
          </motion.div>

          {/* Right Image */}
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={isInView ? { opacity: 1, x: 0, scale: 1 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="/extra-images/project.jpeg"
                alt="GIS Team at Work"
                fill
                className="object-cover hover:scale-105 transition-transform duration-700"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </div>

            {/* Floating Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-6 border border-gray-100"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-[#C7A24D] to-[#D97D25] flex items-center justify-center">
                  <Award className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">5+</div>
                  <div className="text-sm text-gray-500">Years of Excellence</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
