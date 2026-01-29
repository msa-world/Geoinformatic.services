"use client"

import { useEffect } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export const useScrollAnimations = () => {
  useEffect(() => {
    const refreshScrollTrigger = () => {
      // Don't kill all triggers globally as it interferes with local component triggers
      ScrollTrigger.refresh()
    }

    refreshScrollTrigger()

    // Re-refresh after a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      ScrollTrigger.refresh()
    }, 100)

    const handleRouteChange = () => {
      refreshScrollTrigger()
    }

    window.addEventListener("load", handleRouteChange)

    return () => {
      clearTimeout(timer)
      window.removeEventListener("load", handleRouteChange)
    }
  }, [])
}
