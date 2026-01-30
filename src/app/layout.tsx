import type { Metadata } from "next";
import "@/app/globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { JobAlertProvider } from "@/components/jobs/job-alert-context";

export const metadata: Metadata = {
    title: {
        default: "GEOINFORMATIC Services - Professional GIS & Geospatial Solutions",
        template: "%s | GEOINFORMATIC Services"
    },
    description: "Expert GIS services, urban planning, Remote Sensing, and infrastructure solutions in Rawalpindi, Pakistan. Empowering decisions with precision geospatial data.",
    keywords: [
        "GIS Services Pakistan",
        "Geospatial Solutions Rawalpindi",
        "Urban Planning GIS",
        "Remote Sensing Pakistan",
        "Topographical Surveying",
        "Cadastral Mapping",
        "Drone Surveying UAV",
        "Land Record Digitization",
        "Geoinformatic Services",
        "Web Development Service",
        "Full Stack Development Pakistan",
        "WebGIS Development",
        "Next.js React Dashboard",
        "AI Automation Solutions",
        "Custom Bot Development",
        "Enterprise App Development",
        "Software Development Rawalpindi"
    ],
    authors: [{ name: "Geoinformatic Services" }],
    creator: "MSA-CREATIVES",
    publisher: "MSA-CREATIVES",
    alternates: {
        canonical: "https://msa-creatives.vercel.app/",
    },
    openGraph: {
        title: "GEOINFORMATIC Services - Professional GIS Solutions",
        description: "Innovative geospatial solutions for modern industries. Specializing in GIS, Remote Sensing, and Land Management.",
        url: "https://geoinformatic.services",
        siteName: "GEOINFORMATIC Services",
        images: [
            {
                url: "/extra-images/logo.png", // Using the existing logo as a fallback OG image
                width: 800,
                height: 600,
                alt: "Geoinformatic Services Logo",
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "GEOINFORMATIC Services - Professional GIS Solutions",
        description: "Innovative geospatial solutions for modern industries. Specializing in GIS, Remote Sensing, and Land Management.",
        images: ["/extra-images/logo.png"],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    icons: {
        icon: "/favicon.ico",
        shortcut: "/favicon.ico",
        apple: "/favicon.ico",
    },
};

import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
              window.addEventListener('message', function(event) {
                if (event.data && event.data.type === 'ROUTE_CHANGE') {
                  window.location.href = event.data.url;
                }
              });
            `,
                    }}
                />
            </head>
            <body className="antialiased min-h-screen bg-background text-foreground">
                <AuthProvider>
                    <JobAlertProvider>
                        {children}
                        <Toaster position="top-right" richColors />
                        <Analytics />
                        <SpeedInsights />
                    </JobAlertProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
