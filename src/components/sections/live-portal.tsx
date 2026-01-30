"use client"

import { ExternalLink } from "lucide-react"
import { projects } from "@/data/projects"

export default function LivePortal() {
  const portal = projects.find(p => p.title === "Web GIS Management Portal")

  return (
    <section id="live-portal" className="w-full bg-gray-50">
      <div className="container mx-auto px-4 w-full py-12 lg:py-20 flex flex-col lg:flex-row items-center lg:items-stretch gap-8">
        {/* Text Column */}
        <div className="w-full lg:w-1/3 flex flex-col justify-center text-center lg:text-left">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Live Portal</h2>
          <p className="mt-4 text-lg text-gray-600">
            {portal?.description ?? "Preview our Web GIS Management Portal. Use the button to open the full portal in a new tab."}
          </p>

          <div className="mt-6 lg:mt-8">
            <a
              href="https://geoinformatic-portal.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#f97316] hover:bg-[#f97316]/90 text-white rounded-md shadow-md"
            >
              Open Full Portal
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Iframe Column */}
        <div className="w-full lg:w-2/3 flex items-center justify-center">
          <div className="w-full h-[60vh] lg:h-[70vh] rounded-2xl overflow-hidden border border-gray-200 shadow-lg bg-white">
            <iframe
              src="https://geoinformatic-portal.vercel.app/"
              title="Live Portal Preview"
              className="w-full h-full"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
