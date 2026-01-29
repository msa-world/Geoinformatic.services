"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Layers } from "lucide-react";
import Link from "next/link";
import { servicesData } from "@/data/services-data";
import Image from "next/image";

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
  return (
    <section className="relative py-24 bg-[#0A0A0A]">
      {/* Background Tech Pattern */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="mb-16">
          <span className="text-secondary font-mono tracking-widest text-xs sm:text-sm uppercase mb-4 block">// Our Expertise</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            High-Tech <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Geospatial</span><br /> Solutions
          </h2>
          <p className="text-white/60 text-base sm:text-lg max-w-2xl leading-relaxed">
            Explore our range of advanced mapping and surveying capabilities designed for precision and efficiency.
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {servicesData.map((service) => (
            <div key={service.id} className="flex justify-center">
              <ServiceCard service={service} />
            </div>
          ))}

          {/* "See All" End Card */}
          <div className="flex items-center justify-center p-8 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Ready to Start?</h3>
              <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-black font-bold rounded-full hover:bg-white transition-colors">
                Contact Us <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
