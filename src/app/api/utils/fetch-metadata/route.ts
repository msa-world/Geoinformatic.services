import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json(
                { error: "URL is required" },
                { status: 400 }
            );
        }

        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
                },
                next: { revalidate: 3600 } // Cache for 1 hour
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
            }

            const html = await response.text();

            // Simple regex based parsing to avoid heavy dependencies like cheerio or jsdom
            // ensuring we capture content inside quotes properly
            const getMetaContent = (propName: string) => {
                const regex = new RegExp(`<meta\\s+(?:name|property)=["']${propName}["']\\s+content=["'](.*?)["']`, 'i');
                const match = html.match(regex);
                return match ? match[1] : null;
            };

            const getTitle = () => {
                const ogTitle = getMetaContent('og:title');
                if (ogTitle) return ogTitle;

                const titleRegex = /<title>(.*?)<\/title>/i;
                const match = html.match(titleRegex);
                return match ? match[1] : null;
            };

            const title = getTitle();
            const description = getMetaContent('og:description') || getMetaContent('description');
            const image = getMetaContent('og:image');
            const siteName = getMetaContent('og:site_name');

            return NextResponse.json({
                title,
                description,
                image,
                siteName
            });

        } catch (fetchError: any) {
            console.error("Error fetching external URL:", fetchError);
            return NextResponse.json(
                { error: "Failed to fetch content from the provided URL" },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error("Metadata API Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
