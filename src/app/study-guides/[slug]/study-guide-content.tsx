"use client";

/**
 * Client component for interactive study guide content.
 * Receives serialized data from the server page component.
 */

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import { MermaidDiagram } from "@/components/MermaidDiagram";
import {
    BookOpen,
    Clock,
    GraduationCap,
    Brain,
    FileText,
    ChevronDown,
    ChevronUp,
    BookMarked,
    Headphones,
    Play,
    Pause,
    ArrowLeft,
    Home,
    ChevronRight,
    Printer,
    Download,
    Link2,
} from "lucide-react";

interface StudyGuideData {
    id: string;
    slug: string;
    topic_name: string;
    exam_board: string;
    qualification_level: string;
    summary: string | null;
    content: string;
    podcast_url: string | null;
    estimated_read_time_mins: number | null;
    subject_name: string | null;
    subject_slug: string | null;
}

interface WorkedExample {
    question?: string;
    answer?: string;
    solution?: string;
    explanation?: string;
    difficulty?: string;
}

interface PracticeQuestion {
    question?: string;
    answer?: string;
    marks?: number;
    hint?: string;
}

interface KeyDefinition {
    term?: string;
    definition?: string;
}

interface RelatedGuide {
    slug: string;
    topic_name: string;
    exam_board: string;
    qualification_level: string;
}

interface SynopticLink {
    related_topic?: string;
    connection?: string;
    exam_relevance?: string;
}

interface Props {
    guide: StudyGuideData;
    workedExamples: WorkedExample[];
    practiceQuestions: PracticeQuestion[];
    keyDefinitions: KeyDefinition[];
    synopticLinks: SynopticLink[];
    relatedGuides: RelatedGuide[];
}

