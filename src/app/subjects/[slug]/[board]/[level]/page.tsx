"use client";

/**
 * Subject Specification page — full topic tree for a subject/board/level.
 * Shows topics grouped by main heading, with search and component filtering.
 * Each topic links to its TopicDetail page.
 *
 * Route: /subjects/[slug]/[board]/[level]
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toTopicSlug } from "@/hooks/useTopicDetailData";
import {
    BookOpen,
    GraduationCap,
    Search,
    Loader2,
    ChevronDown,
    ChevronRight,
    Target,
    Lightbulb,
    AlertTriangle,
    Home,
    ArrowLeft,
    FileText,
} from "lucide-react";

const BOARD_COLORS: Record<string, string> = {
    AQA: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    EDEXCEL: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    OCR: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    WJEC: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    CAIE: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};

interface SpecTopic {
    id: string;
    topic_name: string;
    topic_number: string | null;
    canonical_synopsis: string | null;
    exam_tips: string[] | null;
    common_mistakes: string[] | null;
}

interface MainTopicGroup {
    topic: string;
    count: number;
    synopsis: string | null;
    tips: number;
    mistakes: number;
}

export default function SubjectSpecificationPage() {
    const params = useParams();
    const slug = params.slug as string;
    const board = params.board as string;
    const level = params.level as string;
    const supabase = createClient();

    const [searchQuery, setSearchQuery] = useState("");
    const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

    const normalizedBoard = board?.toUpperCase() || "";
    const normalizedLevel =
        level === "a-level" ? "A-Level" : level === "gcse" ? "GCSE" : level || "";

    const { data, isLoading, error } = useQuery({
        queryKey: ["specification", slug, normalizedBoard, normalizedLevel],
        queryFn: async () => {
            // Fetch subject
            const { data: subject, error: subErr } = await supabase
                .from("subjects")
                .select("id, name, icon, color, slug")
                .eq("slug", slug)
                .single();

            if (subErr || !subject) throw new Error("Subject not found");

            // Fetch spec_topics for this subject+board
            const { data: topics, error: topicErr } = await supabase
                .from("spec_topics")
                .select(
                    `id, topic_name, topic_number, canonical_synopsis,
           exam_tips, common_mistakes,
           specification_versions!inner(subject_id, exam_board)`
                )
                .eq("specification_versions.subject_id", subject.id)
                .eq("specification_versions.exam_board", normalizedBoard)
                .order("topic_number", { ascending: true, nullsFirst: false });

            if (topicErr) throw new Error("Failed to load specification");

            // Count study guides
            const { count } = await supabase
                .from("study_guides")
                .select("id", { count: "exact", head: true })
                .eq("subject_id", subject.id)
                .eq("exam_board", normalizedBoard)
                .eq("qualification_level", normalizedLevel)
                .in("status", ["published", "review"]);

            return {
                subject,
                topics: (topics || []) as unknown as SpecTopic[],
                studyGuideCount: count || 0,
            };
        },
        enabled: Boolean(slug && board && level),
    });

    const subject = data?.subject;
    const topics = data?.topics || [];
    const studyGuideCount = data?.studyGuideCount || 0;

    // Group topics by name
    const mainTopics = useMemo<MainTopicGroup[]>(() => {
        const groups = new Map<string, MainTopicGroup>();
        topics.forEach((t) => {
            const key = t.topic_name;
            if (!groups.has(key)) {
                groups.set(key, {
                    topic: key,
                    count: 0,
                    synopsis: null,
                    tips: 0,
                    mistakes: 0,
                });
            }
            const g = groups.get(key)!;
            g.count++;
            g.tips += t.exam_tips?.length || 0;
            g.mistakes += t.common_mistakes?.length || 0;
            if (!g.synopsis && t.canonical_synopsis) g.synopsis = t.canonical_synopsis;
        });
        return Array.from(groups.values());
    }, [topics]);

    // Filter
    const filteredTopics = useMemo(() => {
        if (!searchQuery.trim()) return mainTopics;
        const q = searchQuery.toLowerCase();
        return mainTopics.filter(
            (t) =>
                t.topic.toLowerCase().includes(q) ||
                t.synopsis?.toLowerCase().includes(q)
        );
    }, [mainTopics, searchQuery]);

    // Stats
    const totalTips = topics.reduce((s, t) => s + (t.exam_tips?.length || 0), 0);
    const totalMistakes = topics.reduce(
        (s, t) => s + (t.common_mistakes?.length || 0),
        0
    );

    const toggleExpand = (key: string) => {
        setExpandedTopics((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const LevelIcon = normalizedLevel === "A-Level" ? GraduationCap : BookOpen;

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !subject) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
                <p className="mb-4 text-muted-foreground">
                    {error instanceof Error ? error.message : "Content not found"}
                </p>
                <Link
                    href="/subjects"
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                    View All Subjects
                </Link>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-background">
            {/* Breadcrumb */}
            <nav className="border-b bg-muted/30">
                <div className="container mx-auto flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                    <Link href="/" className="hover:text-foreground"><Home className="h-3.5 w-3.5" /></Link>
                    <span>/</span>
                    <Link href="/subjects" className="hover:text-foreground">Subjects</Link>
                    <span>/</span>
                    <Link href={`/subjects/${slug}`} className="hover:text-foreground">{subject.name}</Link>
                    <span>/</span>
                    <span className="text-foreground">{normalizedBoard} {normalizedLevel}</span>
                </div>
            </nav>

            {/* Hero */}
            <section className="bg-gradient-to-b from-primary/5 to-background py-8 md:py-12">
                <div className="container mx-auto px-4">
                    <Link
                        href={`/subjects/${slug}`}
                        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to {subject.name}
                    </Link>

                    <div className="flex items-start gap-4 mb-6">
                        <div className="shrink-0 rounded-2xl bg-primary/10 p-4">
                            <BookOpen className="h-10 w-10 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="mb-2 text-2xl font-bold md:text-3xl">
                                {subject.name} Specification
                            </h1>
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${BOARD_COLORS[normalizedBoard] || "bg-muted"}`}>
                                    {normalizedBoard}
                                </span>
                                <span className="flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                                    <LevelIcon className="h-3 w-3" />
                                    {normalizedLevel}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <div className="rounded-xl border border-border bg-card/50 p-4 text-center">
                            <div className="text-2xl font-bold text-primary">{mainTopics.length}</div>
                            <div className="text-xs text-muted-foreground">Topics</div>
                        </div>
                        <div className="rounded-xl border border-border bg-card/50 p-4 text-center">
                            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{totalTips}</div>
                            <div className="text-xs text-muted-foreground">Exam Tips</div>
                        </div>
                        <div className="rounded-xl border border-border bg-card/50 p-4 text-center">
                            <div className="text-2xl font-bold text-destructive">{totalMistakes}</div>
                            <div className="text-xs text-muted-foreground">Pitfalls</div>
                        </div>
                        <div className="rounded-xl border border-border bg-card/50 p-4 text-center">
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{studyGuideCount}</div>
                            <div className="text-xs text-muted-foreground">Study Guides</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Search + Topic List */}
            <section className="flex-1 py-8">
                <div className="container mx-auto px-4">
                    {/* Search */}
                    <div className="relative mb-6 max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            placeholder="Search topics..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>

                    {filteredTopics.length === 0 ? (
                        <div className="py-12 text-center">
                            <Target className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                            <p className="text-lg font-medium">No topics found</p>
                            <p className="text-sm text-muted-foreground">Try adjusting your search</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredTopics.map((topic) => (
                                <div key={topic.topic} className="rounded-xl border border-border bg-card">
                                    {/* Topic header — expandable */}
                                    <button
                                        onClick={() => toggleExpand(topic.topic)}
                                        className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/30"
                                    >
                                        {expandedTopics.has(topic.topic) ? (
                                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold text-sm">{topic.topic}</h3>
                                            {topic.synopsis && (
                                                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                                                    {topic.synopsis}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {topic.tips > 0 && (
                                                <span className="flex items-center gap-0.5 text-[10px] text-yellow-600 dark:text-yellow-400">
                                                    <Lightbulb className="h-3 w-3" /> {topic.tips}
                                                </span>
                                            )}
                                            {topic.mistakes > 0 && (
                                                <span className="flex items-center gap-0.5 text-[10px] text-destructive">
                                                    <AlertTriangle className="h-3 w-3" /> {topic.mistakes}
                                                </span>
                                            )}
                                        </div>
                                    </button>

                                    {/* Expanded content */}
                                    {expandedTopics.has(topic.topic) && (
                                        <div className="border-t border-border px-4 py-3">
                                            {topic.synopsis && (
                                                <p className="mb-3 text-sm text-muted-foreground">{topic.synopsis}</p>
                                            )}
                                            <Link
                                                href={`/subjects/${slug}/${board}/${level}/${toTopicSlug(topic.topic)}`}
                                                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                                            >
                                                <FileText className="h-4 w-4" />
                                                View Topic Details
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* CTA */}
            <section className="border-t bg-gradient-to-b from-primary/5 to-background py-8">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="mb-2 text-xl font-bold">Ready to start practising?</h2>
                    <p className="mb-4 text-sm text-muted-foreground">
                        AI quiz questions, exam practice, and study guides for {subject.name} {normalizedBoard} {normalizedLevel}
                    </p>
                    <Link
                        href="/auth"
                        className="inline-block rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        Start Free
                    </Link>
                </div>
            </section>
        </div>
    );
}
