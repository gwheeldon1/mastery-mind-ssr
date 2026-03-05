"use client";

/**
 * Exam Submission Detail page — detailed view of one exam submission.
 * Shows per-question marks, feedback, model answers.
 * Route: /exam/history/[id]
 */

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import {
    Target,
    ArrowLeft,
    CheckCircle2,
    AlertTriangle,
    Lightbulb,
    Loader2,
} from "lucide-react";

function getScoreColor(pct: number): string {
    if (pct >= 70) return "text-emerald-600 dark:text-emerald-400";
    if (pct >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-destructive";
}

function getScoreBg(pct: number): string {
    if (pct >= 70) return "bg-emerald-500/10 border-emerald-500/20";
    if (pct >= 40) return "bg-yellow-500/10 border-yellow-500/20";
    return "bg-destructive/10 border-destructive/20";
}

interface SubmissionQuestion {
    question: string;
    answer: string;
    marks_awarded: number;
    marks_available: number;
    feedback: string;
    model_answer?: string;
    strengths?: string[];
    improvements?: string[];
}

export default function ExamSubmissionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const supabase = createClient();
    const id = params.id as string;

    const { data, isLoading, error } = useQuery({
        queryKey: ["exam-submission", id],
        queryFn: async () => {
            if (!user) throw new Error("Not authenticated");

            const { data: submission, error: err } = await supabase
                .from("exam_submissions")
                .select("*")
                .eq("id", id)
                .eq("user_id", user.id)
                .single();

            if (err || !submission) throw new Error("Submission not found");
            return submission;
        },
        enabled: Boolean(user && id),
    });

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
                <p className="mb-4 text-muted-foreground">
                    {error instanceof Error ? error.message : "Submission not found"}
                </p>
                <Link
                    href="/exam/history"
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                    Back to History
                </Link>
            </div>
        );
    }

    const totalPct =
        data.max_marks > 0 && data.total_score != null
            ? Math.round((data.total_score / data.max_marks) * 100)
            : null;

    const questions: SubmissionQuestion[] = Array.isArray(data.questions)
        ? data.questions
        : [];

    const date = data.submitted_at
        ? new Date(data.submitted_at).toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        })
        : "Unknown date";

    return (
        <div className="flex min-h-screen flex-col bg-background pb-8">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
                <div className="container flex h-14 items-center justify-between px-4">
                    <button
                        onClick={() => router.push("/exam/history")}
                        className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Submission Detail</span>
                    </div>
                    <div className="w-10" />
                </div>
            </header>

            <main className="container space-y-6 px-4 py-6">
                {/* Score summary */}
                <div
                    className={`rounded-xl border p-6 text-center ${totalPct != null ? getScoreBg(totalPct) : "bg-muted border-border"}`}
                >
                    <p className="mb-1 text-sm text-muted-foreground">{date}</p>
                    {data.total_score != null ? (
                        <>
                            <p
                                className={`text-4xl font-bold ${totalPct != null ? getScoreColor(totalPct) : ""}`}
                            >
                                {data.total_score}/{data.max_marks}
                            </p>
                            {totalPct != null && (
                                <p className="mt-1 text-lg font-medium text-muted-foreground">
                                    {totalPct}%
                                </p>
                            )}
                        </>
                    ) : (
                        <p className="text-lg text-muted-foreground">Grading pending</p>
                    )}
                    {data.grade_boundary && (
                        <span className="mt-2 inline-block rounded-md bg-muted px-3 py-1 text-sm font-medium">
                            Grade: {data.grade_boundary}
                        </span>
                    )}
                </div>

                {/* Per-question breakdown */}
                {questions.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">Question Breakdown</h2>
                        {questions.map((q, i) => {
                            const qPct =
                                q.marks_available > 0
                                    ? Math.round((q.marks_awarded / q.marks_available) * 100)
                                    : null;

                            return (
                                <div key={i} className="rounded-xl border border-border bg-card p-4">
                                    {/* Question + score */}
                                    <div className="mb-3 flex items-start justify-between gap-3">
                                        <p className="text-sm font-medium">
                                            Q{i + 1}. {q.question}
                                        </p>
                                        <span
                                            className={`shrink-0 rounded-md px-2 py-0.5 text-sm font-bold ${qPct != null && qPct >= 70
                                                    ? "bg-emerald-500/10 text-emerald-600"
                                                    : qPct != null && qPct >= 40
                                                        ? "bg-yellow-500/10 text-yellow-600"
                                                        : "bg-destructive/10 text-destructive"
                                                }`}
                                        >
                                            {q.marks_awarded}/{q.marks_available}
                                        </span>
                                    </div>

                                    {/* Student answer */}
                                    <div className="mb-3 rounded-lg bg-muted/30 p-3 text-sm">
                                        <p className="mb-1 text-[10px] font-medium uppercase text-muted-foreground">
                                            Your Answer
                                        </p>
                                        <p className="whitespace-pre-wrap">{q.answer || "No answer provided"}</p>
                                    </div>

                                    {/* Feedback */}
                                    {q.feedback && (
                                        <div className="mb-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-sm">
                                            <p className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase text-blue-600 dark:text-blue-400">
                                                <Lightbulb className="h-3 w-3" /> Feedback
                                            </p>
                                            <p className="whitespace-pre-wrap">{q.feedback}</p>
                                        </div>
                                    )}

                                    {/* Strengths */}
                                    {q.strengths && q.strengths.length > 0 && (
                                        <div className="mb-2">
                                            <p className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase text-emerald-600">
                                                <CheckCircle2 className="h-3 w-3" /> Strengths
                                            </p>
                                            <ul className="space-y-1">
                                                {q.strengths.map((s, j) => (
                                                    <li key={j} className="flex items-start gap-2 text-sm">
                                                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
                                                        {s}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Improvements */}
                                    {q.improvements && q.improvements.length > 0 && (
                                        <div className="mb-2">
                                            <p className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase text-amber-600">
                                                <AlertTriangle className="h-3 w-3" /> Improvements
                                            </p>
                                            <ul className="space-y-1">
                                                {q.improvements.map((imp, j) => (
                                                    <li key={j} className="flex items-start gap-2 text-sm">
                                                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5" />
                                                        {imp}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Model answer */}
                                    {q.model_answer && (
                                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm">
                                            <p className="mb-1 text-[10px] font-medium uppercase text-emerald-600">
                                                Model Answer
                                            </p>
                                            <p className="whitespace-pre-wrap">{q.model_answer}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
