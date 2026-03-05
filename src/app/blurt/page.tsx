"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useSubscription } from "@/contexts/subscription-context";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
    ArrowLeft,
    Mic,
    MicOff,
    Send,
    Loader2,
    Clock,
    Brain,
    Check,
    X,
    Target,
    BookOpen,
    Sparkles,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

type BlurtPhase = "intro" | "recording" | "analyzing" | "results";

interface BlurtAnalysis {
    organized_knowledge: {
        main_concepts: string[];
        details: { concept: string; points: string[] }[];
        connections_made?: string[];
    };
    coverage_percentage: number;
    covered_objectives: string[];
    missed_objectives: string[];
    partial_objectives?: { objective: string; missing: string }[];
    strengths: string[];
    gaps_identified: string[];
    ai_feedback: string;
}

const ANALYZING_TIPS = [
    "Reviewing your knowledge coverage...",
    "Checking against learning objectives...",
    "Identifying strengths and gaps...",
    "Generating personalised feedback...",
];

function BlurtContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuth();
    const { hasAccess, loading: subLoading } = useSubscription();
    const supabase = createClient();

    const topicTitle = searchParams.get("topicTitle") || "";
    const subjectId = searchParams.get("subjectId") || undefined;
    const subjectName = searchParams.get("subjectName") || "";
    const curriculumContentId =
        searchParams.get("curriculumContentId") || undefined;

    const [phase, setPhase] = useState<BlurtPhase>("intro");
    const [inputMode, setInputMode] = useState<"voice" | "type">("type");
    const [typedContent, setTypedContent] = useState("");
    const [duration, setDuration] = useState(0);
    const [analysis, setAnalysis] = useState<BlurtAnalysis | null>(null);
    const [learningObjectives, setLearningObjectives] = useState<string[]>([]);
    const [showObjectives, setShowObjectives] = useState(false);
    const [analyzingTip, setAnalyzingTip] = useState(0);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number>(0);

    useEffect(() => {
        if (!authLoading && !user) router.replace("/auth");
    }, [authLoading, user, router]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Fetch learning objectives
    useEffect(() => {
        if (!curriculumContentId) return;
        const fetchObjectives = async () => {
            const { data } = await supabase
                .from("spec_topics")
                .select("learning_objectives")
                .eq("curriculum_content_id", curriculumContentId)
                .maybeSingle();
            if (data?.learning_objectives) {
                const objs = Array.isArray(data.learning_objectives)
                    ? data.learning_objectives
                    : typeof data.learning_objectives === "string"
                        ? data.learning_objectives.split("\n").filter(Boolean)
                        : [];
                setLearningObjectives(objs as string[]);
            }
        };
        fetchObjectives();
    }, [curriculumContentId, supabase]);

    // Rotate analyzing tips
    useEffect(() => {
        if (phase !== "analyzing") return;
        const iv = setInterval(
            () => setAnalyzingTip((t) => (t + 1) % ANALYZING_TIPS.length),
            2500
        );
        return () => clearInterval(iv);
    }, [phase]);

    // Check subscription
    if (!subLoading && !hasAccess("blurt")) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <div className="w-full max-w-md">
                    <Link
                        href="/dashboard"
                        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Link>
                    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6 text-center">
                        <Mic className="mx-auto mb-3 h-12 w-12 text-primary/50" />
                        <h2 className="mb-2 text-lg font-semibold">
                            Blurt Challenge requires Pro
                        </h2>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Upgrade to Pro or Premium to access AI-powered knowledge
                            elicitation.
                        </p>
                        <Link
                            href="/subscription"
                            className="inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
                        >
                            View Plans
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!topicTitle) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <div className="rounded-xl border border-border bg-card p-8 text-center">
                    <p className="mb-4 text-muted-foreground">No topic selected</p>
                    <Link
                        href="/dashboard"
                        className="inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
                    >
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const formatDuration = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const handleStart = () => {
        setTypedContent("");
        setDuration(0);
        setPhase("recording");
        startTimeRef.current = Date.now();
        timerRef.current = setInterval(() => {
            setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);
    };

    const handleSubmit = async () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        if (!typedContent.trim()) {
            toast.error("Please enter some content.");
            setPhase("intro");
            return;
        }

        setPhase("analyzing");

        try {
            const res = await fetch("/api/ai/blurt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topicName: topicTitle,
                    studentResponse: typedContent,
                    learningObjectives,
                    subject: subjectName,
                    yearGroup: undefined,
                }),
            });

            if (!res.ok) throw new Error(`API error: ${res.status}`);
            const data = await res.json();
            setAnalysis(data);
            setPhase("results");
        } catch (err) {
            console.error("Analysis error:", err);
            toast.error("Failed to analyze your blurt. Please try again.");
            setPhase("intro");
        }
    };

    const handleTryAgain = () => {
        setTypedContent("");
        setAnalysis(null);
        setDuration(0);
        setPhase("intro");
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
                <div className="container flex items-center gap-4 px-4 py-3">
                    <Link
                        href="/dashboard"
                        className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="font-semibold">Blurt Challenge</h1>
                        <p className="text-sm text-muted-foreground">{topicTitle}</p>
                    </div>
                </div>
            </header>

            <main className="container mx-auto max-w-2xl px-4 py-6">
                {/* Intro */}
                {phase === "intro" && (
                    <div className="space-y-6">
                        <div className="rounded-xl border border-border bg-card p-6 text-center">
                            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary/10 p-4">
                                <Brain className="h-full w-full text-primary" />
                            </div>
                            <h2 className="mb-2 text-xl font-bold">
                                Ready to blurt about {topicTitle}?
                            </h2>
                            <p className="mb-6 text-sm text-muted-foreground">
                                Type everything you know about this topic. Don't worry about
                                accuracy — just get it all out! Our AI will then analyze your
                                knowledge.
                            </p>

                            {/* Learning objectives preview */}
                            {learningObjectives.length > 0 && (
                                <div className="mb-6 text-left">
                                    <button
                                        onClick={() => setShowObjectives(!showObjectives)}
                                        className="flex w-full items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5 text-sm font-medium hover:bg-muted"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Target className="h-4 w-4 text-primary" />
                                            {learningObjectives.length} Learning Objectives
                                        </span>
                                        {showObjectives ? (
                                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </button>
                                    {showObjectives && (
                                        <ul className="mt-2 space-y-1.5 px-4 text-xs text-muted-foreground">
                                            {learningObjectives.map((obj, i) => (
                                                <li key={i} className="flex gap-2">
                                                    <span className="mt-0.5 shrink-0 text-primary">•</span>
                                                    <span>{String(obj)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={handleStart}
                                className="rounded-lg bg-primary px-8 py-3 font-medium text-primary-foreground hover:bg-primary/90"
                            >
                                Start Blurt Challenge
                            </button>
                        </div>
                    </div>
                )}

                {/* Recording (typing) */}
                {phase === "recording" && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">
                                Blurt about: {topicTitle}
                            </h2>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground">
                                    {typedContent.trim().split(/\s+/).filter(Boolean).length} words
                                </span>
                                <span className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1 text-sm font-mono">
                                    <Clock className="h-4 w-4" />
                                    {formatDuration(duration)}
                                </span>
                            </div>
                        </div>
                        <textarea
                            value={typedContent}
                            onChange={(e) => setTypedContent(e.target.value)}
                            placeholder="Type everything you know about this topic..."
                            className="min-h-[300px] w-full resize-none rounded-xl border border-border bg-background p-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            autoFocus
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={!typedContent.trim()}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-medium text-primary-foreground disabled:opacity-50"
                        >
                            <Send className="h-4 w-4" />
                            Submit for Analysis
                        </button>
                    </div>
                )}

                {/* Analyzing */}
                {phase === "analyzing" && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                            <Brain className="relative h-14 w-14 animate-pulse text-primary" />
                        </div>
                        <h2 className="mb-2 text-lg font-semibold">
                            Analyzing your knowledge...
                        </h2>
                        <p className="mb-4 text-sm text-muted-foreground transition-all">
                            {ANALYZING_TIPS[analyzingTip]}
                        </p>
                        <div className="w-full max-w-xs space-y-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-3 rounded bg-muted animate-pulse"
                                    style={{ width: `${80 - i * 15}%`, animationDelay: `${i * 200}ms` }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Results */}
                {phase === "results" && analysis && (
                    <div className="space-y-6">
                        {/* Coverage score with visual ring */}
                        <div className="rounded-xl border border-border bg-card p-6 text-center">
                            <p className="mb-2 text-sm text-muted-foreground">Coverage Score</p>
                            <div className="relative mx-auto mb-3 h-28 w-28">
                                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
                                    <circle
                                        cx="50" cy="50" r="42" fill="none" strokeWidth="8" strokeLinecap="round"
                                        strokeDasharray={`${analysis.coverage_percentage * 2.64} 264`}
                                        className={analysis.coverage_percentage >= 70 ? "text-green-500" : analysis.coverage_percentage >= 40 ? "text-yellow-500" : "text-red-500"}
                                    />
                                </svg>
                                <span className={`absolute inset-0 flex items-center justify-center text-3xl font-bold ${analysis.coverage_percentage >= 70 ? "text-green-500" : analysis.coverage_percentage >= 40 ? "text-yellow-500" : "text-red-500"
                                    }`}>
                                    {analysis.coverage_percentage}%
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {typedContent.trim().split(/\s+/).filter(Boolean).length} words in {formatDuration(duration)}
                            </p>
                        </div>

                        {/* Covered objectives */}
                        {analysis.covered_objectives.length > 0 && (
                            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-5">
                                <h3 className="mb-3 flex items-center gap-2 font-semibold text-green-600">
                                    <Check className="h-4 w-4" />
                                    Covered ({analysis.covered_objectives.length})
                                </h3>
                                <ul className="space-y-1.5 text-sm">
                                    {analysis.covered_objectives.map((o, i) => (
                                        <li key={i} className="flex gap-2">
                                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                                            <span>{o}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Missed objectives */}
                        {analysis.missed_objectives.length > 0 && (
                            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
                                <h3 className="mb-3 flex items-center gap-2 font-semibold text-red-600">
                                    <X className="h-4 w-4" />
                                    Missed ({analysis.missed_objectives.length})
                                </h3>
                                <ul className="space-y-1.5 text-sm">
                                    {analysis.missed_objectives.map((o, i) => (
                                        <li key={i} className="flex gap-2">
                                            <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                                            <span>{o}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Partial objectives */}
                        {analysis.partial_objectives && analysis.partial_objectives.length > 0 && (
                            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5">
                                <h3 className="mb-3 flex items-center gap-2 font-semibold text-yellow-600">
                                    <Target className="h-4 w-4" />
                                    Partially Covered ({analysis.partial_objectives.length})
                                </h3>
                                <div className="space-y-2 text-sm">
                                    {analysis.partial_objectives.map((po, i) => (
                                        <div key={i} className="rounded-lg bg-background/50 p-3">
                                            <p className="font-medium">{po.objective}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">Missing: {po.missing}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Organized knowledge */}
                        {analysis.organized_knowledge?.details?.length > 0 && (
                            <div className="rounded-xl border border-border bg-card p-5">
                                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                                    <BookOpen className="h-4 w-4 text-primary" />
                                    Your Knowledge Map
                                </h3>
                                <div className="space-y-3">
                                    {analysis.organized_knowledge.details.map((d, i) => (
                                        <div key={i}>
                                            <p className="mb-1 text-sm font-medium">{d.concept}</p>
                                            <ul className="space-y-0.5 pl-4 text-xs text-muted-foreground">
                                                {d.points.map((p, j) => (
                                                    <li key={j}>• {p}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                                {analysis.organized_knowledge.connections_made &&
                                    analysis.organized_knowledge.connections_made.length > 0 && (
                                        <div className="mt-4 border-t border-border pt-3">
                                            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
                                                <Sparkles className="h-3.5 w-3.5 text-primary" />
                                                Connections Made
                                            </h4>
                                            <ul className="space-y-1 text-xs text-muted-foreground">
                                                {analysis.organized_knowledge.connections_made.map((c, i) => (
                                                    <li key={i}>🔗 {c}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                            </div>
                        )}

                        {/* Strengths */}
                        {analysis.strengths.length > 0 && (
                            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-5">
                                <h3 className="mb-3 font-semibold text-green-600">
                                    ✅ Strengths
                                </h3>
                                <ul className="space-y-1.5 text-sm">
                                    {analysis.strengths.map((s, i) => (
                                        <li key={i}>{s}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Gaps */}
                        {analysis.gaps_identified.length > 0 && (
                            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
                                <h3 className="mb-3 font-semibold text-red-600">
                                    📌 Gaps to Fill
                                </h3>
                                <ul className="space-y-1.5 text-sm">
                                    {analysis.gaps_identified.map((g, i) => (
                                        <li key={i}>{g}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* AI Feedback */}
                        {analysis.ai_feedback && (
                            <div className="rounded-xl border border-border bg-card p-5">
                                <h3 className="mb-2 font-semibold">💡 AI Feedback</h3>
                                <p className="text-sm text-muted-foreground">
                                    {analysis.ai_feedback}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={handleTryAgain}
                                className="flex-1 rounded-xl border border-border py-3 text-sm font-medium hover:bg-muted"
                            >
                                Try Again
                            </button>
                            <Link
                                href="/dashboard"
                                className="flex flex-1 items-center justify-center rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground"
                            >
                                Back to Dashboard
                            </Link>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function BlurtPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-background">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }
        >
            <BlurtContent />
        </Suspense>
    );
}
