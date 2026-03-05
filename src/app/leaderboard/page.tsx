"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import {
    Trophy,
    Medal,
    Crown,
    Flame,
    ArrowLeft,
    Users,
    Star,
    Loader2,
    Calendar,
} from "lucide-react";

type TimePeriod = "week" | "month" | "all";

interface LeaderboardEntry {
    xp_earned: number;
    questions_correct: number;
    current_streak: number;
    display_name: string | null;
    avatar_id: string | null;
    avatar_bg_color: string | null;
    rank: number;
    is_current_user?: boolean;
}

interface Subject {
    id: string;
    name: string;
    icon: string | null;
}

function getWeekStartString() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart.toISOString().split("T")[0];
}

function RankIcon({ rank }: { rank: number }) {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return (
        <span className="w-5 text-center text-sm font-bold text-muted-foreground">
            {rank}
        </span>
    );
}

function getRankStyle(rank: number, isCurrentUser: boolean) {
    if (isCurrentUser) return "bg-primary/10 border-primary";
    if (rank === 1) return "bg-yellow-500/10 border-yellow-500/30";
    if (rank === 2) return "bg-gray-400/10 border-gray-400/30";
    if (rank === 3) return "bg-amber-600/10 border-amber-600/30";
    return "bg-card border-border";
}

function AvatarCircle({
    name,
    bgColor,
}: {
    name: string;
    bgColor: string | null;
}) {
    const initial = (name || "?")[0].toUpperCase();
    const colors: Record<string, string> = {
        cyan: "bg-cyan-500",
        blue: "bg-blue-500",
        purple: "bg-purple-500",
        green: "bg-green-500",
        orange: "bg-orange-500",
        pink: "bg-pink-500",
        red: "bg-red-500",
    };
    const bg = colors[bgColor || "cyan"] || "bg-cyan-500";

    return (
        <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${bg}`}
        >
            {initial}
        </div>
    );
}

function EntryRow({
    entry,
    showStreak,
}: {
    entry: LeaderboardEntry;
    showStreak: boolean;
}) {
    const isCurrentUser = entry.is_current_user;
    return (
        <div
            className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${getRankStyle(entry.rank, !!isCurrentUser)}`}
        >
            <div className="flex w-8 justify-center">
                <RankIcon rank={entry.rank} />
            </div>

            <AvatarCircle
                name={entry.display_name || "?"}
                bgColor={entry.avatar_bg_color}
            />

            <div className="min-w-0 flex-1">
                <p
                    className={`truncate font-medium ${isCurrentUser ? "text-primary" : ""}`}
                >
                    {isCurrentUser ? "You" : entry.display_name || "Anonymous"}
                </p>
                <p className="text-xs text-muted-foreground">
                    {entry.questions_correct} correct answers
                </p>
            </div>

            {showStreak && entry.current_streak > 0 && (
                <div className="flex items-center gap-1 text-orange-500">
                    <Flame className="h-4 w-4" />
                    <span className="text-sm font-medium">{entry.current_streak}</span>
                </div>
            )}

            <div className="text-right">
                <p className="text-lg font-bold">{entry.xp_earned}</p>
                <p className="text-xs text-muted-foreground">XP</p>
            </div>
        </div>
    );
}

