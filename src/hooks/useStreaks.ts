"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string | null;
}

interface DailyGoalData {
    questionsAnswered: number;
    goalTarget: number;
    completed: boolean;
}

interface XpData {
    totalXp: number;
    weeklyXp: number;
    level: number;
}

export function useStreaks(userId: string | undefined) {
    const [streak, setStreak] = useState<StreakData>({
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
    });
    const [dailyGoal, setDailyGoal] = useState<DailyGoalData>({
        questionsAnswered: 0,
        goalTarget: 10,
        completed: false,
    });
    const [xp, setXp] = useState<XpData>({
        totalXp: 0,
        weeklyXp: 0,
        level: 1,
    });
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        const supabase = createClient();

        try {
            const [streakRes, goalRes, xpRes] = await Promise.all([
                supabase
                    .from("user_streaks")
                    .select("*")
                    .eq("user_id", userId)
                    .maybeSingle(),
                supabase
                    .from("user_daily_goals")
                    .select("*")
                    .eq("user_id", userId)
                    .eq("goal_date", new Date().toISOString().split("T")[0])
                    .maybeSingle(),
                supabase
                    .from("user_xp")
                    .select("*")
                    .eq("user_id", userId)
                    .maybeSingle(),
            ]);

            if (streakRes.data) {
                setStreak({
                    currentStreak: streakRes.data.current_streak,
                    longestStreak: streakRes.data.longest_streak,
                    lastActivityDate: streakRes.data.last_activity_date,
                });
            }

            if (goalRes.data) {
                setDailyGoal({
                    questionsAnswered: goalRes.data.questions_answered,
                    goalTarget: goalRes.data.goal_target,
                    completed: goalRes.data.completed,
                });
            }

            if (xpRes.data) {
                setXp({
                    totalXp: xpRes.data.total_xp,
                    weeklyXp: xpRes.data.weekly_xp,
                    level: xpRes.data.level,
                });
            }
        } catch (err) {
            console.error("[useStreaks] fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const recordActivity = useCallback(async () => {
        if (!userId) return;
        const supabase = createClient();
        try {
            const [streakResult, goalResult] = await Promise.all([
                supabase.rpc("update_user_streak", { p_user_id: userId }),
                supabase.rpc("increment_daily_goal", {
                    p_user_id: userId,
                    p_count: 1,
                }),
            ]);

            if (streakResult.data) {
                const d = streakResult.data as Record<string, unknown>;
                setStreak({
                    currentStreak: (d.current_streak as number) ?? 0,
                    longestStreak: (d.longest_streak as number) ?? 0,
                    lastActivityDate: (d.last_activity_date as string) ?? null,
                });
            }
            if (goalResult.data) {
                const d = goalResult.data as Record<string, unknown>;
                setDailyGoal({
                    questionsAnswered: (d.questions_answered as number) ?? 0,
                    goalTarget: (d.goal_target as number) ?? 10,
                    completed: (d.completed as boolean) ?? false,
                });
            }
        } catch (err) {
            console.error("[useStreaks] recordActivity error:", err);
        }
    }, [userId]);

    return { streak, dailyGoal, xp, loading, recordActivity, refetch: fetchAll };
}
