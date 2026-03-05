"use client";

/**
 * Hook for fetching topic detail data from spec_topics table.
 * Handles slug-based topic matching with fallback patterns.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// ─── Types ──────────────────────────────────────────────────────────────

export interface SubjectData {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    slug: string;
}

export interface TopicData {
    id: string;
    topic: string;
    subtopic: string | null;
    topic_number: string | null;
    topic_synopsis: string | null;
    learning_objectives: string[];
    common_mistakes: string[] | null;
    exam_tips: string[] | null;
    key_themes: { term: string; definition: string }[] | null;
    marking_points: string[] | null;
    likely_command_words: string[] | null;
    practical_references: string[] | null;
    feedback_prompts: string[] | null;
    discriminator_features: DiscriminatorFeatures | null;
}

export interface DiscriminatorFeatures {
    basic_vs_advanced?: string[];
    astar_indicators?: string[];
    common_misconceptions?: string[];
}

export interface TopicDetailStats {
    totalObjectives: number;
    totalTips: number;
    totalMistakes: number;
    totalTerms: number;
    totalMarkingPoints: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────

function parseKeyTerminology(
    data: unknown
): { term: string; definition: string }[] | null {
    if (!data) return null;

    let parsed = data;
    if (typeof data === "string") {
        try {
            parsed = JSON.parse(data);
        } catch {
            return null;
        }
    }

    if (Array.isArray(parsed)) {
        return parsed
            .map((item) => {
                let obj = item;
                if (typeof item === "string") {
                    try {
                        obj = JSON.parse(item);
                    } catch {
                        return { term: item, definition: "" };
                    }
                }
                if (typeof obj === "object" && obj !== null) {
                    const term = obj.term || obj.theme || "";
                    const definition = obj.definition || obj.description || "";
                    return { term, definition };
                }
                return { term: String(obj), definition: "" };
            })
            .filter((i) => i.term);
    }
    return null;
}

function isUsefulObjective(obj: string): boolean {
    const lower = obj.toLowerCase().trim();
    return (
        !lower.includes("see specification") &&
        !lower.includes("refer to spec") &&
        lower.length > 10
    );
}

/** Convert a topic name to a URL-friendly slug */
export function toTopicSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

/** Generate search patterns from a slug for fuzzy matching */
function getTopicSearchPatterns(slug: string): string[] {
    const decoded = decodeURIComponent(slug);
    const words = decoded.replace(/-/g, " ").trim();
    return [`%${words}%`, `${words}%`, `%${decoded}%`];
}

// ─── Hook ───────────────────────────────────────────────────────────────

interface TopicDetailParams {
    slug?: string;
    board?: string;
    level?: string;
    topicSlug?: string;
}

