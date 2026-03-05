import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mastery-mind-ssr-3sg6aq4uiq-ew.a.run.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
        { url: `${BASE_URL}/subjects`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
        { url: `${BASE_URL}/study-guides`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
        { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
        { url: `${BASE_URL}/features`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
        { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
        { url: `${BASE_URL}/schools`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
        { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
        { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    ];

    // Dynamic study guide pages
    const { data: guides } = await supabase
        .from("study_guides")
        .select("slug, updated_at")
        .in("status", ["published", "review"])
        .order("updated_at", { ascending: false });

    const guidePages: MetadataRoute.Sitemap = (guides || []).map((g) => ({
        url: `${BASE_URL}/study-guides/${g.slug}`,
        lastModified: g.updated_at ? new Date(g.updated_at) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
    }));

    // Dynamic subject pages
    const { data: subjects } = await supabase
        .from("subjects")
        .select("slug, updated_at");

    const subjectPages: MetadataRoute.Sitemap = (subjects || []).map((s) => ({
        url: `${BASE_URL}/subjects/${s.slug}`,
        lastModified: s.updated_at ? new Date(s.updated_at) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
    }));

    return [...staticPages, ...guidePages, ...subjectPages];
}
