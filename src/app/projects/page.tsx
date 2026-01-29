"use client";

import HeaderNavigation from "@/components/sections/header-navigation";
import Footer from "@/components/sections/footer";
import Image from "next/image";
import { MapPin, Calendar, Layers, ArrowRight, ExternalLink } from "lucide-react";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import ParticleGlobe from "@/components/ui/particle-globe";

const projects = [
  {
    title: "Web GIS Management Portal",
    client: "RDA, CDA & LIMS",
    location: "Islamabad & Rawalpindi",
    date: "2024-2025",
    category: "Web GIS Development",
    description: "A comprehensive Web GIS portal designed for major development authorities. Features include advanced polygon drawing tools, seamless import/export of spatial data, and real-time preview of raster and vector layers directly from the spatial database.",
    image: "/projects/Web GIS Management Portal.png",
    features: ["Polygon Drawing & Editing", "Raster/Vector Data Preview", "Import/Export (Shapefile/KML)", "Database Integration"]
  },
  {
    title: "Cadastral Mapping of 27 Sectors",
    client: "Survey of Pakistan, Rawalpindi",
    location: "Islamabad",
    date: "2021",
    category: "Cadastral Mapping",
    description: "Detailed mapping and surveying to capture geographic and property-related information for 27 sectors. Included densification of control points (DGPS), georeferencing of satellite imagery, and integration into the Cadastral Data Model.",
    image: "/projects/cadastral-islamabad.png",
    features: ["DGPS Control Points", "Data Verification", "Encroachment Identification", "Built-up Extent Comparison"]
  },
  {
    title: "Cadastral Mapping of CDA Sectors",
    client: "Survey of Pakistan, Rawalpindi",
    location: "Islamabad",
    date: "2021",
    category: "Urban Planning",
    description: "Cadastral mapping of 19 CDA sectors and approved housing societies. Focused on parcel fabrication, identifying encroachments, and highlighting by-law violations through historical imagery analysis.",
    image: "/projects/cda-sectors.png",
    features: ["Sector Plan Overlay", "Parcel Fabrication", "By-law Violation Check", "Historical Analysis"]
  },
  {
    title: "Punjab Urban Land System Enhancement (PULSE)",
    client: "Asian Consulting Engineers Pvt Ltd",
    location: "Bahawalpur Division",
    date: "2024",
    category: "Land Records",
    description: "Digitization and geo-referencing of Cadastral Maps (Masavies) for the Bahawalpur Division. Involved mosaicking according to BoR standards, attribute attachment, and land-use interpretation.",
    image: "/projects/pulse.png",
    features: ["Masavies Digitization", "BoR Standards Compliance", "Land-use Interpretation", "Database Integration"]
  },
  {
    title: "Generation of Digital Masavies",
    client: "LMKT, Islamabad",
    location: "Punjab (13 Districts)",
    date: "2017",
    category: "Digitization",
    description: "Massive scale generation of digital Masavies across 13 districts of Punjab, modernizing land records and facilitating efficient land management systems.",
    image: "/projects/digital-masavies.png",
    features: ["Digital Masavies", "Large-scale Digitization", "Land Record Modernization"]
  },
];

