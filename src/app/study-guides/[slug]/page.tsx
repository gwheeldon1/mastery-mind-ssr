import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { StudyGuideContent } from "./study-guide-content";

/** Revalidate study guide pages every hour (ISR) */
export const revalidate = 3600;

/**
 * Pre-render all published study guides at build time.
 * Uses a standalone client (no cookies) since build-time has no request context.
 */
export async function generateStaticParams() {
    const { createClient: createBuildClient } = await import("@supabase/supabase-js");
    const supabase = createBuildClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
        .from("study_guides")
        .select("slug")
        .in("status", ["published", "review"]);

    return (data || []).map((g) => ({ slug: g.slug }));
}

/**
 * Dynamic metadata for SEO — title, description, OpenGraph, JSON-LD.
 * This runs server-side so search engines see the final HTML.
 */
export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const supabase = await createClient();
    const { data: guide } = await supabase
        .from("study_guides")
        .select(
            "topic_name, exam_board, qualification_level, summary, slug, subjects:subject_id (name)"
        )
        .eq("slug", slug)
        .in("status", ["published", "review"])
        .maybeSingle();

    if (!guide) return { title: "Study Guide Not Found" };

    const subjectName = (guide as any).subjects?.name || "";
    const title = `${guide.topic_name} – ${guide.exam_board} ${guide.qualification_level} Study Guide`;
    const description =
        guide.summary?.slice(0, 155) ||
        `Comprehensive study guide for ${guide.topic_name}. ${guide.exam_board} ${guide.qualification_level}${subjectName ? ` ${subjectName}` : ""}. Includes worked examples, practice questions, and key definitions.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "article",
            url: `https://masterymind.co.uk/study-guides/${guide.slug}`,
        },
        alternates: {
            canonical: `https://masterymind.co.uk/study-guides/${guide.slug}`,
        },
    };
}

export default async function StudyGuideDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: guide, error } = await supabase
        .from("study_guides")
        .select(
            `id, slug, topic_name, exam_board, qualification_level,
       summary, content, worked_examples, practice_questions,
       key_definitions, estimated_read_time_mins,
       podcast_url, podcast_script, published_at, updated_at,
       subject_id, subjects:subject_id (name, slug, color)`
        )
        .eq("slug", slug)
        .in("status", ["published", "review"])
        .maybeSingle();

    if (error || !guide) notFound();

    const subjectName = (guide as any).subjects?.name || null;
    const subjectSlug = (guide as any).subjects?.slug || null;

    // JSON-LD structured data for search engines
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "LearningResource",
        name: `${guide.topic_name} Study Guide`,
        description:
            guide.summary?.slice(0, 155) ||
            `Study guide for ${guide.topic_name}`,
        url: `https://masterymind.co.uk/study-guides/${guide.slug}`,
        learningResourceType: "Study Guide",
        educationalLevel: guide.qualification_level,
        inLanguage: "en-GB",
        ...(guide.published_at && { datePublished: guide.published_at }),
        ...(guide.updated_at && { dateModified: guide.updated_at }),
        author: {
            "@type": "Organization",
            name: "MasteryMind",
            url: "https://masterymind.co.uk",
        },
        publisher: {
            "@type": "Organization",
            name: "MasteryMind",
            url: "https://masterymind.co.uk",
            logo: {
                "@type": "ImageObject",
                url: "https://masterymind.co.uk/favicon.png",
            },
        },
        educationalAlignment: {
            "@type": "AlignmentObject",
            alignmentType: "educationalLevel",
            targetName: guide.qualification_level,
            educationalFramework: guide.exam_board,
        },
        keywords: [guide.topic_name, guide.exam_board, guide.qualification_level, subjectName]
            .filter(Boolean)
            .join(", "),
    };

    const breadcrumbLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://masterymind.co.uk" },
            { "@type": "ListItem", position: 2, name: "Study Guides", item: "https://masterymind.co.uk/study-guides" },
            ...(subjectSlug
                ? [
                    {
                        "@type": "ListItem",
                        position: 3,
                        name: subjectName,
                        item: `https://masterymind.co.uk/study-guides?subject=${subjectSlug}`,
                    },
                ]
                : []),
            {
                "@type": "ListItem",
                position: subjectSlug ? 4 : 3,
                name: guide.topic_name,
            },
        ],
    };

    // Compute stats
    const workedExamples = Array.isArray(guide.worked_examples)
        ? guide.worked_examples
        : [];
    const practiceQuestions = Array.isArray(guide.practice_questions)
        ? guide.practice_questions
        : [];
    const keyDefinitions = Array.isArray(guide.key_definitions)
        ? guide.key_definitions
        : [];
    const synopticLinks = Array.isArray((guide as any).synoptic_links)
        ? (guide as any).synoptic_links
        : [];

    // Fetch related guides (same subject, different slug)
    let relatedGuides: { slug: string; topic_name: string; exam_board: string; qualification_level: string }[] = [];
    if (guide.subject_id) {
        const { data: related } = await supabase
            .from("study_guides")
            .select("slug, topic_name, exam_board, qualification_level")
            .eq("subject_id", guide.subject_id)
            .neq("slug", guide.slug)
            .in("status", ["published", "review"])
            .limit(4);
        relatedGuides = related || [];
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, breadcrumbLd]) }}
            />
            <StudyGuideContent
                guide={{
                    id: guide.id,
                    slug: guide.slug,
                    topic_name: guide.topic_name,
                    exam_board: guide.exam_board,
                    qualification_level: guide.qualification_level,
                    summary: guide.summary,
                    content: guide.content || "",
                    podcast_url: guide.podcast_url,
                    estimated_read_time_mins: guide.estimated_read_time_mins,
                    subject_name: subjectName,
                    subject_slug: subjectSlug,
                }}
                workedExamples={workedExamples}
                practiceQuestions={practiceQuestions}
                keyDefinitions={keyDefinitions}
                synopticLinks={synopticLinks}
                relatedGuides={relatedGuides}
            />
        </>
    );
}
