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
    <Link href={`/services/${service.id}`} className="block group h-full">
      <div className="h-full min-h-[160px] p-5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/40 transition-all duration-300 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors duration-300">
              {service.title}
            </h3>
            <div className="p-2 rounded-lg bg-white/5 text-white/40 group-hover:text-primary transition-colors">
              <Layers size={18} />
            </div>
          </div>
          <p className="text-white/50 text-xs sm:text-sm line-clamp-2 leading-relaxed">
            {service.shortDescription}
          </p>
        </div>

        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
          <span>Explore</span>
          <ArrowRight size={14} />
        </div>
      </div>
    </Link>
  );
};

export default function ServicesGrid() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section 
      ref={containerRef} 
      className="relative z-10 bg-[#0A0A0A]"
    >
      <div className="sticky top-0 h-screen w-full flex flex-col justify-center px-6 md:px-12 lg:px-24 overflow-hidden">
        {/* Background Subtle Gradient */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full">
          {/* Section Header */}
          <div className="mb-10 text-center md:text-left">
            <span className="text-secondary font-mono tracking-widest text-[10px] uppercase mb-2 block">// Specialized Solutions</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
              Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Services</span>
            </h2>
          </div>

          {/* 3-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5 w-full">
            {servicesData.slice(0, 11).map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
            
            {/* Minimal CTA Card */}
            <Link href="/contact" className="group block h-full">
              <div className="h-full min-h-[160px] flex flex-col items-center justify-center p-5 rounded-xl border border-dashed border-white/20 bg-primary/5 hover:bg-primary/10 transition-all duration-300">
                <h3 className="text-lg font-bold text-white mb-2 text-center">Custom Needs?</h3>
                <div className="flex items-center gap-2 text-primary font-bold text-xs">
                  Contact Us <ArrowRight size={14} />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Spacer to allow the next section to stack over it */}
      <div className="h-[100vh]" />
    </section>
  );
}
