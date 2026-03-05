"use client";

/**
 * Topic Detail page — the central hub for a specific topic.
 * Shows learning objectives, exam tips, common mistakes, key terminology,
 * marking points, command words, practical links, and a study guide CTA.
 *
 * Route: /subjects/[slug]/[board]/[level]/[topicSlug]
 */

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTopicDetailData, toTopicSlug } from "@/hooks/useTopicDetailData";
import {
    BookOpen,
    GraduationCap,
    Target,
    Check,
    MessageSquare,
    Sparkles,
    ClipboardList,
    Lightbulb,
    AlertTriangle,
    X,
    ChevronRight,
    BookMarked,
    FlaskConical,
    Loader2,
    Home,
    ArrowLeft,
} from "lucide-react";

const BOARD_COLORS: Record<string, string> = {
    AQA: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    EDEXCEL: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    OCR: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    WJEC: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    CAIE: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    CIE: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};

export default function TopicDetailPage() {
    const params = useParams();
    const router = useRouter();

    const slug = params.slug as string;
    const board = params.board as string;
    const level = params.level as string;
    const topicSlug = params.topicSlug as string;

    const {
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
    } = useTopicDetailData({ slug, board, level, topicSlug });

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !subject || topicData.length === 0) {
        return (
            <div className="flex min-h-screen flex-col bg-background">
                <div className="flex flex-1 items-center justify-center p-4">
                    <div className="max-w-md space-y-4 rounded-xl border border-border bg-card p-6 text-center">
                        <p className="text-muted-foreground">{error || "Topic not found"}</p>
                        <Link
                            href={`/subjects/${slug}/${board}/${level}`}
                            className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                        >
                            View Specification
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const mainTopic = topicData[0];
    const LevelIcon = normalizedLevel === "A-Level" ? GraduationCap : BookOpen;

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
                    <Link href={`/subjects/${slug}/${board}/${level}`} className="hover:text-foreground">
                        {normalizedBoard} {normalizedLevel}
                    </Link>
                    <span>/</span>
                    <span className="max-w-[200px] truncate text-foreground">{mainTopic.topic}</span>
                </div>
            </nav>

            {/* Hero */}
            <section className="bg-gradient-to-b from-primary/5 to-background py-8 md:py-12">
                <div className="container mx-auto px-4">
                    <Link
                        href={`/subjects/${slug}/${board}/${level}`}
                        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to Specification
                    </Link>

                    <div className="flex items-start gap-4 mb-6">
                        <div className="shrink-0 rounded-2xl bg-primary/10 p-4">
                            <BookOpen className="h-10 w-10 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h1 className="text-2xl font-bold md:text-3xl">{mainTopic.topic}</h1>
                                <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${BOARD_COLORS[normalizedBoard] || "bg-muted"}`}>
                                    {normalizedBoard}
                                </span>
                                <span className="flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                                    <LevelIcon className="h-3 w-3" />
                                    {normalizedLevel}
                                </span>
                            </div>
                            {synopsis && (
                                <p className="max-w-3xl text-muted-foreground">{synopsis}</p>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                        {[
                            { label: "Objectives", value: stats.totalObjectives, color: "text-primary" },
                            { label: "Exam Tips", value: stats.totalTips, color: "text-yellow-600 dark:text-yellow-400" },
                            { label: "Pitfalls", value: stats.totalMistakes, color: "text-destructive" },
                            { label: "Key Terms", value: stats.totalTerms, color: "text-blue-600 dark:text-blue-400" },
                            { label: "Mark Points", value: stats.totalMarkingPoints, color: "text-green-600 dark:text-green-400" },
                        ].map((s) => (
                            <div key={s.label} className="rounded-xl border border-border bg-card/50 p-4 text-center">
                                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                                <div className="text-xs text-muted-foreground">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Subtopics */}
            {topicData.length > 1 && (
                <section className="border-b py-6">
                    <div className="container mx-auto px-4">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                            <Target className="h-5 w-5 text-primary" />
                            Subtopics
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {topicData.map((t, i) => (
                                <span key={i} className="rounded-md bg-muted px-2.5 py-1 text-sm font-medium">
                                    {t.subtopic || t.topic}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Main Grid */}
            <section className="flex-1 py-8">
                <div className="container mx-auto px-4">
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Left column */}
                        <div className="space-y-6 lg:col-span-2">
                            {/* Learning Objectives */}
                            {allObjectives.length > 0 && (
                                <div className="rounded-xl border border-border bg-card p-5">
                                    <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
                                        <Target className="h-5 w-5 text-primary" />
                                        Learning Objectives
                                    </h2>
                                    <p className="mb-4 text-sm text-muted-foreground">What you need to know and understand</p>
                                    <ul className="space-y-2">
                                        {allObjectives.map((obj, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm">
                                                <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                                                <span>{obj}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Marking Points (fallback if no objectives) */}
                            {allObjectives.length === 0 && allMarkingPoints.length > 0 && (
                                <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-5">
                                    <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-green-700 dark:text-green-300">
                                        <ClipboardList className="h-5 w-5" />
                                        What You Need to Demonstrate
                                    </h2>
                                    <p className="mb-4 text-sm text-muted-foreground">Key skills and knowledge for this topic</p>
                                    <ul className="space-y-2">
                                        {allMarkingPoints.slice(0, 8).map((p, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm">
                                                <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                                                <span>{p}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Examiner Feedback */}
                            {allFeedbackPrompts.length > 0 && (
                                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-5">
                                    <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-indigo-700 dark:text-indigo-300">
                                        <MessageSquare className="h-5 w-5" />
                                        Example Examiner Feedback
                                    </h2>
                                    <p className="mb-4 text-sm text-muted-foreground">Real feedback patterns examiners use when marking</p>
                                    <ul className="space-y-3">
                                        {allFeedbackPrompts.map((f, i) => (
                                            <li key={i} className="rounded-lg bg-indigo-500/10 p-3 text-sm italic">
                                                &ldquo;{f}&rdquo;
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Marking Points (when objectives exist) */}
                            {allObjectives.length > 0 && allMarkingPoints.length > 0 && (
                                <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-5">
                                    <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-green-700 dark:text-green-300">
                                        <ClipboardList className="h-5 w-5" />
                                        Marking Points
                                    </h2>
                                    <p className="mb-4 text-sm text-muted-foreground">Key points examiners look for in your answers</p>
                                    <ul className="space-y-2">
                                        {allMarkingPoints.map((p, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm">
                                                <Sparkles className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400 mt-0.5" />
                                                <span>{p}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Exam Tips */}
                            {allTips.length > 0 && (
                                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5">
                                    <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-yellow-700 dark:text-yellow-300">
                                        <Lightbulb className="h-5 w-5" />
                                        Examiner Tips
                                    </h2>
                                    <p className="mb-4 text-sm text-muted-foreground">Expert advice for maximising your marks</p>
                                    <ul className="space-y-3">
                                        {allTips.map((tip, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm">
                                                <span className="shrink-0 text-yellow-600 dark:text-yellow-400 font-bold">💡</span>
                                                <span>{tip}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Common Mistakes */}
                            {allMistakes.length > 0 && (
                                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
                                    <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-destructive">
                                        <AlertTriangle className="h-5 w-5" />
                                        Common Mistakes
                                    </h2>
                                    <p className="mb-4 text-sm text-muted-foreground">Pitfalls to avoid in your exam answers</p>
                                    <ul className="space-y-3">
                                        {allMistakes.map((m, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm">
                                                <X className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
                                                <span>{m}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Right column — sidebar */}
                        <div className="space-y-6">
                            {/* Study Guide CTA */}
                            {studyGuideSlug && (
                                <div className="group relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-5 shadow-sm">
                                    <div className="absolute -mr-12 -mt-12 right-0 top-0 h-24 w-24 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors" />
                                    <h3 className="mb-1 flex items-center gap-2 font-semibold text-primary">
                                        <BookOpen className="h-5 w-5" />
                                        Study Guide Available
                                    </h3>
                                    <p className="mb-3 text-sm text-muted-foreground">
                                        Comprehensive revision notes & examples
                                    </p>
                                    <Link
                                        href={`/study-guides/${studyGuideSlug}`}
                                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                                    >
                                        Read Study Guide <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            )}

                            {/* Key Terminology */}
                            {allTerminology.length > 0 && (
                                <div className="rounded-xl border border-border bg-card p-5">
                                    <h3 className="mb-1 flex items-center gap-2 font-semibold">
                                        <BookMarked className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        Key Terminology
                                    </h3>
                                    <p className="mb-3 text-sm text-muted-foreground">Essential terms to know</p>
                                    {allTerminology.some((t) => t.definition) ? (
                                        <dl className="space-y-3">
                                            {allTerminology.map((t, i) => (
                                                <div key={i} className="text-sm">
                                                    <dt className="font-medium">{t.term}</dt>
                                                    {t.definition && (
                                                        <dd className="mt-0.5 text-muted-foreground">{t.definition}</dd>
                                                    )}
                                                </div>
                                            ))}
                                        </dl>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {allTerminology.map((t, i) => (
                                                <span key={i} className="rounded-md bg-muted px-2.5 py-1 text-sm font-medium">
                                                    {t.term}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Command Words */}
                            {allCommandWords.length > 0 && (
                                <div className="rounded-xl border border-border bg-card p-5">
                                    <h3 className="mb-1 flex items-center gap-2 font-semibold">
                                        <MessageSquare className="h-5 w-5 text-primary" />
                                        Likely Command Words
                                    </h3>
                                    <p className="mb-3 text-sm text-muted-foreground">
                                        How questions on this topic are typically asked
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {allCommandWords.map((w, i) => (
                                            <span key={i} className="rounded-md border border-border bg-muted px-2.5 py-1 text-sm capitalize">
                                                {w}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Practical References */}
                            {allPracticals.length > 0 && (
                                <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-5">
                                    <h3 className="mb-1 flex items-center gap-2 font-semibold text-purple-700 dark:text-purple-300">
                                        <FlaskConical className="h-5 w-5" />
                                        Practical Links
                                    </h3>
                                    <p className="mb-3 text-sm text-muted-foreground">Related required practicals</p>
                                    <ul className="space-y-2">
                                        {allPracticals.map((r, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm">
                                                <span className="text-purple-600 dark:text-purple-400">•</span>
                                                {r}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Quiz CTA */}
                            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-center">
                                <h3 className="mb-1 font-semibold">Ready to test yourself?</h3>
                                <p className="mb-3 text-sm text-muted-foreground">Practice questions tailored to this topic</p>
                                <Link
                                    href={`/quiz/new?subject=${subject.id}&name=${encodeURIComponent(mainTopic.topic)}&curriculum=${mainTopic.id}&count=10`}
                                    className="inline-block w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                                >
                                    Start Practising
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