export default function ProjectsPage() {
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
        {/* Hero Section with Particle Globe */}
        <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden bg-black">
          {/* Particle Globe Layer */}
          <div className="absolute inset-0 w-full h-full z-0">
            <ParticleGlobe variant="earth" />
            <div className="absolute inset-0 bg-black/60 pointer-events-none z-10"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/80 pointer-events-none z-10"></div>
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
              <div className="inline-block mb-6 px-6 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md">
                <span className="text-white/90 text-sm font-medium tracking-wider uppercase">Portfolio</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 tracking-tight leading-tight">
                Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C7A24D] to-[#D97D25]">Projects</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-3xl mx-auto leading-relaxed font-light">
                Explore our portfolio of successful GIS projects delivering impactful solutions across diverse industries.
              </p>
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

        {/* Projects Grid */}
        <section className="bg-gray-50 py-20 lg:py-24 relative overflow-hidden">
          {/* Background Texture & Grid */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="grid gap-20 lg:gap-32">
              {projects.map((project, index) => {
                // Determine animations based on layout
                // Standard (Even): Image Left (slide from -x), Content Right (slide from +x)
                // Reverse (Odd): Content Left (slide from -x), Image Right (slide from +x)
                const isEven = index % 2 === 0;
                return (
                  <div
                    key={index}
                    className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center ${!isEven ? "lg:flex-row-reverse" : ""}`}
                  >
                    {/* Image Column */}
                    <motion.div
                      initial={{ opacity: 0, x: isEven ? -100 : 100 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.8 }}
                      className={!isEven ? "lg:order-2" : ""}
                    >
                      <div className="relative h-[450px] lg:h-[600px] flex items-center justify-center">
                        {project.title === "Web GIS Management Portal" ? (
                          <div className="relative w-full max-w-[450px] aspect-[16/10]">
                            {/* Laptop Mockup */}
                            {/* Base (Bottom) */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[110%] h-[4%] bg-[#1a1a1a] rounded-b-xl shadow-2xl z-20"></div>
                            {/* Keyboard Area (Middle) */}
                            <div className="absolute bottom-[4%] left-1/2 -translate-x-1/2 w-[110%] h-[3%] bg-[#2a2a2a] rounded-t sm:rounded-none z-20"></div>

                            {/* Screen Frame */}
                            <div className="absolute inset-0 bg-[#111] rounded-t-2xl border-[4px] border-[#2a2a2a] shadow-xl overflow-hidden z-10">
                              {/* Camera Dot */}
                              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#444] rounded-full z-30"></div>

                              {/* Live Iframe */}
                              <iframe
                                src="https://islamabad-portal.vercel.app/"
                                title="Web GIS Portal Live Preview"
                                className="w-full h-full border-0 bg-white"
                                loading="lazy"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="relative w-full h-full overflow-hidden rounded-xl">
                            <Image
                              src={project.image}
                              alt={project.title}
                              fill
                              className="object-contain hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* Content Column */}
                    <motion.div
                      initial={{ opacity: 0, x: isEven ? 100 : -100 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.8 }}
                      className={!isEven ? "lg:order-1" : ""}
                    >
                      <div className="inline-block bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-6 tracking-wide uppercase">
                        {project.category}
                      </div>

                      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight hover:text-primary transition-colors cursor-default">
                        {project.title}
                      </h2>

                      <div className="flex flex-wrap gap-4 mb-8 text-gray-600">
                        <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm">
                          <MapPin className="w-5 h-5 text-primary" />
                          <span className="font-medium">{project.location}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm">
                          <Calendar className="w-5 h-5 text-primary" />
                          <span className="font-medium">{project.date}</span>
                        </div>
                      </div>

                      <p className="text-lg text-gray-600 leading-relaxed mb-8">
                        {project.description}
                      </p>

                      {project.title === "Web GIS Management Portal" && (
                        <div className="mb-8">
                          <a
                            href="https://islamabad-portal.vercel.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#C7A24D] to-[#D97D25] text-white rounded-full font-semibold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-105 transition-all group"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>Launch Live Portal</span>
                            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </a>
                        </div>
                      )}

                      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">
                          <Layers className="w-4 h-4 text-primary" />
                          <span>Key Features</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {project.features.map((feature, fIndex) => (
                            <span
                              key={fIndex}
                              className="bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-100"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="font-semibold text-gray-900">Client:</span> {project.client}
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section - Gradient Glass */}
        <section className="py-24 relative overflow-hidden bg-[#111]">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#C7A24D]/20 to-[#D97D25]/20"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid-pattern.png')] opacity-5"></div>

          {/* Animated blobs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: "2s" }}></div>

          <div className="container mx-auto px-4 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 p-12 lg:p-16 rounded-3xl relative overflow-hidden group"
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Ready to Start Your GIS Project?
              </h2>
              <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto font-light">
                Let's work together to bring your geospatial vision to life with our expert team and proven methodologies.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <motion.a
                  href="/contact"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-10 py-4 bg-gradient-to-r from-[#C7A24D] to-[#D97D25] text-white font-bold rounded-full shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all"
                >
                  Get Started Now
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
