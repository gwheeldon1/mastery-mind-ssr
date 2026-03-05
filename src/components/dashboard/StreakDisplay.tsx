"use client";

/**
 * StreakDisplay — Animated streak counter with fire emoji and motivational messaging.
 * Shows current streak, best streak, and adapts visuals for milestones.
 */

import { Flame } from "lucide-react";

interface StreakDisplayProps {
    currentStreak: number;
    bestStreak: number;
    className?: string;
}

export function StreakDisplay({ currentStreak, bestStreak, className = "" }: StreakDisplayProps) {
    if (currentStreak <= 0) return null;

    const isMilestone = currentStreak % 5 === 0;
    const isNewRecord = currentStreak >= bestStreak && bestStreak > 0;

    const getStreakMessage = () => {
        if (currentStreak >= 30) return "Legendary! 👑";
        if (currentStreak >= 14) return "Unstoppable! 🔥";
        if (currentStreak >= 7) return "One week strong! 💪";
        if (currentStreak >= 3) return "Building momentum! ⚡";
        return "Keep going! 🌟";
    };

    return (
        <div
            className={`flex items-center gap-3 rounded-xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-amber-500/5 p-3 ${className}`}
        >
            <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/20 ${isMilestone ? "animate-bounce" : ""}`}>
                <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                        {currentStreak} day{currentStreak !== 1 ? "s" : ""}
                    </span>
                    {isNewRecord && (
                        <span className="rounded-full bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-bold text-orange-600">
                            NEW BEST
                        </span>
                    )}
                </div>
                <p className="text-xs text-muted-foreground">{getStreakMessage()}</p>
            </div>
            {bestStreak > 0 && !isNewRecord && (
                <div className="text-right">
                    <p className="text-xs text-muted-foreground">Best</p>
                    <p className="text-sm font-semibold">{bestStreak}</p>
                </div>
            )}
        </div>
    );
}
