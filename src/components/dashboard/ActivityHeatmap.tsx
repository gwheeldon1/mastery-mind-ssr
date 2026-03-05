"use client";

/**
 * Activity Heatmap — GitHub-style weekly activity bar chart.
 * Queries activity_log + blurt_sessions for the last 12 weeks.
 */

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { useUserProfile } from "@/contexts/user-profile-context";
import { Flame, Loader2 } from "lucide-react";

interface ActivityData {
    date: string;
    count: number;
}

function formatDate(d: Date): string {
    return d.toISOString().slice(0, 10);
}

function subDays(d: Date, n: number): Date {
    const r = new Date(d);
    r.setDate(r.getDate() - n);
    return r;
}

function dayLetter(d: Date): string {
    return ["S", "M", "T", "W", "T", "F", "S"][d.getDay()];
}

function isSameDay(a: Date, b: Date): boolean {
    return formatDate(a) === formatDate(b);
}

function ActivityHeatmapInner() {
    const { user } = useAuth();
    const { isPrimaryMode } = useUserProfile();
    const supabase = createClient();

    const [activityData, setActivityData] = useState<ActivityData[]>([]);
    const [streak, setStreak] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchActivity = useCallback(async () => {
        if (!user) return;
        const startDate = subDays(new Date(), 84);

        const [quizRes, blurtRes] = await Promise.all([
            supabase
                .from("activity_log")
                .select("created_at")
                .eq("user_id", user.id)
                .gte("created_at", startDate.toISOString()),
            supabase
                .from("blurt_sessions")
                .select("created_at")
                .eq("user_id", user.id)
                .gte("created_at", startDate.toISOString()),
        ]);

        const map: Record<string, number> = {};
        (quizRes.data || []).forEach((a) => {
            const d = formatDate(new Date(a.created_at));
            map[d] = (map[d] || 0) + 1;
        });
        (blurtRes.data || []).forEach((a) => {
            if (a.created_at) {
                const d = formatDate(new Date(a.created_at));
                map[d] = (map[d] || 0) + 1;
            }
        });

        const activities = Object.entries(map).map(([date, count]) => ({
            date,
            count,
        }));
        setActivityData(activities);

        // Streak calc
        const activeDates = new Set(activities.map((a) => a.date));
        const today = new Date();
        let checkDate = activeDates.has(formatDate(today)) ? today : subDays(today, 1);
        let s = 0;
        for (let i = 0; i < 365; i++) {
            if (activeDates.has(formatDate(checkDate))) {
                s++;
                checkDate = subDays(checkDate, 1);
            } else break;
        }
        setStreak(s);
        setLoading(false);
    }, [user, supabase]);

    useEffect(() => {
        if (user) fetchActivity();
    }, [user, fetchActivity]);

    const activityMap = useMemo(() => {
        const m = new Map<string, number>();
        activityData.forEach((a) => m.set(a.date, a.count));
        return m;
    }, [activityData]);

    const thisWeekActivity = useMemo(
        () =>
            activityData
                .filter((a) => new Date(a.date) >= subDays(new Date(), 7))
                .reduce((sum, a) => sum + a.count, 0),
        [activityData]
    );

    const getLevel = (d: Date): number => {
        const c = activityMap.get(formatDate(d));
        if (!c) return 0;
        if (c >= 10) return 4;
        if (c >= 5) return 3;
        if (c >= 2) return 2;
        return 1;
    };

    const colorClass = (l: number): string => {
        const map: Record<number, string> = {
            0: "bg-muted",
            1: "bg-primary/30",
            2: "bg-primary/50",
            3: "bg-primary/70",
            4: "bg-primary",
        };
        return map[l] || "bg-muted";
    };

    if (loading) {
        return (
            <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            {/* Stats row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 ${streak > 0
                                ? "border border-orange-500/30 bg-gradient-to-r from-orange-500/20 to-red-500/20"
                                : "bg-muted"
                            }`}
                    >
                        <Flame
                            className={`h-5 w-5 ${streak > 0 ? "text-orange-500 animate-pulse" : "text-muted-foreground"}`}
                        />
                        <div className="flex flex-col">
                            <span
                                className={`text-lg font-bold leading-none ${streak > 0 ? "text-orange-500" : "text-muted-foreground"
                                    }`}
                            >
                                {streak}
                            </span>
                            <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                                day streak
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-6 text-center">
                    <div>
                        <p className="text-base font-bold">{thisWeekActivity}</p>
                        <p className="text-[9px] uppercase text-muted-foreground">This week</p>
                    </div>
                    <div>
                        <p className="text-base font-bold">{activityData.length}</p>
                        <p className="text-[9px] uppercase text-muted-foreground">Days active</p>
                    </div>
                </div>
            </div>

            {/* Weekly bar chart */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                        {isPrimaryMode ? "This week's progress" : "Weekly activity"}
                    </span>
                    <span className="font-medium">
                        {Math.min(
                            activityData.filter(
                                (a) => new Date(a.date) >= subDays(new Date(), 7)
                            ).length,
                            7
                        )}
                        /7 days
                    </span>
                </div>
                <div className="flex gap-1">
                    {Array.from({ length: 7 }).map((_, i) => {
                        const d = subDays(new Date(), 6 - i);
                        const level = getLevel(d);
                        const today = isSameDay(d, new Date());
                        return (
                            <div key={i} className="flex flex-1 flex-col items-center gap-1">
                                <div
                                    className={`h-8 w-full rounded-lg transition-all ${colorClass(level)} ${today ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""
                                        } ${level > 0 ? "shadow-sm" : ""}`}
                                />
                                <span
                                    className={`text-[10px] ${today ? "font-bold text-primary" : "text-muted-foreground"}`}
                                >
                                    {dayLetter(d)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Motivational message */}
            {streak === 0 && (
                <p className="text-center text-sm text-muted-foreground">
                    {isPrimaryMode
                        ? "Complete a quiz or blurt to start your streak! 🚀"
                        : "Start studying today to build your streak"}
                </p>
            )}
            {streak > 0 && streak < 7 && (
                <p className="text-center text-sm text-muted-foreground">
                    {isPrimaryMode
                        ? `${7 - streak} more days to hit a week! Keep going! 💪`
                        : `${7 - streak} days until your first weekly streak`}
                </p>
            )}
            {streak >= 7 && (
                <p className="text-center text-sm font-medium text-primary">
                    {isPrimaryMode
                        ? "You're on fire! Amazing streak! 🔥🔥🔥"
                        : "Excellent consistency - keep it up!"}
                </p>
            )}
        </div>
    );
}

export const ActivityHeatmap = memo(ActivityHeatmapInner);
