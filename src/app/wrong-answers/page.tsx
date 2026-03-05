"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useUserProfile } from "@/contexts/user-profile-context";
import { createClient } from "@/lib/supabase/client";
import {
    ArrowLeft,
    Sparkles,
    Target,
    BookOpen,
    Loader2,
    TrendingUp,
} from "lucide-react";

interface ConceptGroup {
    concept: string;
    count: number;
    totalAttempts: number;
    correctAttempts: number;
    accuracy: number;
    curriculumContentId: string | null;
    exampleQuestion: string;
}

export default function WrongAnswerPracticePage() {
    const { user, loading: authLoading } = useAuth();
    const { isPrimaryMode } = useUserProfile();
    const router = useRouter();
    const supabase = createClient();

    const [groups, setGroups] = useState<ConceptGroup[]>([]);
    const [totalWrong, setTotalWrong] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) router.replace("/auth");
    }, [authLoading, user, router]);

    const fetchWrongAnswers = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Fetch ALL recent answers (not just wrong) to calculate accuracy
            const { data } = await supabase
                .from("quiz_answers")
                .select(
                    "id, question_text, is_correct, curriculum_content_id, concept_tag"
                )
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(500);

            if (!data) {
                setLoading(false);
                return;
            }

            // Group by concept_tag — track both wrong and total
            const conceptMap = new Map<
                string,
                {
                    wrongCount: number;
                    totalCount: number;
                    correctCount: number;
                    curriculumContentId: string | null;
                    exampleQuestion: string;
                }
            >();

            for (const answer of data) {
                const concept = answer.concept_tag || "Uncategorised";
                const existing = conceptMap.get(concept);
                if (existing) {
                    existing.totalCount++;
                    if (!answer.is_correct) existing.wrongCount++;
                    else existing.correctCount++;
                } else {
                    conceptMap.set(concept, {
                        wrongCount: answer.is_correct ? 0 : 1,
                        totalCount: 1,
                        correctCount: answer.is_correct ? 1 : 0,
                        curriculumContentId: answer.curriculum_content_id || null,
                        exampleQuestion: answer.is_correct ? "" : (answer.question_text || ""),
                    });
                }
            }

            // Only include concepts with wrong answers
            const sorted = Array.from(conceptMap.entries())
                .filter(([, d]) => d.wrongCount > 0)
                .map(([concept, d]) => ({
                    concept,
                    count: d.wrongCount,
                    totalAttempts: d.totalCount,
                    correctAttempts: d.correctCount,
                    accuracy: d.totalCount > 0 ? Math.round((d.correctCount / d.totalCount) * 100) : 0,
                    curriculumContentId: d.curriculumContentId,
                    exampleQuestion: d.exampleQuestion,
                }))
                .sort((a, b) => b.count - a.count);

            setTotalWrong(sorted.reduce((sum, g) => sum + g.count, 0));
            setGroups(sorted);
        } catch (err) {
            console.error("Failed to fetch wrong answers:", err);
        } finally {
            setLoading(false);
        }
    }, [user, supabase]);

    useEffect(() => {
        if (user) fetchWrongAnswers();
    }, [user, fetchWrongAnswers]);

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-8">
            <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
                <div className="container flex h-14 items-center gap-2 px-4">
                    <Link
                        href="/dashboard"
                        className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold">
                            {isPrimaryMode
                                ? "Level Up Your Skills! 🚀"
                                : "Strengthen Your Knowledge"}
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            {isPrimaryMode
                                ? "Practice makes perfect — let's turn tricky questions into easy ones!"
                                : "Revisit topics you found tricky and build confidence"}
                        </p>
                    </div>
                </div>
            </header>

            <main className="container space-y-4 px-4 py-6">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : totalWrong === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-card py-12 text-center">
                        <div className="mb-3 text-4xl">✨</div>
                        <h2 className="mb-1 text-lg font-semibold">
                            Nothing to practice yet
                        </h2>
                        <p className="mb-4 text-sm text-muted-foreground">
                            {isPrimaryMode
                                ? "Complete some quizzes and any tricky questions will appear here for extra practice!"
                                : "As you complete quizzes, any questions you find challenging will appear here for targeted review."}
                        </p>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
                        >
                            <Sparkles className="h-4 w-4" /> Start a Quiz
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Summary */}
                        <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-4">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="h-5 w-5 shrink-0 text-primary" />
                                <div>
                                    <p className="font-medium">
                                        {totalWrong} question
                                        {totalWrong !== 1 ? "s" : ""} to revisit across{" "}
                                        {groups.length} topic
                                        {groups.length !== 1 ? "s" : ""}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {isPrimaryMode
                                            ? "Start with the topics at the top — you'll master them in no time! 💪"
                                            : "Focus on topics with the most questions first for maximum improvement"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Concept Groups */}
                        {groups.map((group) => (
                            <div
                                key={group.concept}
                                className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                            >
                                <div className="mb-2 flex items-center justify-between">
                                    <h3 className="flex items-center gap-2 font-semibold">
                                        <BookOpen className="h-4 w-4 text-primary" />
                                        {group.concept}
                                    </h3>
                                    <span
                                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${group.accuracy >= 60
                                                ? "bg-green-500/10 text-green-600"
                                                : group.accuracy >= 30
                                                    ? "bg-yellow-500/10 text-yellow-600"
                                                    : "bg-red-500/10 text-red-600"
                                            }`}
                                    >
                                        {group.count} wrong · {group.accuracy}% accuracy
                                    </span>
                                </div>

                                {/* Mastery progress bar */}
                                <div className="mb-3">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                        <span>{group.correctAttempts}/{group.totalAttempts} correct</span>
                                        <span
                                            className={group.accuracy >= 60
                                                ? "text-green-600"
                                                : group.accuracy >= 30
                                                    ? "text-yellow-600"
                                                    : "text-red-600"}
                                        >
                                            {group.accuracy}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                        <div
                                            className={`h-full rounded-full transition-all ${group.accuracy >= 60
                                                    ? "bg-green-500"
                                                    : group.accuracy >= 30
                                                        ? "bg-yellow-500"
                                                        : "bg-red-500"
                                                }`}
                                            style={{ width: `${group.accuracy}%` }}
                                        />
                                    </div>
                                </div>

                                {group.exampleQuestion && (
                                    <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">
                                        Example: {group.exampleQuestion.slice(0, 100)}...
                                    </p>
                                )}
                                <Link
                                    href={`/quiz/review?name=${encodeURIComponent(group.concept)}${group.curriculumContentId ? `&curriculum=${group.curriculumContentId}` : ""}&count=5`}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                                >
                                    <Target className="h-4 w-4" />
                                    Practice ({group.count} question
                                    {group.count !== 1 ? "s" : ""})
                                </Link>
                            </div>
                        ))}
                    </>
                )}
            </main>
        </div>
    );
}