export default function LeaderboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const supabase = createClient();

    const [globalLeaderboard, setGlobalLeaderboard] = useState<
        LeaderboardEntry[]
    >([]);
    const [subjectLeaderboard, setSubjectLeaderboard] = useState<
        LeaderboardEntry[]
    >([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"global" | "subject">("global");
    const [timePeriod, setTimePeriod] = useState<TimePeriod>("week");

    useEffect(() => {
        if (!authLoading && !user) router.replace("/auth");
    }, [authLoading, user, router]);

    const fetchSubjects = useCallback(async () => {
        const { data } = await supabase
            .from("subjects")
            .select("id, name, icon")
            .order("name");
        if (data) {
            setSubjects(data);
            if (data.length > 0) setSelectedSubject(data[0].id);
        }
    }, [supabase]);

    const fetchGlobalLeaderboard = useCallback(async () => {
        setLoading(true);
        const { data: leaderboardData } = await supabase.rpc(
            "get_weekly_leaderboard",
            { limit_count: 10 }
        );

        if (leaderboardData && leaderboardData.length > 0) {
            const entries: LeaderboardEntry[] = leaderboardData.map(
                (entry: any) => ({
                    display_name: entry.display_name || "Anonymous",
                    avatar_id: entry.avatar_id || "fox",
                    avatar_bg_color: entry.avatar_bg_color || "cyan",
                    xp_earned: entry.xp_earned,
                    questions_correct: entry.questions_correct,
                    current_streak: entry.current_streak,
                    rank: Number(entry.rank),
                    is_current_user: entry.is_current_user,
                })
            );
            setGlobalLeaderboard(entries);

            const userEntry = entries.find((e) => e.is_current_user);
            if (userEntry) {
                setUserRank(userEntry);
            } else if (user) {
                // User not in top 10, fetch their rank
                const weekStartStr = getWeekStartString();
                const { data: userXp } = await supabase
                    .from("user_weekly_xp")
                    .select("xp_earned, questions_correct, current_streak")
                    .eq("user_id", user.id)
                    .eq("week_start", weekStartStr)
                    .maybeSingle();

                if (userXp) {
                    const { count } = await supabase
                        .from("user_weekly_xp")
                        .select("*", { count: "exact", head: true })
                        .eq("week_start", weekStartStr)
                        .gt("xp_earned", userXp.xp_earned);

                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("display_name, avatar_id, avatar_bg_color")
                        .eq("id", user.id)
                        .maybeSingle();

                    setUserRank({
                        xp_earned: userXp.xp_earned,
                        questions_correct: userXp.questions_correct,
                        current_streak: userXp.current_streak,
                        display_name: profile?.display_name || "You",
                        avatar_id: profile?.avatar_id || "fox",
                        avatar_bg_color: profile?.avatar_bg_color || "cyan",
                        rank: (count || 0) + 1,
                        is_current_user: true,
                    });
                }
            }
        }
        setLoading(false);
    }, [supabase, user]);

    const fetchSubjectLeaderboard = useCallback(
        async (subjectId: string) => {
            const weekStartStr = getWeekStartString();
            const { data: leaderboardData } = await supabase
                .from("user_subject_xp")
                .select("xp_earned, questions_correct, user_id")
                .eq("subject_id", subjectId)
                .eq("week_start", weekStartStr)
                .order("xp_earned", { ascending: false })
                .limit(10);

            if (leaderboardData && leaderboardData.length > 0) {
                const userIds = leaderboardData.map((e: any) => e.user_id);
                const { data: profiles } = await supabase
                    .from("profiles")
                    .select("id, display_name, avatar_id, avatar_bg_color")
                    .in("id", userIds);

                const profileMap = new Map(
                    profiles?.map((p: any) => [p.id, p]) || []
                );

                const entries: LeaderboardEntry[] = leaderboardData.map(
                    (entry: any, index: number) => {
                        const profile = profileMap.get(entry.user_id) as any;
                        return {
                            xp_earned: entry.xp_earned,
                            questions_correct: entry.questions_correct,
                            current_streak: 0,
                            display_name: profile?.display_name || "Anonymous",
                            avatar_id: profile?.avatar_id || "fox",
                            avatar_bg_color: profile?.avatar_bg_color || "cyan",
                            rank: index + 1,
                            is_current_user: entry.user_id === user?.id,
                        };
                    }
                );
                setSubjectLeaderboard(entries);
            } else {
                setSubjectLeaderboard([]);
            }
        },
        [supabase, user?.id]
    );

    useEffect(() => {
        if (user) {
            fetchSubjects();
            fetchGlobalLeaderboard();
        }
    }, [user, fetchSubjects, fetchGlobalLeaderboard, timePeriod]);

    useEffect(() => {
        if (selectedSubject) fetchSubjectLeaderboard(selectedSubject);
    }, [selectedSubject, fetchSubjectLeaderboard]);

    if (authLoading || !user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard"
                        className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="flex items-center gap-2 text-xl font-bold">
                            <Trophy className="h-5 w-5 text-yellow-500" /> Leaderboard
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {timePeriod === "week"
                                ? "This Week\u0027s Top Learners"
                                : timePeriod === "month"
                                    ? "This Month\u0027s Top Learners"
                                    : "All Time Top Learners"}
                        </p>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-2xl space-y-4 p-4">
                {/* Time period filter */}
                <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                    {[
                        { id: "week" as const, label: "Week" },
                        { id: "month" as const, label: "Month" },
                        { id: "all" as const, label: "All Time" },
                    ].map((tp) => (
                        <button
                            key={tp.id}
                            onClick={() => setTimePeriod(tp.id)}
                            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${timePeriod === tp.id
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {tp.label}
                        </button>
                    ))}
                </div>
                {/* User Rank Card */}
                {userRank && (
                    <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 p-4">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <AvatarCircle
                                    name={userRank.display_name || "You"}
                                    bgColor={userRank.avatar_bg_color}
                                />
                                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                    #{userRank.rank}
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className="text-lg font-bold">Your Ranking</p>
                                <p className="text-sm text-muted-foreground">
                                    {userRank.xp_earned} XP this week
                                </p>
                            </div>
                            {userRank.current_streak > 0 && (
                                <div className="flex items-center gap-1 rounded-full bg-orange-500/20 px-3 py-1 text-orange-500">
                                    <Flame className="h-4 w-4" />
                                    <span className="font-bold">{userRank.current_streak}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Tab Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab("global")}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${activeTab === "global"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <Users className="h-4 w-4" /> Global
                    </button>
                    <button
                        onClick={() => setActiveTab("subject")}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${activeTab === "subject"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <Star className="h-4 w-4" /> By Subject
                    </button>
                </div>

                {/* Global Tab */}
                {activeTab === "global" && (
                    <div className="rounded-xl border border-border bg-card">
                        <div className="border-b border-border p-4">
                            <h2 className="flex items-center gap-2 text-lg font-semibold">
                                <Trophy className="h-5 w-5 text-yellow-500" /> Top 10 This Week
                            </h2>
                        </div>
                        <div className="space-y-2 p-4">
                            {loading ? (
                                <div className="py-8 text-center text-muted-foreground">
                                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                </div>
                            ) : globalLeaderboard.length === 0 ? (
                                <div className="py-8 text-center text-muted-foreground">
                                    <Trophy className="mx-auto mb-2 h-12 w-12 opacity-30" />
                                    <p>No activity this week yet!</p>
                                    <p className="text-sm">
                                        Be the first to climb the leaderboard
                                    </p>
                                </div>
                            ) : (
                                globalLeaderboard.map((entry, i) => (
                                    <EntryRow key={i} entry={entry} showStreak />
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Subject Tab */}
                {activeTab === "subject" && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {subjects.map((subject) => (
                                <button
                                    key={subject.id}
                                    onClick={() => setSelectedSubject(subject.id)}
                                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${selectedSubject === subject.id
                                        ? "bg-primary text-primary-foreground"
                                        : "border border-border bg-card hover:bg-muted"
                                        }`}
                                >
                                    {subject.icon && <span className="mr-1">{subject.icon}</span>}
                                    {subject.name}
                                </button>
                            ))}
                        </div>

                        <div className="rounded-xl border border-border bg-card">
                            <div className="border-b border-border p-4">
                                <h2 className="flex items-center gap-2 text-lg font-semibold">
                                    <Star className="h-5 w-5 text-primary" />{" "}
                                    {subjects.find((s) => s.id === selectedSubject)?.name ||
                                        "Subject"}{" "}
                                    Leaders
                                </h2>
                            </div>
                            <div className="space-y-2 p-4">
                                {subjectLeaderboard.length === 0 ? (
                                    <div className="py-8 text-center text-muted-foreground">
                                        <Trophy className="mx-auto mb-2 h-12 w-12 opacity-30" />
                                        <p>No activity this week yet!</p>
                                    </div>
                                ) : (
                                    subjectLeaderboard.map((entry, i) => (
                                        <EntryRow key={i} entry={entry} showStreak={false} />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* How XP Works */}
                <div className="rounded-xl border border-border bg-muted/50 p-4">
                    <h3 className="mb-2 font-semibold">How XP Works</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>
                            • <strong>+10 XP</strong> for each correct answer
                        </li>
                        <li>
                            • <strong>+1-5 XP</strong> streak bonus (more consecutive correct
                            = more bonus!)
                        </li>
                        <li>• Leaderboard resets every Monday</li>
                    </ul>
                </div>
            </main>
        </div>
    );
}
