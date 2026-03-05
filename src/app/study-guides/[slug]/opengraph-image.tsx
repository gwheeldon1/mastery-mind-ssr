import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";
export const alt = "Study Guide";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Dynamic OG image for study guide pages.
 * Renders the topic name, exam board, qualification, and subject
 * as a branded card for social sharing.
 */
export default async function Image({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: guide } = await supabase
        .from("study_guides")
        .select(
            "topic_name, exam_board, qualification_level, summary, subjects:subject_id (name)"
        )
        .eq("slug", slug)
        .maybeSingle();

    const title = guide?.topic_name || "Study Guide";
    const examBoard = guide?.exam_board || "";
    const level = guide?.qualification_level || "";
    const subject = (guide as any)?.subjects?.name || "";
    const summary = guide?.summary
        ? guide.summary.slice(0, 120) + (guide.summary.length > 120 ? "…" : "")
        : "";

    return new ImageResponse(
        (
            <div
                style={{
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "60px",
                    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6366f1 100%)",
                    fontFamily: "system-ui, sans-serif",
                    color: "white",
                }}
            >
                {/* Top bar */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <div
                        style={{
                            fontSize: "24px",
                            fontWeight: 800,
                            letterSpacing: "-0.5px",
                        }}
                    >
                        MasteryMind
                    </div>
                    <div
                        style={{
                            fontSize: "16px",
                            opacity: 0.8,
                            marginLeft: "auto",
                        }}
                    >
                        📖 Study Guide
                    </div>
                </div>

                {/* Content */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div
                        style={{
                            fontSize: "48px",
                            fontWeight: 700,
                            lineHeight: 1.1,
                            maxWidth: "900px",
                        }}
                    >
                        {title}
                    </div>
                    {summary && (
                        <div
                            style={{
                                fontSize: "20px",
                                opacity: 0.85,
                                lineHeight: 1.4,
                                maxWidth: "800px",
                            }}
                        >
                            {summary}
                        </div>
                    )}
                </div>

                {/* Bottom badges */}
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    {examBoard && (
                        <div
                            style={{
                                background: "rgba(255,255,255,0.2)",
                                borderRadius: "8px",
                                padding: "8px 16px",
                                fontSize: "18px",
                                fontWeight: 600,
                            }}
                        >
                            {examBoard}
                        </div>
                    )}
                    {level && (
                        <div
                            style={{
                                background: "rgba(255,255,255,0.2)",
                                borderRadius: "8px",
                                padding: "8px 16px",
                                fontSize: "18px",
                                fontWeight: 600,
                            }}
                        >
                            {level}
                        </div>
                    )}
                    {subject && (
                        <div
                            style={{
                                background: "rgba(255,255,255,0.15)",
                                borderRadius: "8px",
                                padding: "8px 16px",
                                fontSize: "18px",
                            }}
                        >
                            {subject}
                        </div>
                    )}
                    <div
                        style={{
                            marginLeft: "auto",
                            fontSize: "16px",
                            opacity: 0.7,
                        }}
                    >
                        masterymind.co.uk
                    </div>
                </div>
            </div>
        ),
        { ...size }
    );
}
