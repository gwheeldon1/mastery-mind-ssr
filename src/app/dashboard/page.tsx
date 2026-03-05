"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useUserProfile } from "@/contexts/user-profile-context";
import { useSubscription } from "@/contexts/subscription-context";
import { useStreaks } from "@/hooks/useStreaks";
import { fetchDashboardData } from "@/actions/dashboard";
import { toast } from "sonner";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";
import { DueReviewsCard } from "@/components/dashboard/DueReviewsCard";
import { FirstTimeWalkthrough } from "@/components/dashboard/FirstTimeWalkthrough";
import { ReturnVisitCelebration } from "@/components/dashboard/ReturnVisitCelebration";
import {
    Brain,
    Flame,
    Target,
    Zap,
    Trophy,
    ChevronDown,
    ChevronRight,
    BookOpen,
    Shuffle,
    BarChart3,
    Settings,
    LogOut,
    Loader2,
    Sparkles,
    GraduationCap,
    Lightbulb,
    ArrowRight,
    Rocket,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────
interface SubjectData {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
    topics: TopicData[];
    totalMastery: number;
    topicsPracticed: number;
}

interface TopicData {
    id: string;
    name: string;
    mastery: number;
    curriculumContentId: string | null;
}

// ─── Helpers ────────────────────────────────────────────
function getXpForLevel(level: number) {
    return level * 100;
}

function getMasteryClass(m: number) {
    if (m >= 80) return "text-green-500";
    if (m >= 50) return "text-yellow-500";
    return "text-red-500";
}

// ─── Dashboard Page ─────────────────────────────────────
export default function DashboardPage() {
    const router = useRouter();
    const { user, loading: authLoading, signOut } = useAuth();
    const { profile, isPrimaryMode, loading: profileLoading } = useUserProfile();
    const { internalTrialActive, internalTrialEnd } = useSubscription();

    // Derive trial days remaining from the context
    const trialDaysRemaining = internalTrialEnd
        ? Math.max(
            0,
            Math.ceil(
                (new Date(internalTrialEnd).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
            )
        )
        : null;
    const { streak, dailyGoal, xp, loading: streaksLoading } = useStreaks(
        user?.id
    );
    const [subjects, setSubjects] = useState<SubjectData[]>([]);
    const [overallMastery, setOverallMastery] = useState(0);
    const [totalTopics, setTotalTopics] = useState(0);
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Auth guard
    useEffect(() => {
        if (!authLoading && !profileLoading && !user) router.replace("/auth");
        if (!authLoading && !profileLoading && user && !profile?.year_group)
            router.replace("/onboarding");
    }, [authLoading, profileLoading, user, profile, router]);

    // Fetch subject data via server action (single server round-trip)
    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            const data = await fetchDashboardData(user.id);
            setSubjects(data.subjects);
            setOverallMastery(data.overallMastery);
            setTotalTopics(data.totalTopics);
        } catch (err) {
            console.error("Dashboard data fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user && profile?.year_group) fetchData();
    }, [user, profile?.year_group, fetchData]);

    // Refetch when page becomes visible (returning from quiz)
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === "visible" && user && profile?.year_group) {
                fetchData();
            }
        };
        document.addEventListener("visibilitychange", handleVisibility);
        return () =>
            document.removeEventListener("visibilitychange", handleVisibility);
    }, [user, profile?.year_group, fetchData]);

    if (authLoading || profileLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Brain className="h-12 w-12 animate-pulse text-primary" />
                    <p className="text-muted-foreground">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    const displayName = profile?.display_name || "Student";
    const goalProgress = Math.min(
        (dailyGoal.questionsAnswered / (dailyGoal.goalTarget || 10)) * 100,
        100
    );
    const xpInLevel = xp.totalXp % getXpForLevel(xp.level);
    const xpForNext = getXpForLevel(xp.level);

    return (
        <div className="min-h-screen bg-background pb-8">
            {/* Trial banner */}
            {internalTrialActive && trialDaysRemaining !== null && trialDaysRemaining <= 3 && (
                <div className="bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground">
                    {trialDaysRemaining <= 0
                        ? "Your trial has expired. "
                        : `${trialDaysRemaining} day${trialDaysRemaining !== 1 ? "s" : ""} left in your trial. `}
                    <Link href="/subscription" className="underline">
                        Upgrade now
                    </Link>
                </div>
            )}

            {/* Header */}
            <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
                <div className="container flex h-14 items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <Brain className="h-6 w-6 text-primary" />
                        <span className="text-lg font-bold">MasteryMind</span>
                    </div>
                    <nav className="flex items-center gap-1">
                        <Link
                            href="/stats"
                            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                            title="Stats"
                        >
                            <BarChart3 className="h-5 w-5" />
                        </Link>
                        <Link
                            href="/profile"
                            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                            title="Profile"
                        >
                            <Settings className="h-5 w-5" />
                        </Link>
                        <button
                            onClick={() => signOut()}
                            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                            title="Sign out"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </nav>
                </div>
            </header>

            <main className="container space-y-6 px-4 py-6">
                {/* First-time walkthrough */}
                <FirstTimeWalkthrough />

                {/* Return visit celebration */}
                <ReturnVisitCelebration />

                {/* Welcome */}
                <div>
                    <h1 className="text-2xl font-bold">
                        {isPrimaryMode
                            ? `Hey ${displayName}! 👋`
                            : `Welcome back, ${displayName}`}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {isPrimaryMode
                            ? "Ready to learn something awesome today?"
                            : `${profile?.year_group || ""} — Let's make progress.`}
                    </p>
                </div>

                {/* Streak / Goal / XP / Level grid */}
                {!streaksLoading && (
                    <section className="grid grid-cols-2 gap-3">
                        {/* Streak */}
                        <div
                            className={`rounded-xl border p-3 shadow-sm ${streak.currentStreak >= 3
                                ? "border-orange-400/30 bg-gradient-to-br from-orange-400/15 to-orange-400/5"
                                : "border-border bg-card"
                                }`}
                        >
                            <div className="mb-1 flex items-center gap-2">
                                <Flame
                                    className={`h-5 w-5 ${streak.currentStreak >= 3 ? "text-orange-500" : "text-muted-foreground"}`}
                                />
                                <span className="text-xs font-medium text-muted-foreground">
                                    {isPrimaryMode ? "Streak 🔥" : "Streak"}
                                </span>
                            </div>
                            <p className="text-2xl font-bold">
                                {streak.currentStreak}{" "}
                                <span className="text-sm font-normal text-muted-foreground">
                                    days
                                </span>
                            </p>
                            {streak.longestStreak > streak.currentStreak && (
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Best: {streak.longestStreak} days
                                </p>
                            )}
                        </div>

                        {/* Daily Goal */}
                        <div
                            className={`rounded-xl border p-3 shadow-sm ${dailyGoal.completed
                                ? "border-green-500/30 bg-gradient-to-br from-green-500/15 to-green-500/5"
                                : "border-border bg-card"
                                }`}
                        >
                            <div className="mb-1 flex items-center gap-2">
                                <Target
                                    className={`h-5 w-5 ${dailyGoal.completed ? "text-green-500" : "text-muted-foreground"}`}
                                />
                                <span className="text-xs font-medium text-muted-foreground">
                                    {isPrimaryMode ? "Daily Goal 🎯" : "Daily Goal"}
                                </span>
                            </div>
                            <p className="mb-1 text-sm font-semibold">
                                {dailyGoal.questionsAnswered}/{dailyGoal.goalTarget}
                                {dailyGoal.completed && (
                                    <span className="ml-1 text-green-500">✓</span>
                                )}
                            </p>
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-primary transition-all"
                                    style={{ width: `${goalProgress}%` }}
                                />
                            </div>
                        </div>

                        {/* XP */}
                        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                            <div className="mb-1 flex items-center gap-2">
                                <Zap className="h-5 w-5 text-primary" />
                                <span className="text-xs font-medium text-muted-foreground">
                                    {isPrimaryMode ? "XP ⚡" : "Experience"}
                                </span>
                            </div>
                            <p className="text-2xl font-bold">
                                {xp.totalXp.toLocaleString()}
                            </p>
                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-primary transition-all"
                                    style={{
                                        width: `${xpForNext > 0 ? (xpInLevel / xpForNext) * 100 : 0}%`,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Level */}
                        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                            <div className="mb-1 flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-primary" />
                                <span className="text-xs font-medium text-muted-foreground">
                                    {isPrimaryMode ? "Level 🏆" : "Level"}
                                </span>
                            </div>
                            <p className="text-2xl font-bold">{xp.level}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {xpForNext - xpInLevel} XP to next
                            </p>
                        </div>
                    </section>
                )}

                {/* Activity Heatmap + Due Reviews */}
                <ActivityHeatmap />
                <DueReviewsCard />

                {/* Smart Nudge — AI-suggested next action */}
                {!loading && subjects.length > 0 && (() => {
                    const weakestSubject = subjects.reduce((w, s) => s.totalMastery < w.totalMastery ? s : w, subjects[0]);
                    const weakestTopic = weakestSubject.topics.reduce((w, t) => t.mastery < w.mastery ? t : w, weakestSubject.topics[0]);
                    const hasProgress = subjects.some(s => s.topicsPracticed > 0);

                    const nudge = !hasProgress
                        ? { text: "Start your first quiz to begin building mastery!", action: `/quiz/topic?name=${encodeURIComponent(weakestTopic?.name || '')}&subject=${weakestSubject.id}&count=5`, cta: "Start First Quiz" }
                        : weakestTopic && weakestTopic.mastery < 30
                            ? { text: `"${weakestTopic.name}" needs attention — practice to boost your score.`, action: `/quiz/topic?name=${encodeURIComponent(weakestTopic.name)}&subject=${weakestSubject.id}&count=5`, cta: "Practice Now" }
                            : { text: `Great progress in ${weakestSubject.name}! Keep the momentum going.`, action: `/quiz/topic?name=${encodeURIComponent(weakestTopic?.name || '')}&subject=${weakestSubject.id}&count=5`, cta: "Continue" };

                    return (
                        <Link
                            href={nudge.action}
                            className="flex items-center gap-3 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-4 transition-all hover:from-primary/10 hover:to-primary/15"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                <Lightbulb className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-primary">Suggested Next Step</p>
                                <p className="truncate text-sm text-muted-foreground">{nudge.text}</p>
                            </div>
                            <span className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                                {nudge.cta}
                            </span>
                        </Link>
                    );
                })()}

                {/* Quick Start card for new users */}
                {!loading && subjects.length > 0 && !subjects.some(s => s.topicsPracticed > 0) && (
                    <Link
                        href="/quickstart"
                        className="flex items-center gap-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 transition-all hover:border-primary/50 hover:bg-primary/10"
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20">
                            <Rocket className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold">
                                {isPrimaryMode ? "Try QuickStart! 🚀" : "Quick Start"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Answer one question right now — no setup needed
                            </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-primary" />
                    </Link>
                )}

                {/* Stats summary */}
                {!loading && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-border bg-card p-4 text-center">
                            <p
                                className={`text-3xl font-bold ${getMasteryClass(overallMastery)}`}
                            >
                                {overallMastery}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {isPrimaryMode ? "Overall Score 📊" : "Overall Mastery"}
                            </p>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-4 text-center">
                            <p className="text-3xl font-bold text-primary">{totalTopics}</p>
                            <p className="text-xs text-muted-foreground">
                                {isPrimaryMode ? "Topics Available 📚" : "Topics"}
                            </p>
                        </div>
                    </div>
                )}

                {/* Quick actions */}
                <div className="flex flex-wrap gap-2">
                    <Link
                        href="/wrong-answers"
                        className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
                    >
                        <Target className="h-4 w-4" />
                        {isPrimaryMode ? "Level Up 🚀" : "Wrong Answers"}
                    </Link>
                    <Link
                        href="/interleaved-builder"
                        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
                    >
                        <Shuffle className="h-4 w-4" />
                        {isPrimaryMode ? "Mix It Up 🎲" : "Interleaved"}
                    </Link>
                    <Link
                        href="/leaderboard"
                        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
                    >
                        <Trophy className="h-4 w-4" />
                        Leaderboard
                    </Link>
                </div>

                {/* Subjects & Topics */}
                <section className="space-y-3">
                    <div>
                        <h2 className="text-lg font-semibold">
                            {isPrimaryMode ? "Your Subjects! 📚" : "Subjects & Topics"}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {isPrimaryMode
                                ? "Tap a subject to see topics, then quiz away!"
                                : "Expand subjects to view topics and start practising."}
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : subjects.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border py-12 text-center">
                            <GraduationCap className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                            <p className="font-medium">No subjects yet</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Add subjects to start your revision journey.
                            </p>
                            <Link
                                href="/profile"
                                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
                            >
                                <Settings className="h-4 w-4" /> Set up subjects
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {subjects.map((subject) => {
                                const isExpanded = expandedSubject === subject.id;

                                return (
                                    <div
                                        key={subject.id}
                                        className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                                    >
                                        {/* Subject header */}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setExpandedSubject(isExpanded ? null : subject.id)
                                            }
                                            className={`flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50 ${isExpanded ? "border-b border-border" : ""
                                                }`}
                                        >
                                            <div
                                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                                                style={{
                                                    backgroundColor: `${subject.color || "#6366f1"}20`,
                                                }}
                                            >
                                                <BookOpen
                                                    className="h-5 w-5"
                                                    style={{ color: subject.color || "#6366f1" }}
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-semibold">{subject.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {subject.topicsPracticed}/{subject.topics.length}{" "}
                                                    topics • {subject.totalMastery}% mastery
                                                </p>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                <span
                                                    className={`text-sm font-bold ${getMasteryClass(subject.totalMastery)}`}
                                                >
                                                    {subject.totalMastery}%
                                                </span>
                                                {isExpanded ? (
                                                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                                ) : (
                                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </div>
                                        </button>

                                        {/* Topics */}
                                        {isExpanded && (
                                            <div className="space-y-1 bg-muted/30 p-2">
                                                {subject.topics.map((topic) => (
                                                    <Link
                                                        key={topic.id}
                                                        href={`/quiz/topic?name=${encodeURIComponent(topic.name)}&subject=${subject.id}&curriculum=${topic.curriculumContentId || topic.id}&count=5`}
                                                        className="flex items-center gap-3 rounded-lg bg-background p-3 transition-colors hover:bg-muted"
                                                    >
                                                        <Sparkles className="h-4 w-4 shrink-0 text-primary/60" />
                                                        <span className="flex-1 truncate text-sm font-medium">
                                                            {topic.name}
                                                        </span>
                                                        {topic.mastery > 0 && (
                                                            <span
                                                                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${topic.mastery >= 80
                                                                    ? "bg-green-500/10 text-green-500"
                                                                    : topic.mastery >= 50
                                                                        ? "bg-yellow-500/10 text-yellow-500"
                                                                        : "bg-red-500/10 text-red-500"
                                                                    }`}
                                                            >
                                                                {topic.mastery}%
                                                            </span>
                                                        )}
                                                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
