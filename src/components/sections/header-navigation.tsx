"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { motion, useScroll, useMotionValueEvent } from "framer-motion"

import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "@/components/ui/sheet"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Menu, Map, Globe, Satellite, Building2, Sprout, BookOpen, Database, Plane, Cpu, Bot, Code2, Activity, ArrowRight } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import UserMenu from "./user-menu"
import { NotificationPopover } from "@/components/notifications/NotificationPopover"
import { LiquidGlass } from "@/components/ui/liquid-glass"

import { servicesData } from "@/data/services-data"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/jobs", label: "Jobs" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]

const iconMap: Record<string, React.ReactNode> = {
  "land-surveying": <Map className="w-4 h-4" />,
  "gis-services": <Globe className="w-4 h-4" />,
  "remote-sensing": <Satellite className="w-4 h-4" />,
  "planning-infrastructure": <Building2 className="w-4 h-4" />,
  "environmental-agriculture": <Sprout className="w-4 h-4" />,
  "capacity-consultancy": <BookOpen className="w-4 h-4" />,
  "data-entry": <Database className="w-4 h-4" />,
  "drone-survey": <Plane className="w-4 h-4" />,
  "ai-solutions": <Cpu className="w-4 h-4" />,
  "ai-bots": <Bot className="w-4 h-4" />,
  "full-stack-dev": <Code2 className="w-4 h-4" />,
}

const gisServices = servicesData.map(service => ({
  href: `/services/${service.id}`,
  label: service.title,
  description: service.shortDescription,
  icon: iconMap[service.id] || <Activity className="w-4 h-4" />
}))