export function useTopicDetailData({
    slug,
    board,
    level,
    topicSlug,
}: TopicDetailParams) {
    const supabase = createClient();

    const normalizedBoard = board?.toUpperCase() || "";
    const normalizedLevel =
        level === "a-level" ? "A-Level" : level === "gcse" ? "GCSE" : level || "";
    const decodedTopicSlug = topicSlug ? decodeURIComponent(topicSlug) : "";

    const searchPatterns = useMemo(
        () => (topicSlug ? getTopicSearchPatterns(topicSlug) : []),
        [topicSlug]
    );

    const {
        data: queryData,
        isLoading: loading,
        error: queryError,
    } = useQuery({
        queryKey: [
            "topic-detail",
            slug,
            normalizedBoard,
            normalizedLevel,
            decodedTopicSlug,
        ],
        queryFn: async () => {
            if (!slug || !board || !level || !topicSlug) {
                throw new Error("Missing required route parameters");
            }

            // Fetch subject
            const { data: subjectData, error: subjectError } = await supabase
                .from("subjects")
                .select("id, name, icon, color, slug")
                .eq("slug", slug)
                .single();

            if (subjectError || !subjectData) throw new Error("Subject not found");

            const TOPIC_SELECT = `
        id, topic_name, topic_number, canonical_synopsis,
        common_mistakes, exam_tips, key_themes,
        marking_points, likely_command_words, feedback_prompts,
        specification_versions!inner(subject_id, exam_board, applies_to_year_groups)
      `;

            // Try exact match first
            let { data: curriculumData } = await supabase
                .from("spec_topics")
                .select(TOPIC_SELECT)
                .eq("specification_versions.subject_id", subjectData.id)
                .eq("specification_versions.exam_board", normalizedBoard)
                .eq("topic_name", decodedTopicSlug)
                .order("topic_number", { ascending: true, nullsFirst: false });

            // Fallback: slug-based patterns
            if ((!curriculumData || curriculumData.length === 0) && searchPatterns.length > 0) {
                for (const pattern of searchPatterns) {
                    const { data: patternData } = await supabase
                        .from("spec_topics")
                        .select(TOPIC_SELECT)
                        .eq("specification_versions.subject_id", subjectData.id)
                        .eq("specification_versions.exam_board", normalizedBoard)
                        .ilike("topic_name", pattern)
                        .order("topic_number", { ascending: true, nullsFirst: false });

                    if (patternData && patternData.length > 0) {
                        curriculumData = patternData;
                        break;
                    }
                }
            }

            // Fallback: compare slugified names
            if (!curriculumData || curriculumData.length === 0) {
                const { data: allTopics } = await supabase
                    .from("spec_topics")
                    .select(TOPIC_SELECT)
                    .eq("specification_versions.subject_id", subjectData.id)
                    .eq("specification_versions.exam_board", normalizedBoard);

                curriculumData =
                    (allTopics || []).filter(
                        (t: any) => toTopicSlug(t.topic_name) === topicSlug
                    );
            }

            const mappedData = (curriculumData || []).map((t: any) => ({
                id: t.id,
                topic: t.topic_name,
                subtopic: null,
                topic_number: t.topic_number,
                topic_synopsis: t.canonical_synopsis,
                learning_objectives: [] as string[],
                common_mistakes: t.common_mistakes,
                exam_tips: t.exam_tips,
                key_themes: parseKeyTerminology(t.key_themes),
                marking_points: t.marking_points,
                likely_command_words: t.likely_command_words,
                feedback_prompts: t.feedback_prompts,
                discriminator_features: null,
                practical_references: null,
            }));

            if (mappedData.length === 0) throw new Error("Topic not found");

            // Check for study guide
            const { data: guideData } = await supabase
                .from("study_guides")
                .select("slug")
                .ilike("topic_name", mappedData[0].topic)
                .eq("exam_board", normalizedBoard)
                .eq("qualification_level", normalizedLevel)
                .in("status", ["published", "review"])
                .maybeSingle();

            return {
                subject: subjectData as SubjectData,
                topicData: mappedData as TopicData[],
                studyGuideSlug: guideData?.slug || null,
            };
        },
        enabled: Boolean(slug && board && level && topicSlug),
    });

    const subject = queryData?.subject || null;
    const topicData = queryData?.topicData || [];
    const studyGuideSlug = queryData?.studyGuideSlug || null;
    const error =
        queryError instanceof Error
            ? queryError.message
            : queryError
                ? "Failed to load data"
                : null;

    // ─── Derived state ────────────────────────────────────────────────────

    const stats = useMemo<TopicDetailStats>(() => {
        const totalObjectives = topicData.reduce(
            (s, t) => s + t.learning_objectives.length,
            0
        );
        const totalTips = topicData.reduce(
            (s, t) => s + (t.exam_tips?.length || 0),
            0
        );
        const totalMistakes = topicData.reduce(
            (s, t) => s + (t.common_mistakes?.length || 0),
            0
        );
        const totalTerms = topicData.reduce(
            (s, t) => s + (t.key_themes?.length || 0),
            0
        );
        const totalMarkingPoints = topicData.reduce(
            (s, t) => s + (t.marking_points?.length || 0),
            0
        );
        return { totalObjectives, totalTips, totalMistakes, totalTerms, totalMarkingPoints };
    }, [topicData]);

    const allObjectives = useMemo(
        () => topicData.flatMap((t) => t.learning_objectives).filter(isUsefulObjective),
        [topicData]
    );
    const allTips = useMemo(
        () => topicData.flatMap((t) => t.exam_tips || []),
        [topicData]
    );
    const allMistakes = useMemo(
        () => topicData.flatMap((t) => t.common_mistakes || []),
        [topicData]
    );
    const allTerminology = useMemo(
        () => topicData.flatMap((t) => t.key_themes || []),
        [topicData]
    );
    const allMarkingPoints = useMemo(
        () => topicData.flatMap((t) => t.marking_points || []),
        [topicData]
    );
    const allFeedbackPrompts = useMemo(
        () => topicData.flatMap((t) => t.feedback_prompts || []),
        [topicData]
    );
    const allCommandWords = useMemo(() => {
        const words = topicData.flatMap((t) => t.likely_command_words || []);
        return [...new Set(words)];
    }, [topicData]);
    const allPracticals = useMemo(() => {
        const refs = topicData.flatMap((t) => t.practical_references || []);
        return [...new Set(refs)];
    }, [topicData]);
    const synopsis = useMemo(
        () => topicData.find((t) => t.topic_synopsis)?.topic_synopsis || null,
        [topicData]
    );

    return {
        subject,
        topicData,
        loading,
        error,
        studyGuideSlug,
        normalizedBoard,
        normalizedLevel,
        stats,
        allObjectives,
        allTips,
        allMistakes,
        allTerminology,
        allMarkingPoints,
        allFeedbackPrompts,
        allCommandWords,
        allPracticals,
        synopsis,
    };
}
