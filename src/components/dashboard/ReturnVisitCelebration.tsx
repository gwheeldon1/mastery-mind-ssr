"use client";

import { useState, useEffect } from "react";
import { Flame, X } from "lucide-react";

export function ReturnVisitCelebration() {
    const [visible, setVisible] = useState(false);
    const [daysSince, setDaysSince] = useState(0);

    useEffect(() => {
        const lastVisit = localStorage.getItem("mm_last_dashboard_visit");
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];

        if (lastVisit && lastVisit !== todayStr) {
            const last = new Date(lastVisit);
            const diffDays = Math.floor(
                (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (diffDays >= 1) {
                setDaysSince(diffDays);
                setVisible(true);
                // Auto dismiss after 4 seconds
                const timer = setTimeout(() => setVisible(false), 4000);
                // Update last visit
                localStorage.setItem("mm_last_dashboard_visit", todayStr);
                return () => clearTimeout(timer);
            }
        }

        // Always update last visit
        localStorage.setItem("mm_last_dashboard_visit", todayStr);
    }, []);

    if (!visible) return null;

    const message =
        daysSince === 1
            ? "Welcome back! Great to see you again! 🎉"
            : daysSince <= 3
                ? `${daysSince} days away — let's get back on track! 💪`
                : `${daysSince} days away — it's never too late to restart! 🚀`;

    return (
        <div className="animate-in slide-in-from-top-2 fade-in rounded-xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-amber-500/10 p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/20">
                        <Flame className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold">{message}</p>
                        <p className="text-xs text-muted-foreground">
                            Answer 5 questions today to rebuild your streak
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setVisible(false)}
                    className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