function formatTime(seconds: number): string {
    if (!seconds || !isFinite(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

export function StudyGuideContent({
    guide,
    workedExamples,
    practiceQuestions,
    keyDefinitions,
    synopticLinks,
    relatedGuides,
}: Props) {
    const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(
        new Set()
    );
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioTime, setAudioTime] = useState(0);
    const [audioDuration, setAudioDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const toggleAnswer = (idx: number) => {
        setRevealedAnswers((prev) => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    const toggleAudio = () => {
        if (!guide.podcast_url) return;
        if (!audioRef.current) {
            const audio = new Audio(guide.podcast_url);
            audioRef.current = audio;
            audio.addEventListener("loadedmetadata", () =>
                setAudioDuration(audio.duration)
            );
            audio.addEventListener("timeupdate", () =>
                setAudioTime(audio.currentTime)
            );
            audio.addEventListener("ended", () => setIsPlaying(false));
        }
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const LevelIcon =
        guide.qualification_level === "A-Level" ? GraduationCap : BookOpen;

    return (
        <div className="flex min-h-screen flex-col bg-background">
            {/* Breadcrumb */}
            <nav className="border-b bg-muted/30">
                <div className="container mx-auto flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                    <Link href="/" className="hover:text-foreground">
                        <Home className="h-3.5 w-3.5" />
                    </Link>
                    <span>/</span>
                    <Link href="/study-guides" className="hover:text-foreground">
                        Study Guides
                    </Link>
                    {guide.subject_name && (
                        <>
                            <span>/</span>
                            <Link
                                href={`/study-guides?subject=${guide.subject_slug}`}
                                className="hover:text-foreground"
                            >
                                {guide.subject_name}
                            </Link>
                        </>
                    )}
                    <span>/</span>
                    <span className="max-w-[200px] truncate text-foreground">
                        {guide.topic_name}
                    </span>
                </div>
            </nav>

            {/* Hero */}
            <section className="bg-gradient-to-b from-primary/5 via-primary/[0.02] to-background py-8 md:py-12">
                <div className="container mx-auto px-4">
                    <Link
                        href="/study-guides"
                        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" /> All Guides
                    </Link>

                    <div className="flex items-start gap-4">
                        <div className="shrink-0 rounded-2xl bg-primary/10 p-4">
                            <BookOpen className="h-10 w-10 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="mb-2 text-2xl font-bold md:text-3xl lg:text-4xl">
                                {guide.topic_name}
                            </h1>
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                                    {guide.exam_board}
                                </span>
                                <span className="flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                                    <LevelIcon className="h-3 w-3" />
                                    {guide.qualification_level}
                                </span>
                                {guide.subject_name && (
                                    <Link
                                        href={`/study-guides?subject=${guide.subject_slug}`}
                                        className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20"
                                    >
                                        {guide.subject_name}
                                    </Link>
                                )}
                            </div>
                            {guide.summary && (
                                <p className="max-w-3xl leading-relaxed text-muted-foreground">
                                    {guide.summary}
                                </p>
                            )}
                            {/* Print / Download */}
                            <div className="mt-4 flex gap-2 print:hidden">
                                <button
                                    onClick={() => window.print()}
                                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                    <Printer className="h-3.5 w-3.5" /> Print
                                </button>
                                <button
                                    onClick={() => {
                                        const blob = new Blob([guide.content], { type: 'text/markdown' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `${guide.slug}.md`;
                                        a.click();
                                        URL.revokeObjectURL(url);
                                    }}
                                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                    <Download className="h-3.5 w-3.5" /> Download
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Stats grid */}
                    <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                        <div className="rounded-xl border border-primary/10 bg-card/50 p-4 text-center">
                            <div className="text-2xl font-bold text-primary">
                                {guide.estimated_read_time_mins || "~5"}
                            </div>
                            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" /> Min Read
                            </div>
                        </div>
                        <div className="rounded-xl border border-amber-500/10 bg-card/50 p-4 text-center">
                            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                {workedExamples.length}
                            </div>
                            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                                <FileText className="h-3 w-3" /> Examples
                            </div>
                        </div>
                        <div className="rounded-xl border border-emerald-500/10 bg-card/50 p-4 text-center">
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {practiceQuestions.length}
                            </div>
                            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                                <Brain className="h-3 w-3" /> Questions
                            </div>
                        </div>
                        <div className="rounded-xl border border-blue-500/10 bg-card/50 p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {keyDefinitions.length}
                            </div>
                            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                                <BookMarked className="h-3 w-3" /> Key Terms
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main content */}
            <section className="flex-1 py-8">
                <div className="container mx-auto px-4">
                    <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
                        {/* Left column: main content */}
                        <div className="space-y-6 lg:col-span-2">
                            {/* Podcast player */}
                            {guide.podcast_url && (
                                <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-purple-500/10 p-4">
                                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                                        <Headphones className="h-4 w-4 text-purple-500" />
                                        Listen to this guide
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={toggleAudio}
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isPlaying
                                                ? "bg-purple-500 text-white"
                                                : "bg-purple-500/10 text-purple-500"
                                                }`}
                                        >
                                            {isPlaying ? (
                                                <Pause className="h-4 w-4" />
                                            ) : (
                                                <Play className="ml-0.5 h-4 w-4" />
                                            )}
                                        </button>
                                        <div className="flex-1">
                                            <div
                                                className="h-2 cursor-pointer rounded-full bg-muted"
                                                onClick={(e) => {
                                                    if (!audioRef.current) return;
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    const pct = (e.clientX - rect.left) / rect.width;
                                                    audioRef.current.currentTime = pct * audioDuration;
                                                }}
                                            >
                                                <div
                                                    className="h-full rounded-full bg-purple-500 transition-all"
                                                    style={{
                                                        width: `${audioDuration > 0 ? (audioTime / audioDuration) * 100 : 0}%`,
                                                    }}
                                                />
                                            </div>
                                            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                                                <span>{formatTime(audioTime)}</span>
                                                <span>{formatTime(audioDuration)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Study notes */}
                            <div className="rounded-xl border border-border bg-card p-5">
                                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                    Study Notes
                                </h2>
                                {/* Split content into text + mermaid segments */}
                                {(() => {
                                    const parts = guide.content.split(/(```mermaid[\s\S]*?```)/g);
                                    return parts.map((part, idx) => {
                                        const mermaidMatch = part.match(/^```mermaid\n([\s\S]*?)```$/);
                                        if (mermaidMatch) {
                                            return <MermaidDiagram key={idx} code={mermaidMatch[1]} id={`sg-mermaid-${idx}`} />;
                                        }
                                        if (!part.trim()) return null;
                                        return (
                                            <div
                                                key={idx}
                                                className="prose prose-sm max-w-none dark:prose-invert"
                                                dangerouslySetInnerHTML={{
                                                    __html: part
                                                        .replace(/</g, "&lt;")
                                                        .replace(/>/g, "&gt;")
                                                        .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-6 mb-2">$1</h3>')
                                                        .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-8 mb-3">$1</h2>')
                                                        .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-8 mb-3">$1</h1>')
                                                        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                                                        .replace(/\*(.+?)\*/g, "<em>$1</em>")
                                                        .replace(/\n\n/g, "</p><p>")
                                                        .replace(/\n/g, "<br/>")
                                                        .replace(/^/, "<p>")
                                                        .concat("</p>"),
                                                }}
                                            />
                                        );
                                    });
                                })()}
                            </div>

                            {/* Worked examples */}
                            {workedExamples.length > 0 && (
                                <div
                                    id="worked-examples"
                                    className="rounded-xl border border-amber-500/20 bg-card p-5"
                                >
                                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                                        <FileText className="h-5 w-5 text-amber-500" />
                                        Worked Examples ({workedExamples.length})
                                    </h2>
                                    <div className="space-y-4">
                                        {workedExamples.map((ex, i) => (
                                            <div
                                                key={i}
                                                className="rounded-lg border border-border bg-muted/30 p-4"
                                            >
                                                {ex.question && (
                                                    <p className="mb-2 font-medium">{ex.question}</p>
                                                )}
                                                {ex.difficulty && (
                                                    <span className="mb-2 inline-block rounded px-2 py-0.5 text-[10px] font-medium bg-muted">
                                                        {ex.difficulty}
                                                    </span>
                                                )}
                                                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                    {ex.answer || ex.solution || ex.explanation || ""}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Practice questions */}
                            {practiceQuestions.length > 0 && (
                                <div
                                    id="practice-questions"
                                    className="rounded-xl border border-emerald-500/20 bg-card p-5"
                                >
                                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                                        <Brain className="h-5 w-5 text-emerald-500" />
                                        Practice Questions ({practiceQuestions.length})
                                    </h2>
                                    <div className="space-y-3">
                                        {practiceQuestions.map((pq, i) => (
                                            <div
                                                key={i}
                                                className="rounded-lg border border-border bg-muted/30 p-4"
                                            >
                                                <div className="mb-2 flex items-center justify-between">
                                                    <p className="font-medium text-sm">
                                                        Q{i + 1}. {pq.question}
                                                    </p>
                                                    {pq.marks && (
                                                        <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-[10px] font-bold">
                                                            [{pq.marks} marks]
                                                        </span>
                                                    )}
                                                </div>
                                                {pq.hint && !revealedAnswers.has(i) && (
                                                    <p className="mb-2 text-xs italic text-muted-foreground">
                                                        💡 {pq.hint}
                                                    </p>
                                                )}
                                                <button
                                                    onClick={() => toggleAnswer(i)}
                                                    className="flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                                                >
                                                    {revealedAnswers.has(i) ? (
                                                        <>
                                                            <ChevronUp className="h-3 w-3" /> Hide Answer
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronDown className="h-3 w-3" /> Show Answer
                                                        </>
                                                    )}
                                                </button>
                                                {revealedAnswers.has(i) && pq.answer && (
                                                    <div className="mt-3 rounded-md bg-emerald-500/5 border border-emerald-500/20 p-3 text-sm whitespace-pre-wrap">
                                                        {pq.answer}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Retrieval Cues — active recall prompts */}
                            {keyDefinitions.length > 0 && (
                                <div className="rounded-xl border border-purple-500/20 bg-card p-5">
                                    <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
                                        <Brain className="h-5 w-5 text-purple-500" />
                                        Retrieval Practice
                                    </h2>
                                    <p className="mb-4 text-xs text-muted-foreground">
                                        Cover the answers and test yourself — active recall is the most effective revision technique.
                                    </p>
                                    <div className="space-y-3">
                                        {keyDefinitions.slice(0, 6).map((kd, i) => {
                                            const cueIdx = i + 1000; // offset to avoid collision with practice Q toggles
                                            return (
                                                <div
                                                    key={i}
                                                    className="rounded-lg border border-border bg-muted/30 p-3"
                                                >
                                                    <p className="mb-2 text-sm font-medium">
                                                        Can you explain: <span className="text-primary">{kd.term}</span>?
                                                    </p>
                                                    <button
                                                        onClick={() => toggleAnswer(cueIdx)}
                                                        className="flex items-center gap-1 rounded-md bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-500/20"
                                                    >
                                                        {revealedAnswers.has(cueIdx) ? (
                                                            <><ChevronUp className="h-3 w-3" /> Hide</>
                                                        ) : (
                                                            <><ChevronDown className="h-3 w-3" /> Check Answer</>
                                                        )}
                                                    </button>
                                                    {revealedAnswers.has(cueIdx) && (
                                                        <div className="mt-2 rounded-md border border-purple-500/20 bg-purple-500/5 p-3 text-sm text-muted-foreground">
                                                            {kd.definition}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right column: sidebar */}
                        <div className="space-y-4">
                            {/* In this guide nav */}
                            <div className="rounded-xl border border-border bg-card p-4 lg:sticky lg:top-4">
                                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                                    <FileText className="h-4 w-4 text-primary" />
                                    In this Guide
                                </h3>
                                <nav className="space-y-1">
                                    {[
                                        { label: "Study Notes", show: true },
                                        guide.podcast_url && { label: "🎙 Podcast", show: true },
                                        workedExamples.length > 0 && {
                                            label: `Worked Examples (${workedExamples.length})`,
                                            href: "#worked-examples",
                                        },
                                        practiceQuestions.length > 0 && {
                                            label: `Practice Questions (${practiceQuestions.length})`,
                                            href: "#practice-questions",
                                        },
                                        keyDefinitions.length > 0 && {
                                            label: `Key Terms (${keyDefinitions.length})`,
                                            href: "#key-terms",
                                        },
                                    ]
                                        .filter(Boolean)
                                        .map((nav: any, i) => (
                                            <a
                                                key={i}
                                                href={nav.href || "#"}
                                                className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                            >
                                                {nav.label}
                                            </a>
                                        ))}
                                </nav>
                            </div>

                            {/* Key terms */}
                            {keyDefinitions.length > 0 && (
                                <div
                                    id="key-terms"
                                    className="rounded-xl border border-blue-500/20 bg-card p-4"
                                >
                                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                                        <BookMarked className="h-4 w-4 text-blue-500" />
                                        Key Terms ({keyDefinitions.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {keyDefinitions.map((kd, i) => (
                                            <div key={i} className="text-sm">
                                                <dt className="font-medium">{kd.term}</dt>
                                                <dd className="text-muted-foreground">
                                                    {kd.definition}
                                                </dd>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Related Guides */}
                            {relatedGuides.length > 0 && (
                                <div className="rounded-xl border border-border bg-card p-4">
                                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                                        <BookOpen className="h-4 w-4 text-primary" />
                                        Related Guides
                                    </h3>
                                    <div className="space-y-1">
                                        {relatedGuides.map((rg) => (
                                            <Link
                                                key={rg.slug}
                                                href={`/study-guides/${rg.slug}`}
                                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted/60 transition-colors"
                                            >
                                                <span className="min-w-0 flex-1 truncate">{rg.topic_name}</span>
                                                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Synoptic Links */}
                            {synopticLinks.length > 0 && (
                                <div className="rounded-xl border border-cyan-500/20 bg-card p-4">
                                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-700 dark:text-cyan-300">
                                        <Link2 className="h-4 w-4" />
                                        Synoptic Links
                                    </h3>
                                    <p className="mb-3 text-xs text-muted-foreground">
                                        Cross-topic connections for deeper understanding
                                    </p>
                                    <div className="space-y-2">
                                        {synopticLinks.map((link, idx) => (
                                            <div key={idx} className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
                                                <Link
                                                    href={`/study-guides?search=${encodeURIComponent(link.related_topic || '')}`}
                                                    className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                                                >
                                                    <Link2 className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
                                                    {link.related_topic}
                                                </Link>
                                                {link.connection && (
                                                    <p className="text-xs text-muted-foreground">{link.connection}</p>
                                                )}
                                                {link.exam_relevance && (
                                                    <p className="text-xs text-cyan-700 dark:text-cyan-300 italic">
                                                        📝 {link.exam_relevance}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Subject link */}
                            {guide.subject_slug && (
                                <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-4">
                                    <p className="mb-2 text-sm font-medium">
                                        Explore more {guide.subject_name}
                                    </p>
                                    <Link
                                        href={`/subjects/${guide.subject_slug}`}
                                        className="block rounded-lg border border-border bg-background px-3 py-2 text-center text-sm font-medium hover:bg-muted"
                                    >
                                        All {guide.subject_name} Topics
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
