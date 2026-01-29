"use client"

import type React from "react"

import Image from "next/image"
import Link from "next/link"
import { MapPin, Phone, Mail, LogIn } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { toast } from "sonner"

const Footer = () => {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    toast.success("Successfully subscribed to our newsletter!")
    setEmail("")
    setIsSubmitting(false)
  }

  return (
    <footer
      className="relative bg-white pt-12 sm:pt-16 md:pt-20 pb-12 sm:pb-16"
      style={{
        backgroundImage:
          "url('https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/986c6fe2-3527-491b-b576-ae12c431a91d-GEOINFORMATIC-com/assets/images/map-13.png')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "contain",
      }}
    >
      <div className="absolute inset-0 bg-white opacity-90"></div>
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#C7A24D] via-[#D97D25] to-[#B042C6]"></div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_1.2fr_1fr] xl:grid-cols-[1.5fr_1fr_1.5fr_1.2fr] gap-x-8 gap-y-12">
          {/* Column 1: Logo and Tagline */}
          <div className="group">
            <Link href="/" className="inline-block transition-transform hover:scale-105 duration-300">
              <Image
                src="/extra-images/logo.png"
                alt="GEOINFORMATIC Services Logo"
                width={204}
                height={43}
                className="h-auto"
              />
            </Link>
            <p className="mt-5 text-[15px] leading-relaxed text-[#D97D25] transition-colors group-hover:text-[#C7A24D]">
              Discover professional GIS services for urban planning, real estate, environmental monitoring, and
              infrastructure. Enhance decision-making with geospatial solutions.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="lg:pl-8">
            <h4 className="text-xl font-semibold text-text-primary mb-5 relative inline-block">
              Quick Links
              <span className="absolute -bottom-1 left-0 w-12 h-0.5 bg-gradient-to-r from-primary to-secondary"></span>
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="group inline-flex items-center text-text-secondary hover:text-primary transition-all text-[15px]"
                >
                  <span className="w-0 group-hover:w-2 h-0.5 bg-primary transition-all duration-300 mr-0 group-hover:mr-2"></span>
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/projects"
                  className="group inline-flex items-center text-text-secondary hover:text-primary transition-all text-[15px]"
                >
                  <span className="w-0 group-hover:w-2 h-0.5 bg-primary transition-all duration-300 mr-0 group-hover:mr-2"></span>
                  Projects
                </Link>
              </li>
              <li>
                <Link
                  href="/jobs"
                  className="group inline-flex items-center text-text-secondary hover:text-primary transition-all text-[15px]"
                >
                  <span className="w-0 group-hover:w-2 h-0.5 bg-primary transition-all duration-300 mr-0 group-hover:mr-2"></span>
                  Jobs
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="group inline-flex items-center text-text-secondary hover:text-primary transition-all text-[15px]"
                >
                  <span className="w-0 group-hover:w-2 h-0.5 bg-primary transition-all duration-300 mr-0 group-hover:mr-2"></span>
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/admin-login"
                  className="group inline-flex items-center text-text-secondary hover:text-primary transition-all text-[15px]"
                >
                  <LogIn className="w-0 group-hover:w-4 h-0.5 bg-primary transition-all duration-300 mr-0 group-hover:mr-2 text-primary" />
                  Admin Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Info */}
          <div>
            <h4 className="text-xl font-semibold text-text-primary mb-5 relative inline-block">
              Contact Info
              <span className="absolute -bottom-1 left-0 w-12 h-0.5 bg-gradient-to-r from-primary to-secondary"></span>
            </h4>
            <div className="space-y-4">
              <div className="group flex items-start transition-transform hover:translate-x-1 duration-300">
                <MapPin className="w-5 h-5 text-primary mr-3 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <p className="text-text-secondary text-[15px] leading-relaxed group-hover:text-primary transition-colors">
                  2nd Floor, National Business Center, Murree Road, Rawalpindi,Pakistan
                </p>
              </div>
              <div className="group flex items-center transition-transform hover:translate-x-1 duration-300">
                <Phone className="w-5 h-5 text-primary mr-3 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <a
                  href="tel:+923335400811"
                  className="text-text-secondary hover:text-primary transition-colors text-[15px]"
                >
                  +92 313-5561075
                </a>
              </div>
              <div className="group flex items-center transition-transform hover:translate-x-1 duration-300">
                <Mail className="w-5 h-5 text-primary mr-3 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <a
                  href="mailto:GEOINFORMATIC.SERVICES@GMAIL.COM"
                  className="text-text-secondary hover:text-primary transition-colors text-[15px]"
                >
                  GEOINFORMATIC.SERVICES@GMAIL.COM
                </a>
              </div>
            </div>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h4 className="text-xl font-semibold text-text-primary mb-5 relative inline-block">
              Join Our Newsletter
              <span className="absolute -bottom-1 left-0 w-12 h-0.5 bg-gradient-to-r from-primary to-secondary"></span>
            </h4>
            <form onSubmit={handleNewsletterSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-transparent border-0 border-b-2 border-gray-300 rounded-none px-0 pb-2 h-auto focus:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-500 transition-all"
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full border-2 border-foreground bg-transparent px-7 py-5 h-auto text-sm font-semibold text-foreground transition-all hover:bg-foreground hover:text-background hover:scale-105 active:scale-95 leading-none disabled:opacity-50"
              >
                {isSubmitting ? "Subscribing..." : "Sign Me Up"}
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-text-secondary">
              © {new Date().getFullYear()} GEOINFORMATIC Services. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/about" className="text-sm text-text-secondary hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/about" className="text-sm text-text-secondary hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer