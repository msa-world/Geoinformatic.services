"use client"

import { TeamCarousel } from "@/components/lightswind/team-carousel"
import { useState, useEffect } from "react"

const teamMembers = [
    {
        id: "1",
        name: "Vitaly Sedler",
        role: "Founder, Wpmet",
        image: "/testterminols/Vitaly Sedler,Founder, Wpmet.jpg",
        bio: "Visionary leader with a passion for digital transformation.",
    },
    {
        id: "2",
        name: "Stephen Flores",
        role: "Founder, Wpmet",
        image: "/testterminols/Stephen Flores,Founder, Wpmet.png",
        bio: "Expert in GIS solutions and complex data integration.",
    },
    {
        id: "3",
        name: "Ch. Muhammad Hanif",
        role: "Founder, Asiancon",
        image: "/testterminols/hanif-sb.jpg",
        bio: "Pioneer in transforming BIM/CAD data into GIS driven solutions.",
    },
]

export default function TeamSection() {
    const [cardWidth, setCardWidth] = useState(280)

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) {
                setCardWidth(260)
            } else {
                setCardWidth(280)
            }
        }

        handleResize() // Initial check
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return (
        <section className="py-24 bg-white">
            <div className="container px-4 md:px-6 mx-auto">
                <TeamCarousel
                    members={teamMembers}
                    title="OUR TEAM"
                    autoPlay={3000}
                    cardWidth={cardWidth}
                />
            </div>
        </section>
    )
}
