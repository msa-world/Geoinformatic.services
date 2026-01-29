"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ArrowRight, Box, Layers, Globe, Zap, Cpu, Map as MapIcon, Database, Activity } from "lucide-react";
import Link from "next/link";
import { servicesData } from "@/data/services-data";
import Image from "next/image";
import { useIsMobile } from "@/hooks/use-mobile";

const ServiceCard = ({ service }: { service: typeof servicesData[0] }) => {
  return (
    <Link href={`/services/${service.id}`} className="block group w-full sm:w-auto">
      <motion.div
        whileHover={{ y: -10 }}
        className="w-full sm:w-[340px] md:w-[380px] h-[400px] sm:h-[450px] md:h-[480px] relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-md flex flex-col shrink-0 group-hover:border-primary/50 transition-colors duration-500"
      >
        {/* Image Top Half */}
        <div className="relative h-1/2 w-full overflow-hidden">
          <Image
            src={service.imageUrl || "/placeholder.jpg"}
            alt={service.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

          {/* Icon Badge */}
          <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-primary group-hover:text-black transition-colors duration-300">
            <Layers size={20} />
          </div>
        </div>

        {/* Content Bottom Half */}
        <div className="h-1/2 p-6 flex flex-col justify-between relative">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent group-hover:from-primary group-hover:to-secondary transition-all duration-300 mb-2">
              {service.title}
            </h3>
            <p className="text-white/60 text-sm line-clamp-3 leading-relaxed">
              {service.shortDescription}
            </p>
          </div>

          <div className="flex items-center gap-2 text-primary text-sm font-medium tracking-wide uppercase group-hover:translate-x-2 transition-transform duration-300">
            <span>View Details</span>
            <ArrowRight size={16} />
          </div>

          {/* Decorative Tech Lines */}
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </motion.div>
    </Link>
  );
};

export default function ServicesGrid() {
  const targetRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  // Smooth scroll effect
  const smoothProgress = useSpring(scrollYProgress, {
    mass: 0.1,
    stiffness: 100,
    damping: 20,
    restDelta: 0.001
  });

  // Transform scroll progress to horizontal translation
  // On mobile, we disable the transform so cards flow naturally
  const x = useTransform(smoothProgress, [0, 1], ["0%", "-85%"]);

  // Opacity fade for entrance/exit - Only apply on desktop
  const opacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);

  return (
    <section ref={targetRef} className="relative lg:h-[400vh] h-auto bg-[#0A0A0A]">
      {/* Background Tech Pattern */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      <div className="lg:sticky lg:top-0 flex flex-col lg:flex-row lg:h-screen lg:items-center overflow-hidden lg:overflow-hidden relative z-10">

        {/* Section Header */}
        <div className="lg:absolute lg:top-1/2 lg:-translate-y-1/2 lg:left-10 md:left-20 z-20 w-full lg:max-w-md px-6 pt-20 pb-10 lg:py-0 pointer-events-none">
          <motion.h2
            style={{ opacity: isMobile ? 1 : opacity }}
            className="text-6xl md:text-8xl font-black text-white/5 uppercase tracking-tighter absolute -top-10 lg:-top-20 -left-4 lg:-left-10 select-none hidden lg:block"
          >
            Services
          </motion.h2>
          <motion.div
            style={{ opacity: isMobile ? 1 : opacity }}
            className="relative"
          >
            <span className="text-secondary font-mono tracking-widest text-xs sm:text-sm uppercase mb-4 block">// Our Expertise</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              High-Tech <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Geospatial</span><br /> Solutions
            </h2>
            <p className="text-white/60 text-base sm:text-lg max-w-xs leading-relaxed">
              Scroll to explore our range of advanced mapping and surveying capabilities.
            </p>
          </motion.div>
        </div>

        {/* Horizontal Motion Row - Scrolling Content */}
        {/* Added z-30 to ensure cards scroll ABOVE the text if they overlap */}
        <motion.div
          style={{ x: isMobile ? "0%" : x }}
          className="flex flex-col lg:flex-row gap-8 pl-0 lg:pl-[50vw] pr-0 lg:pr-20 items-center lg:items-center px-6 lg:px-0 pb-20 lg:pb-0 z-30 relative w-full lg:w-auto"
        >
          {servicesData.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}

          {/* "See All" End Card */}
          <div className="w-full sm:w-[300px] h-[300px] lg:h-[480px] flex items-center justify-center shrink-0">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-white mb-4">Ready to Start?</h3>
              <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-black font-bold rounded-full hover:bg-white transition-colors">
                Contact Us <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
