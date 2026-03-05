import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/dashboard", "/quiz", "/exam", "/profile", "/subscription", "/admin", "/teacher", "/onboarding"],
            },
        ],
        sitemap: "https://masterymind.co.uk/sitemap.xml",
    };
}