export default function HeaderNavigation() {
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [isHidden, setIsHidden] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [hoveredPath, setHoveredPath] = React.useState<string | null>(null)

  const pathname = usePathname()
  const { scrollY } = useScroll()
  const lastScrollY = React.useRef(0)

  const isContactPage = pathname === "/contact"

  // Pages that have a dark hero section at the top (use white text initially)
  const hasDarkHero = pathname === "/" || pathname === "/about" || pathname === "/projects"

  // Force black text in header (always use light background)
  const textColor = "text-gray-900"
  const activeTextColor = "text-primary font-bold"
  const hoverTextColor = "hover:text-gray-700"

  const { user, loading: isLoading } = useAuth()

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = lastScrollY.current
    if (latest > previous && latest > 150) {
      setIsHidden(true)
    } else {
      setIsHidden(false)
    }
    setIsScrolled(latest > 20)
    lastScrollY.current = latest
  })



  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <motion.header
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={isHidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300 bg-white shadow-sm border-b py-2",
      )}
    >
      <div className="container mx-auto flex items-center justify-between px-4 md:px-8 lg:px-10">
        <div className="flex-shrink-0">
          <Link href="/" className="block transition-transform hover:scale-105 duration-300">
            <Image
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/986c6fe2-3527-491b-b576-ae12c431a91d-geo-informatic-com/assets/images/download-15-1.png"
              alt="Geoinformatic Services Logo"
              width={(isScrolled || isContactPage) ? 200 : 254}
              height={(isScrolled || isContactPage) ? 42 : 54}
              className="transition-all duration-300"
              priority
            />
          </Link>
        </div>

        <nav className="hidden lg:flex lg:items-center lg:justify-center flex-1" onMouseLeave={() => setHoveredPath(null)}>
          <NavigationMenu>
            <NavigationMenuList className="gap-x-2">
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={cn(
                  "group relative inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-50 hover:bg-transparent focus:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent",
                  pathname === "/" ? activeTextColor : textColor,
                  hoverTextColor,
                )}
                  onMouseEnter={() => setHoveredPath("/")}
                >
                  <Link href="/" className="relative flex items-center justify-center px-4 py-2">
                    <span className="relative z-10">Home</span>
                    {(hoveredPath === "/" || (pathname === "/" && hoveredPath === null)) && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className="absolute inset-0 z-0 rounded-full overflow-hidden"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      >
                        <LiquidGlass className="w-full h-full" />
                      </motion.div>
                    )}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={cn(
                    "group bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent data-[active]:bg-transparent",
                    "font-medium text-sm px-4 py-2 rounded-full transition-colors",
                    textColor,
                    hoverTextColor,
                  )}
                >
                  Our Services
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[800px] p-0 overflow-hidden rounded-xl bg-white/95 backdrop-blur-3xl border border-white/20 shadow-2xl">
                    <div className="grid grid-cols-12 h-full">
                      {/* Featured Sidebar */}
                      <div className="col-span-4 bg-gray-50/50 p-6 flex flex-col justify-between border-r border-gray-100">
                        <div>
                          <h4 className="font-bold text-lg text-gray-900 mb-2">Our Expertise</h4>
                          <p className="text-sm text-gray-500 leading-relaxed mb-6">
                            From terrestrial mapping to advanced AI-driven spatial analysis, we deliver precision at every scale.
                          </p>
                        </div>
                        <div className="space-y-3">
                          <Link href="/contact" className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                            Get a Quote <ArrowRight className="w-4 h-4" />
                          </Link>
                          <Link href="/projects" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                            View Projects <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>

                      {/* Services Grid */}
                      <div className="col-span-8 p-6 bg-white">
                        <ul className="grid grid-cols-2 gap-x-4 gap-y-4">
                          {gisServices.map((service) => (
                            <li key={service.label}>
                              <NavigationMenuLink asChild>
                                <Link
                                  href={service.href}
                                  className="group flex flex-col gap-1 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                      {service.icon}
                                    </div>
                                    <div className="text-sm font-semibold text-gray-900">
                                      {service.label}
                                    </div>
                                  </div>
                                  <p className="line-clamp-1 text-xs text-gray-500 pl-10 group-hover:text-gray-700 transition-colors">
                                    {service.description}
                                  </p>
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {navLinks
                .filter((l) => l.label !== "Home")
                .map((link) => (
                  <NavigationMenuItem key={link.label}>
                    <NavigationMenuLink asChild className={cn(
                      "group relative inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-50 hover:bg-transparent focus:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent",
                      pathname === link.href ? activeTextColor : textColor,
                      hoverTextColor,
                    )}
                      onMouseEnter={() => setHoveredPath(link.href)}
                    >
                      <Link href={link.href} className="relative flex items-center justify-center px-4 py-2">
                        <span className="relative z-10">{link.label}</span>
                        {(hoveredPath === link.href || (pathname === link.href && hoveredPath === null)) && (
                          <motion.div
                            layoutId="navbar-indicator"
                            className="absolute inset-0 z-0 rounded-full overflow-hidden"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          >
                            <LiquidGlass className="w-full h-full" />
                          </motion.div>
                        )}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
            </NavigationMenuList>
          </NavigationMenu>
        </nav>

        <div className="flex items-center gap-4">
          {!isLoading && user ? (
            <>
              <NotificationPopover userId={user.id} className={textColor} />
              <UserMenu user={{
                id: user.id,
                email: user.email || "",
                name: user.user_metadata?.full_name,
              }} />
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className={cn(
                  "hidden lg:block text-sm font-semibold transition-colors px-4",
                  textColor,
                  hoverTextColor,
                )}
              >
                Sign In
              </Link>
              <Link
                href="/auth/sign-up"
                className="hidden lg:block relative bg-gradient-to-r from-[#C7A24D] to-[#D97D25] text-white font-semibold text-sm px-6 py-2.5 rounded-full transition-all hover:shadow-[0_4px_20px_rgba(199,162,77,0.3)] hover:scale-105 active:scale-95 overflow-hidden group"
              >
                <span className="relative z-10">Get Started</span>
                <span className="absolute inset-0 bg-gradient-to-r from-[#D97D25] to-[#C7A24D] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </Link>
            </>
          )}

          <div className="lg:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open menu"
                  className={cn("transition-colors text-gray-900 hover:bg-accent")}
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[300px] sm:w-[400px] p-0 border-l-white/20 bg-white/95 backdrop-blur-xl"
              >
                <SheetHeader className="p-6 border-b border-border/10">
                  <div className="flex-shrink-0">
                    <Link href="/" onClick={closeMobileMenu}>
                      <Image
                        src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/986c6fe2-3527-491b-b576-ae12c431a91d-geo-informatic-com/assets/images/download-15-1.png"
                        alt="Geoinformatic Services Logo"
                        width={180}
                        height={38}
                      />
                    </Link>
                  </div>
                </SheetHeader>
                <div className="flex flex-col h-full overflow-y-auto py-6 px-4">
                  <nav className="flex flex-col space-y-1">
                    <Link
                      href="/"
                      className={cn(
                        "flex items-center py-3 px-4 rounded-lg text-sm font-medium transition-colors",
                        pathname === "/" ? "bg-primary/10 text-primary" : "hover:bg-accent text-foreground/80",
                      )}
                      onClick={closeMobileMenu}
                    >
                      Home
                    </Link>
                    <Accordion type="single" collapsible className="w-full border-none">
                      <AccordionItem value="item-1" className="border-none">
                        <AccordionTrigger className="py-3 px-4 text-sm font-medium hover:no-underline hover:bg-accent rounded-lg text-foreground/80 [&[data-state=open]]:bg-accent/50">
                          Our Services
                        </AccordionTrigger>
                        <AccordionContent className="pb-0 pt-1">
                          <div className="flex flex-col space-y-1 pl-4">
                            {gisServices.map((service) => (
                              <Link
                                key={service.label}
                                href={service.href}
                                className="block py-2.5 px-4 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-primary transition-colors"
                                onClick={closeMobileMenu}
                              >
                                {service.label}
                              </Link>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                    {navLinks
                      .filter((l) => l.label !== "Home")
                      .map((link) => (
                        <Link
                          key={link.label}
                          href={link.href}
                          className={cn(
                            "flex items-center py-3 px-4 rounded-lg text-sm font-medium transition-colors",
                            pathname === link.href
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-accent text-foreground/80",
                          )}
                          onClick={closeMobileMenu}
                        >
                          {link.label}
                        </Link>
                      ))}
                  </nav>
                  <div className="mt-auto pt-8 pb-8 space-y-3 px-2">
                    {!isLoading && user ? (
                      <>
                        <Link
                          href="/profile"
                          className="flex items-center justify-center w-full border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 rounded-full px-4 py-2 text-sm font-medium transition-colors"
                          onClick={closeMobileMenu}
                        >
                          Profile
                        </Link>
                        <Link
                          href="/profile/chat"
                          className="flex items-center justify-center w-full border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 rounded-full px-4 py-2 text-sm font-medium transition-colors"
                          onClick={closeMobileMenu}
                        >
                          Chat
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/auth/login"
                          className="flex items-center justify-center w-full border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 rounded-full px-4 py-2 text-sm font-medium transition-colors"
                          onClick={closeMobileMenu}
                        >
                          Sign In
                        </Link>
                        <Link
                          href="/auth/sign-up"
                          className="flex items-center justify-center w-full bg-gradient-to-r from-[#C7A24D] to-[#D97D25] text-white hover:opacity-90 h-10 rounded-full px-4 py-2 text-sm font-medium transition-all shadow-md"
                          onClick={closeMobileMenu}
                        >
                          Get Started
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.header >
  )
}
