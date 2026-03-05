"use client";

/**
 * Custom hook for Stats page data fetching.
 * Uses parallel queries and RPC for efficient loading.
 */

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useUserProfile } from "@/contexts/user-profile-context";
import { createClient } from "@/lib/supabase/client";
import type {
    WeakArea,
    TopicStats,
    SubjectStats,
    OverallStats,
    BlurtSession,
    ExamSessionStats,
} from "@/types/stats";

const INITIAL_OVERALL: OverallStats = {
    totalQuestions: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    overallAccuracy: 0,
    averageMastery: 0,
    topicsStudied: 0,
    streakDays: 0,
    examSessions: 0,
    examTotalMarks: 0,
    examTotalScore: 0,
};

export function useStatsData() {
    const { user } = useAuth();
    const { profile } = useUserProfile();
    const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([]);
    const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(
        new Set()
    );
    const [overallStats, setOverallStats] =
        useState<OverallStats>(INITIAL_OVERALL);
    const [blurtSessions, setBlurtSessions] = useState<BlurtSession[]>([]);
    const [examSessions, setExamSessions] = useState<ExamSessionStats[]>([]);
    const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
    const [loading, setLoading] = useState(true);

    const supabase = createClient();

    const fetchWeakAreas = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase.rpc("get_student_weak_areas", {
            p_user_id: user.id,
        });
        if (data && !error) setWeakAreas(data as WeakArea[]);
    }, [user, supabase]);

    const fetchExamSessions = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase
            .from("exam_sessions")
            .select("id, total_score, total_marks, created_at, is_graded")
            .eq("user_id", user.id)
            .eq("is_graded", true)
            .order("created_at", { ascending: false })
            .limit(10);
        if (data) setExamSessions(data);
    }, [user, supabase]);

    const fetchBlurtSessions = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase
            .from("blurt_sessions")
            .select(
                "id, topic_title, coverage_percentage, created_at, gaps_identified"
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10);
        if (data) setBlurtSessions(data);
    }, [user, supabase]);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        if (!user || !profile?.year_group) {
            setLoading(false);
            return;
        }

        // Parallel queries
        const [
            { data: userSubjects },
            { data: subjectsRaw },
            { data: activityStats },
            { data: progressData },
            { data: blurtDataForTopics },
            { data: examData },
        ] = await Promise.all([
            supabase
                .from("user_subjects")
                .select("subject_id")
                .eq("user_id", user.id),
            supabase.from("subjects").select("id, name, color"),
            supabase.rpc("get_user_activity_stats", { p_user_id: user.id }),
            supabase
                .from("user_curriculum_progress")
                .select(
                    "curriculum_content_id, mastery_percentage, times_practiced, questions_attempted, questions_correct"
                )
                .eq("user_id", user.id),
            supabase
                .from("blurt_sessions")
                .select("curriculum_content_id, coverage_percentage")
                .eq("user_id", user.id),
            supabase
                .from("exam_sessions")
                .select("total_score, total_marks")
                .eq("user_id", user.id)
                .eq("is_graded", true),
        ]);

        const userSubjectIds = userSubjects?.map((us) => us.subject_id) || [];
        const subjects = (subjectsRaw || []).filter((s) =>
            userSubjectIds.includes(s.id)
        );

        // Map curriculum content IDs to topics
        const progressIds =
            progressData?.map((p) => p.curriculum_content_id) || [];
        const blurtIds =
            blurtDataForTopics
                ?.filter((b) => b.curriculum_content_id)
                .map((b) => b.curriculum_content_id!) || [];
        const allCurriculumIds = [...new Set([...progressIds, ...blurtIds])];

        let curriculumContent: {
            id: string;
            topic: string;
            subject_id: string | null;
        }[] = [];
        if (allCurriculumIds.length > 0) {
            const { data } = await supabase
                .from("spec_topics")
                .select("id, topic_name, specification_versions(subject_id)")
                .in("id", allCurriculumIds);
            curriculumContent = (data || []).map((d: any) => ({
                id: d.id,
                topic: d.topic_name || "",
                subject_id: d.specification_versions?.subject_id || null,
            }));
        }

        // Build coverage maps
        const quizMasteryMap: Record<string, number> = {};
        const attemptsMap: Record<string, { correct: number; wrong: number }> = {};
        progressData?.forEach((p) => {
            quizMasteryMap[p.curriculum_content_id] = p.mastery_percentage;
            attemptsMap[p.curriculum_content_id] = {
                correct: p.questions_correct || 0,
                wrong:
                    (p.questions_attempted || 0) - (p.questions_correct || 0),
            };
        });

        const blurtCoverageMap: Record<string, number> = {};
        blurtDataForTopics?.forEach((b) => {
            if (b.curriculum_content_id) {
                const existing = blurtCoverageMap[b.curriculum_content_id] || 0;
                blurtCoverageMap[b.curriculum_content_id] = Math.max(
                    existing,
                    b.coverage_percentage || 0
                );
            }
        });

        // Build topic stats
        const enrichedTopics: TopicStats[] = curriculumContent.map((content) => {
            const quizMastery = quizMasteryMap[content.id] || 0;
            const blurtCoverage = blurtCoverageMap[content.id] || 0;
            const combined = Math.round((quizMastery + blurtCoverage) / 2);
            const attempts = attemptsMap[content.id] || { correct: 0, wrong: 0 };
            const total = attempts.correct + attempts.wrong;

            return {
                id: content.id,
                title: content.topic,
                mastery_score: quizMastery,
                subject_id: content.subject_id,
                total_attempts: total,
                correct_count: attempts.correct,
                wrong_count: attempts.wrong,
                accuracy: total > 0 ? Math.round((attempts.correct / total) * 100) : 0,
                quiz_mastery: quizMastery,
                blurt_coverage: blurtCoverage,
                combined_coverage: combined,
            };
        });

        // Group by subject
        const subjectStatsMap = new Map<string, SubjectStats>();
        subjects?.forEach((subject) => {
            const subjectTopics = enrichedTopics.filter(
                (t) => t.subject_id === subject.id
            );
            if (subjectTopics.length > 0) {
                const avgMastery = Math.round(
                    subjectTopics.reduce((acc, t) => acc + t.mastery_score, 0) /
                    subjectTopics.length
                );
                const avgCombined = Math.round(
                    subjectTopics.reduce((acc, t) => acc + t.combined_coverage, 0) /
                    subjectTopics.length
                );
                const totalCorrect = subjectTopics.reduce(
                    (acc, t) => acc + t.correct_count,
                    0
                );
                const totalWrong = subjectTopics.reduce(
                    (acc, t) => acc + t.wrong_count,
                    0
                );

                subjectStatsMap.set(subject.id, {
                    subject,
                    topics: subjectTopics,
                    averageMastery: avgMastery,
                    combinedCoverage: avgCombined,
                    totalCorrect,
                    totalWrong,
                });
            }
        });

        setSubjectStats(
            Array.from(subjectStatsMap.values()).sort(
                (a, b) => b.combinedCoverage - a.combinedCoverage
            )
        );

        // Overall stats from activity RPC
        const statsRow = (activityStats as any)?.[0] || ({} as any);
        const totalQuestions = Number(statsRow.total_questions) || 0;
        const totalCorrect = Number(statsRow.correct_answers) || 0;
        const totalWrong = Number(statsRow.wrong_answers) || 0;
        const streakDays = Number(statsRow.unique_days) || 0;

        let avgMastery = 0;
        if (progressData && progressData.length > 0) {
            avgMastery = Math.round(
                progressData.reduce((acc, p) => acc + p.mastery_percentage, 0) /
                progressData.length
            );
        }

        const examSessionCount = examData?.length || 0;
        const examTotalScore =
            examData?.reduce((sum, e) => sum + (e.total_score || 0), 0) || 0;
        const examTotalMarks =
            examData?.reduce((sum, e) => sum + (e.total_marks || 0), 0) || 0;

        setOverallStats({
            totalQuestions,
            correctAnswers: totalCorrect,
            wrongAnswers: totalWrong,
            overallAccuracy:
                totalQuestions > 0
                    ? Math.round((totalCorrect / totalQuestions) * 100)
                    : 0,
            averageMastery: avgMastery,
            topicsStudied: enrichedTopics.length,
            streakDays,
            examSessions: examSessionCount,
            examTotalScore,
            examTotalMarks,
        });

        setLoading(false);
    }, [user, profile?.year_group, supabase]);

    const toggleSubject = useCallback((subjectId: string) => {
        setExpandedSubjects((prev) => {
            const next = new Set(prev);
            if (next.has(subjectId)) next.delete(subjectId);
            else next.add(subjectId);
            return next;
        });
    }, []);

    useEffect(() => {
        if (user) {
            fetchStats();
            fetchBlurtSessions();
            fetchExamSessions();
            fetchWeakAreas();
        }
    }, [user, fetchStats, fetchBlurtSessions, fetchExamSessions, fetchWeakAreas]);

    return {
        overallStats,
        subjectStats,
        expandedSubjects,
        blurtSessions,
        examSessions,
        weakAreas,
        loading,
        toggleSubject,
    };
}
