"use client";

/**
 * Due Reviews Card — shows topics due for spaced repetition review.
 * Queries quiz_answers for low-mastery topics.
 */

import { useState, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { useUserProfile } from "@/contexts/user-profile-context";
import { Brain, Clock, ChevronRight, Loader2, Sparkles } from "lucide-react";

interface DueReview {
    topic: string;
    subjectName: string;
    subjectId: string;
    curriculumContentId: string;
    mastery: number;
    source: "low_mastery" | "scheduled";
}

function DueReviewsCardInner() {
    const { user } = useAuth();
    const { isPrimaryMode } = useUserProfile();
    const supabase = createClient();

    const [reviews, setReviews] = useState<DueReview[]>([]);
    const [loading, setLoading] = useState(true);

    const loadReviews = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            // Find topics with low mastery (< 60%) from recent quiz answers
            const { data: answers } = await supabase
                .from("quiz_answers")
                .select("concept_tag, subject_id, curriculum_content_id, is_correct")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(200);

            if (!answers?.length) {
                setReviews([]);
                setLoading(false);
                return;
            }

            // Group by concept tag and calculate mastery
            const conceptMap = new Map<
                string,
                { correct: number; total: number; subjectId: string; ccId: string }
            >();

            answers.forEach((a) => {
                const key = a.concept_tag || "general";
                const existing = conceptMap.get(key) || {
                    correct: 0,
                    total: 0,
                    subjectId: a.subject_id || "",
                    ccId: a.curriculum_content_id || "",
                };
                existing.total++;
                if (a.is_correct) existing.correct++;
                conceptMap.set(key, existing);
            });

            // Filter to low mastery topics
            const lowMastery: DueReview[] = [];
            conceptMap.forEach((stats, concept) => {
                const mastery = Math.round((stats.correct / stats.total) * 100);
                if (mastery < 60 && stats.total >= 2 && concept !== "general") {
                    lowMastery.push({
                        topic: concept,
                        subjectName: "",
                        subjectId: stats.subjectId,
                        curriculumContentId: stats.ccId,
                        mastery,
                        source: "low_mastery",
                    });
                }
            });

            // Sort by mastery ascending and take top 5
            lowMastery.sort((a, b) => a.mastery - b.mastery);
            setReviews(lowMastery.slice(0, 5));
        } catch (err) {
            console.error("Failed to load reviews:", err);
        } finally {
            setLoading(false);
        }
    }, [user, supabase]);

    useEffect(() => {
        if (user) loadReviews();
    }, [user, loadReviews]);

    if (loading) {
        return (
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
                <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />
                </div>
            </div>
        );
    }

    if (reviews.length === 0) return null;

    return (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-yellow-500/20 p-1.5">
                        <Brain className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-base">
                            {isPrimaryMode ? "Time to Review! 🧠" : "Due for Review"}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            {reviews.length} topic{reviews.length > 1 ? "s" : ""} need
                            attention
                        </p>
                    </div>
                </div>
                {reviews.length > 1 && (
                    <Link
                        href={`/quiz/review?curriculum=${reviews[0].curriculumContentId}&name=${encodeURIComponent(reviews[0].topic)}`}
                        className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                    >
                        <Sparkles className="h-3 w-3" />
                        {isPrimaryMode ? "Review All!" : "Review All"}
                    </Link>
                )}
            </div>

            <div className="space-y-2">
                {reviews.slice(0, 3).map((review) => (
                    <Link
                        key={review.topic}
                        href={`/quiz/review?curriculum=${review.curriculumContentId}&name=${encodeURIComponent(review.topic)}`}
                        className="flex items-center gap-3 rounded-lg bg-background/50 p-3 hover:bg-background/80 transition-all"
                    >
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{review.topic}</p>
                            <div className="mt-0.5 flex items-center gap-2">
                                {review.source === "low_mastery" && (
                                    <span className="rounded border border-border px-1.5 py-0 text-[10px]">
                                        {review.mastery}%
                                    </span>
                                )}
                                {review.source === "scheduled" && (
                                    <span className="flex items-center gap-0.5 rounded bg-muted px-1.5 py-0 text-[10px]">
                                        <Clock className="h-2.5 w-2.5" /> Due
                                    </span>
                                )}
                            </div>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                ))}
            </div>

            {reviews.length > 3 && (
                <p className="text-center text-xs text-muted-foreground">
                    +{reviews.length - 3} more topics
                </p>
            )}
        </div>
    );
}

export const DueReviewsCard = memo(DueReviewsCardInner);
