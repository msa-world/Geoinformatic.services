"use client"

import React, { useRef } from "react"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"
import { motion, useInView } from "framer-motion"

const CtaHelpSection = () => {
  const sectionRef = useRef(null)
  const titleRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 })
  const isTitleInView = useInView(titleRef, { once: true, amount: 0.5 })

  return (
    <section
      ref={sectionRef}
      className="relative py-28 lg:py-32 bg-no-repeat bg-center overflow-hidden"
      style={{
        backgroundImage:
          "url('https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/986c6fe2-3527-491b-b576-ae12c431a91d-GEOINFORMATIC-com/assets/images/map-13.png')",
        backgroundSize: "cover",
      }}
    >
      {/* Enhanced glass morphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/70 to-white/75 backdrop-blur-md" />

      {/* Animated shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-primary/15 to-secondary/15 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-br from-accent/15 to-primary/15 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 10,
            delay: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-secondary/10 to-accent/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 12,
            delay: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <motion.div
        className="container mx-auto px-4 text-center flex flex-col items-center relative z-10"
        initial={{ scale: 0.9, opacity: 0, rotateX: 10 }}
        animate={isInView ? { scale: 1, opacity: 1, rotateX: 0 } : { scale: 0.9, opacity: 0, rotateX: 10 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        {/* Decorative icon */}
        <motion.div
          className="mb-6 relative"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Sparkles className="w-16 h-16 text-secondary/60" />
        </motion.div>

        <motion.h2
          ref={titleRef}
          className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-[#D97D25]"
          initial={{ backgroundPosition: "100% 0" }}
          animate={isTitleInView ? { backgroundPosition: "0% 0" } : { backgroundPosition: "100% 0" }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{
            background: "linear-gradient(to right, #D97D25 0%, #D97D25 50%, #9CA3AF 50%)",
            backgroundSize: "200% 100%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          How Can We Help You?
        </motion.h2>

        <motion.p
          className="text-lg md:text-xl leading-relaxed max-w-[900px] mb-10 text-[#1A1A1A]"
          initial={{ y: 40, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: 40, opacity: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
        >
          Our experts are ready to guide you in finding the perfect GIS solutions for your needs. Let's discuss your
          project today
        </motion.p>

        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
          animate={isInView ? { scale: 1, opacity: 1, rotate: 0 } : { scale: 0.5, opacity: 0, rotate: -10 }}
          transition={{
            duration: 0.8,
            delay: 0.6,
            type: "spring",
            stiffness: 200,
            damping: 10,
          }}
        >
          <Link
            href="/contact"
            className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-[#B042C6] via-[#9c38b0] to-[#B042C6] bg-size-200 bg-pos-0 text-white font-bold text-lg py-5 px-12 rounded-xl transition-all duration-700 ease-out overflow-hidden shadow-xl hover:shadow-2xl hover:bg-pos-100"
            style={{
              backgroundSize: "200% 100%",
              backgroundPosition: "0% 0%",
            }}
          >
            {/* Glowing effect */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              style={{
                background: "radial-gradient(circle at center, rgba(176,66,198,0.6), transparent)",
                filter: "blur(20px)",
                transform: "scale(1.2)",
              }}
            />

            {/* Animated shine effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </div>

            <span className="relative z-10 transition-transform duration-500 group-hover:scale-110">Get A Quote</span>
            <ArrowRight className="w-5 h-5 relative z-10 transition-transform duration-500 group-hover:translate-x-2 group-hover:scale-110" />

            {/* Pulsing ring */}
            <div className="absolute inset-0 rounded-xl border-2 border-[#B042C6] opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
          </Link>
        </motion.div>

        {/* Decorative dots */}
        <div className="mt-12 flex gap-3">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-secondary"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                delay: i * 0.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </motion.div>
    </section>
  )
}

export default CtaHelpSection
