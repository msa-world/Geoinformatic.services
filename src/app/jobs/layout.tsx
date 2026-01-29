import type { Metadata } from "next";

export const metadata: Metadata = {
    title: {
        default: "Careers & GIS Job Opportunities",
        template: "%s | Geoinformatic Services Careers"
    },
    description: "Join the leading geospatial team in Pakistan. Explore job openings in GIS, Remote Sensing, WebGIS Development, and Drone Surveying. Build your career with Geoinformatic Services.",
    keywords: [
        "GIS Jobs Pakistan",
        "Geospatial Careers Rawalpindi",
        "Remote Sensing Jobs",
        "WebGIS Developer Vacancies",
        "Hiring GIS Specialists",
        "Geoinformatic Services Careers"
    ],
    openGraph: {
        title: "Join Our Team | Geoinformatic Services Careers",
        description: "Looking for a career in GIS and Geospatial technology? Check out our latest job openings and join a team of innovators.",
        url: "https://geoinformatic.services/jobs",
        type: "website",
    },
};

export default function JobsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
