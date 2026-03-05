"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useUserProfile } from "@/contexts/user-profile-context";
import { useStatsData } from "@/hooks/useStatsData";
import {
    Brain,
    ArrowLeft,
    Target,
    CheckCircle2,
    XCircle,
    BarChart3,
    Flame,
    ChevronDown,
    ChevronRight,
    Mic,
    AlertTriangle,
    Loader2,
} from "lucide-react";

function getMasteryLevel(score: number) {
    if (score >= 80) return { label: "Master", color: "text-green-500" };
    if (score >= 60) return { label: "Proficient", color: "text-primary" };
    if (score >= 40) return { label: "Developing", color: "text-yellow-500" };
    if (score >= 20) return { label: "Beginner", color: "text-orange-500" };
    return { label: "Novice", color: "text-muted-foreground" };
}

export default function StatsPage() {
    const { user, loading: authLoading } = useAuth();
    const { isPrimaryMode } = useUserProfile();
    const router = useRouter();

    const {
        overallStats,
        subjectStats,
        expandedSubjects,
        blurtSessions,
        examSessions,
        weakAreas,
        loading,
        toggleSubject,
    } = useStatsData();

    useEffect(() => {
        if (!authLoading && !user) router.replace("/auth");
    }, [authLoading, user, router]);

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-8">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
                <div className="container flex h-14 items-center justify-between px-4">
                    <Link
                        href="/dashboard"
                        className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        <span className="font-semibold">
                            {isPrimaryMode ? "Your Progress! 📊" : "Statistics"}
                        </span>
                    </div>
                    <div className="w-10" />
                </div>
            </header>

            <main className="container space-y-6 px-4 py-6">
                {/* Overall Stats Grid */}
                <section className="space-y-3">
                    <h2 className="font-semibold text-lg">
                        {isPrimaryMode ? "Overall Stats 🌟" : "Overview"}
                    </h2>

                    <div className="grid grid-cols-2 gap-3">
                        <StatCard
                            icon={<Target className="h-5 w-5 text-primary" />}
                            iconBg="bg-primary/10"
                            label="Avg Mastery"
                            value={`${overallStats.averageMastery}%`}
                        />
                        <StatCard
                            icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
                            iconBg="bg-green-500/10"
                            label="Accuracy"
                            value={`${overallStats.overallAccuracy}%`}
                        />
                        <StatCard
                            icon={<Brain className="h-5 w-5 text-yellow-500" />}
                            iconBg="bg-yellow-500/10"
                            label="Questions"
                            value={String(overallStats.totalQuestions)}
                        />
                        <StatCard
                            icon={<Flame className="h-5 w-5 text-red-500" />}
                            iconBg="bg-red-500/10"
                            label="Days Active"
                            value={String(overallStats.streakDays)}
                        />
                    </div>

                    {/* Exam Summary */}
                    {overallStats.examSessions > 0 && (
                        <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-xl bg-primary/20 p-2">
                                        <Target className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Exam Practice
                                        </p>
                                        <p className="text-lg font-bold">
                                            {overallStats.examTotalScore}/
                                            {overallStats.examTotalMarks} marks
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold">
                                        {overallStats.examTotalMarks > 0
                                            ? Math.round(
                                                (overallStats.examTotalScore /
                                                    overallStats.examTotalMarks) *
                                                100
                                            )
                                            : 0}
                                        %
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {overallStats.examSessions} sessions
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Correct vs Wrong bar */}
                    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                                Correct vs Wrong
                            </span>
                            <span className="text-sm font-medium">
                                {overallStats.correctAnswers} / {overallStats.wrongAnswers}
                            </span>
                        </div>
                        <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-muted">
                            <div
                                className="bg-green-500 transition-all"
                                style={{ width: `${overallStats.overallAccuracy}%` }}
                            />
                            <div
                                className="bg-red-500 transition-all"
                                style={{ width: `${100 - overallStats.overallAccuracy}%` }}
                            />
                        </div>
                        <div className="mt-1 flex justify-between text-xs">
                            <span className="flex items-center gap-1 text-green-500">
                                <CheckCircle2 className="h-3 w-3" /> Correct
                            </span>
                            <span className="flex items-center gap-1 text-red-500">
                                <XCircle className="h-3 w-3" /> Wrong
                            </span>
                        </div>
                    </div>
                </section>

                {/* Blurt History */}
                {blurtSessions.length > 0 && (
                    <section className="space-y-3">
                        <h2 className="font-semibold text-lg">
                            {isPrimaryMode ? "Blurt Challenges 🎤" : "Blurt Challenge History"}
                        </h2>
                        <div className="space-y-2">
                            {blurtSessions.map((session) => {
                                const dateStr = new Date(session.created_at).toLocaleDateString(
                                    "en-GB",
                                    { day: "numeric", month: "short" }
                                );
                                const pct = session.coverage_percentage;
                                const scoreColor =
                                    pct >= 70
                                        ? "text-green-500"
                                        : pct >= 40
                                            ? "text-yellow-500"
                                            : "text-red-500";
                                const bgColor =
                                    pct >= 70
                                        ? "bg-green-500/10"
                                        : pct >= 40
                                            ? "bg-yellow-500/10"
                                            : "bg-red-500/10";

                                return (
                                    <div
                                        key={session.id}
                                        className="rounded-xl border border-border bg-card p-4 shadow-sm"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`rounded-xl p-2 ${bgColor}`}>
                                                    <Mic className={`h-5 w-5 ${scoreColor}`} />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-medium">
                                                        {session.topic_title}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground">
                                                        {dateStr}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-xl font-bold ${scoreColor}`}>
                                                    {pct}%
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    coverage
                                                </p>
                                            </div>
                                        </div>
                                        {session.gaps_identified?.length > 0 && (
                                            <div className="mt-2 border-t border-border pt-2">
                                                <p className="text-xs text-muted-foreground">
                                                    {session.gaps_identified.length} gap
                                                    {session.gaps_identified.length !== 1 ? "s" : ""}{" "}
                                                    identified
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Exam Sessions */}
                {examSessions.length > 0 && (
                    <section className="space-y-3">
                        <h2 className="font-semibold text-lg">
                            {isPrimaryMode ? "Exam Practice 📝" : "Exam Sessions"}
                        </h2>
                        <div className="space-y-2">
                            {examSessions.map((session) => {
                                const dateStr = new Date(session.created_at).toLocaleDateString(
                                    "en-GB",
                                    { day: "numeric", month: "short" }
                                );
                                const percentage =
                                    session.total_marks > 0
                                        ? Math.round(
                                            (session.total_score / session.total_marks) * 100
                                        )
                                        : 0;
                                const scoreColor =
                                    percentage >= 70
                                        ? "text-green-500"
                                        : percentage >= 40
                                            ? "text-yellow-500"
                                            : "text-red-500";
                                const bgColor =
                                    percentage >= 70
                                        ? "bg-green-500/10"
                                        : percentage >= 40
                                            ? "bg-yellow-500/10"
                                            : "bg-red-500/10";

                                return (
                                    <div
                                        key={session.id}
                                        className="rounded-xl border border-border bg-card p-4 shadow-sm"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`rounded-xl p-2 ${bgColor}`}>
                                                    <Target className={`h-5 w-5 ${scoreColor}`} />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-medium">Exam Practice</h3>
                                                    <p className="text-xs text-muted-foreground">
                                                        {dateStr}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-xl font-bold ${scoreColor}`}>
                                                    {session.total_score}/{session.total_marks}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {percentage}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Weak Areas */}
                {weakAreas.length > 0 && (
                    <section className="space-y-3">
                        <h2 className="font-semibold text-lg">
                            {isPrimaryMode ? "Areas to Improve 💪" : "Weak Areas"}
                        </h2>
                        <div className="space-y-2">
                            {weakAreas.slice(0, 5).map((area) => {
                                const scoreColor =
                                    area.combined_score >= 60
                                        ? "text-yellow-500"
                                        : "text-red-500";
                                const bgColor =
                                    area.combined_score >= 60
                                        ? "bg-yellow-500/10"
                                        : "bg-red-500/10";

                                return (
                                    <div
                                        key={area.curriculum_content_id}
                                        className="cursor-pointer rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex min-w-0 flex-1 items-start gap-3">
                                                <div className={`shrink-0 rounded-xl p-2 ${bgColor}`}>
                                                    <AlertTriangle
                                                        className={`h-5 w-5 ${scoreColor}`}
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="truncate text-sm font-medium">
                                                        {area.subtopic || area.topic}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground">
                                                        {area.subject_name}
                                                    </p>
                                                    <div className="mt-2 flex items-center gap-3 text-xs">
                                                        <span className="flex items-center gap-1">
                                                            <Brain className="h-3 w-3 text-primary" />
                                                            Quiz: {area.quiz_mastery}%
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Mic className="h-3 w-3 text-primary" />
                                                            Blurt: {area.blurt_coverage}%
                                                        </span>
                                                        {area.exam_score > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <Target className="h-3 w-3 text-primary" />
                                                                Exam: {area.exam_score}%
                                                            </span>
                                                        )}
                                                    </div>
                                                    {area.gaps?.length > 0 && (
                                                        <div className="mt-2 flex flex-wrap gap-1">
                                                            {area.gaps.slice(0, 2).map((gap, i) => (
                                                                <span
                                                                    key={i}
                                                                    className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                                                                >
                                                                    {gap.length > 30
                                                                        ? gap.substring(0, 30) + "..."
                                                                        : gap}
                                                                </span>
                                                            ))}
                                                            {area.gaps.length > 2 && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    +{area.gaps.length - 2} more
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className={`text-xl font-bold ${scoreColor}`}>
                                                    {area.combined_score}%
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    combined
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {weakAreas.length > 5 && (
                            <p className="text-center text-xs text-muted-foreground">
                                Showing top 5 of {weakAreas.length} areas to improve
                            </p>
                        )}
                    </section>
                )}

                {/* Subject Breakdown */}
                <section className="space-y-3">
                    <h2 className="font-semibold text-lg">
                        {isPrimaryMode ? "Subjects 📚" : "By Subject"}
                    </h2>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="h-24 animate-pulse rounded-xl border border-border bg-card"
                                />
                            ))}
                        </div>
                    ) : subjectStats.length === 0 ? (
                        <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
                            <Brain className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                            <p className="text-muted-foreground">
                                {isPrimaryMode
                                    ? "Start practicing to see your stats! 🚀"
                                    : "No subjects studied yet. Start a quiz to track progress."}
                            </p>
                            <Link
                                href="/dashboard"
                                className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground"
                            >
                                Start Learning
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {subjectStats.map(
                                ({
                                    subject,
                                    topics,
                                    averageMastery,
                                    totalCorrect,
                                    totalWrong,
                                }) => {
                                    const level = getMasteryLevel(averageMastery);
                                    const isExpanded = expandedSubjects.has(subject.id);
                                    const totalAttempts = totalCorrect + totalWrong;
                                    const accuracy =
                                        totalAttempts > 0
                                            ? Math.round((totalCorrect / totalAttempts) * 100)
                                            : 0;

                                    return (
                                        <div
                                            key={subject.id}
                                            className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                                        >
                                            <div
                                                className="cursor-pointer p-4 transition-colors hover:bg-muted/50"
                                                onClick={() => toggleSubject(subject.id)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        {isExpanded ? (
                                                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                                        ) : (
                                                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                                        )}
                                                        <div>
                                                            <h3 className="font-semibold">{subject.name}</h3>
                                                            <p className="text-xs text-muted-foreground">
                                                                {topics.length} topic
                                                                {topics.length !== 1 ? "s" : ""}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold">
                                                            {averageMastery}%
                                                        </p>
                                                        <p
                                                            className={`text-xs font-medium ${level.color}`}
                                                        >
                                                            {level.label}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Progress bar */}
                                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className="h-full rounded-full bg-primary transition-all"
                                                        style={{ width: `${averageMastery}%` }}
                                                    />
                                                </div>

                                                <div className="mt-2 flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-4">
                                                        <span className="flex items-center gap-1 text-green-500">
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                            {totalCorrect}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-red-500">
                                                            <XCircle className="h-3.5 w-3.5" />
                                                            {totalWrong}
                                                        </span>
                                                    </div>
                                                    {totalAttempts > 0 && (
                                                        <span className="text-muted-foreground">
                                                            {accuracy}% accuracy
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Expanded Topics */}
                                            {isExpanded && (
                                                <div className="border-t border-border bg-muted/30">
                                                    {topics.map((topic) => {
                                                        const topicLevel = getMasteryLevel(
                                                            topic.mastery_score
                                                        );
                                                        return (
                                                            <div
                                                                key={topic.id}
                                                                className="border-b border-border p-4 last:border-b-0"
                                                            >
                                                                <div className="mb-2 flex items-center justify-between">
                                                                    <h4 className="font-medium">
                                                                        {topic.title}
                                                                    </h4>
                                                                    <span
                                                                        className={`text-xs font-medium ${topicLevel.color}`}
                                                                    >
                                                                        {topic.mastery_score}%
                                                                    </span>
                                                                </div>
                                                                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                                                    <div
                                                                        className="h-full rounded-full bg-primary transition-all"
                                                                        style={{
                                                                            width: `${topic.mastery_score}%`,
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="flex items-center gap-1">
                                                                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                                                                            {topic.correct_count}
                                                                        </span>
                                                                        <span className="flex items-center gap-1">
                                                                            <XCircle className="h-3 w-3 text-red-500" />
                                                                            {topic.wrong_count}
                                                                        </span>
                                                                    </div>
                                                                    <span>{topicLevel.label}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

function StatCard({
    icon,
    iconBg,
    label,
    value,
}: {
    icon: React.ReactNode;
    iconBg: string;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
                <div className={`shrink-0 rounded-xl p-2 ${iconBg}`}>{icon}</div>
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold">{value}</p>
                </div>
            </div>
        </div>
    );
}
