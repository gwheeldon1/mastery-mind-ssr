"use client";

/**
 * Exam History page — lists past exam submissions with scores.
 * Route: /exam/history
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import {
    Target,
    ArrowLeft,
    FileText,
    Camera,
    Loader2,
} from "lucide-react";

function getPerformanceColor(pct: number): string {
    if (pct >= 70) return "text-emerald-600 dark:text-emerald-400";
    if (pct >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-destructive";
}

function getPerformanceBg(pct: number): string {
    if (pct >= 70) return "bg-emerald-500/10";
    if (pct >= 40) return "bg-yellow-500/10";
    return "bg-destructive/10";
}

export default function ExamHistoryPage() {
    const router = useRouter();
    const { user } = useAuth();
    const supabase = createClient();

    const { data: submissions, isLoading } = useQuery({
        queryKey: ["exam-history", user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data } = await supabase
                .from("exam_submissions")
                .select(
                    "id, total_score, max_marks, submitted_at, question_number, exam_board, paper_year, source_type, grade_boundary"
                )
                .eq("user_id", user.id)
                .order("submitted_at", { ascending: false })
                .limit(50);
            return data || [];
        },
        enabled: Boolean(user),
    });

    return (
        <div className="flex min-h-screen flex-col bg-background pb-8">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
                <div className="container flex h-14 items-center justify-between px-4">
                    <button
                        onClick={() => router.push("/stats")}
                        className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Exam History</span>
                    </div>
                    <div className="w-10" />
                </div>
            </header>

            <main className="container space-y-3 px-4 py-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : !submissions?.length ? (
                    <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
                        <Target className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                        <h2 className="mb-1 text-lg font-semibold">No submissions yet</h2>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Complete an exam practice session to see your history here.
                        </p>
                        <Link
                            href="/dashboard"
                            className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                        >
                            Go to Dashboard
                        </Link>
                    </div>
                ) : (
                    submissions.map((sub) => {
                        const pct =
                            sub.max_marks > 0 && sub.total_score != null
                                ? Math.round((sub.total_score / sub.max_marks) * 100)
                                : null;
                        const date = sub.submitted_at
                            ? new Date(sub.submitted_at).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                            })
                            : "Unknown date";

                        return (
                            <Link
                                key={sub.id}
                                href={`/exam/history/${sub.id}`}
                                className="block rounded-xl border border-border bg-card p-4 shadow-sm hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div
                                            className={`rounded-xl p-2 ${pct != null ? getPerformanceBg(pct) : "bg-muted"}`}
                                        >
                                            <Target
                                                className={`h-5 w-5 ${pct != null ? getPerformanceColor(pct) : "text-muted-foreground"}`}
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="truncate text-sm font-medium">
                                                {sub.question_number
                                                    ? `Q${sub.question_number}${sub.exam_board ? ` · ${sub.exam_board}` : ""}${sub.paper_year ? ` (${sub.paper_year})` : ""}`
                                                    : "Exam Question"}
                                            </h3>
                                            <div className="mt-0.5 flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">{date}</span>
                                                {sub.source_type && (
                                                    <span className="flex items-center gap-0.5 rounded border border-border px-1.5 py-0 text-[10px]">
                                                        {sub.source_type === "handwritten" ? (
                                                            <>
                                                                <Camera className="h-2.5 w-2.5" /> Handwritten
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FileText className="h-2.5 w-2.5" /> Typed
                                                            </>
                                                        )}
                                                    </span>
                                                )}
                                                {sub.grade_boundary && (
                                                    <span className="rounded bg-muted px-1.5 py-0 text-[10px] font-medium">
                                                        {sub.grade_boundary}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        {sub.total_score != null ? (
                                            <>
                                                <p
                                                    className={`text-xl font-bold ${pct != null ? getPerformanceColor(pct) : ""}`}
                                                >
                                                    {sub.total_score}/{sub.max_marks}
                                                </p>
                                                {pct != null && (
                                                    <p className="text-xs text-muted-foreground">{pct}%</p>
                                                )}
                                            </>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">Pending</p>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                )}
            </main>
        </div>
    );
}
