"use client";

import { useState, useEffect } from "react";
import {
    Sparkles,
    BookOpen,
    Brain,
    Target,
    ArrowRight,
    X,
} from "lucide-react";

const STEPS = [
    {
        title: "Welcome to MasteryMind! 🎉",
        description: "Let's take a quick tour of your dashboard.",
        icon: Sparkles,
    },
    {
        title: "Your Subjects",
        description:
            "Tap any subject to expand it, then pick a topic to start a quiz. Your mastery % updates as you practise.",
        icon: BookOpen,
    },
    {
        title: "Smart Nudges",
        description:
            "We'll suggest what to study next based on your weakest topics. Follow the nudges for the fastest progress.",
        icon: Brain,
    },
    {
        title: "Track Your Streaks",
        description:
            "Come back daily to build your streak. Hit your daily goal to earn bonus XP and climb the leaderboard!",
        icon: Target,
    },
];

export function FirstTimeWalkthrough() {
    const [visible, setVisible] = useState(false);
    const [step, setStep] = useState(0);

    useEffect(() => {
        const seen = localStorage.getItem("mm_walkthrough_seen");
        if (!seen) {
            // Small delay so dashboard loads first
            const timer = setTimeout(() => setVisible(true), 800);
            return () => clearTimeout(timer);
        }
    }, []);

    const dismiss = () => {
        setVisible(false);
        localStorage.setItem("mm_walkthrough_seen", "1");
    };

    const next = () => {
        if (step < STEPS.length - 1) {
            setStep(step + 1);
        } else {
            dismiss();
        }
    };

    if (!visible) return null;

    const current = STEPS[step];
    const Icon = current.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm animate-in fade-in zoom-in-95 rounded-2xl border border-border bg-card p-6 shadow-2xl">
                {/* Close */}
                <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                        {step + 1} of {STEPS.length}
                    </span>
                    <button
                        onClick={dismiss}
                        className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Icon */}
                <div className="mb-4 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                        <Icon className="h-8 w-8 text-primary" />
                    </div>
                </div>

                {/* Content */}
                <h2 className="mb-2 text-center text-lg font-bold">{current.title}</h2>
                <p className="mb-6 text-center text-sm text-muted-foreground">
                    {current.description}
                </p>

                {/* Progress dots */}
                <div className="mb-4 flex justify-center gap-1.5">
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-primary" : "w-1.5 bg-muted"
                                }`}
                        />
                    ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    {step > 0 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-muted"
                        >
                            Back
                        </button>
                    )}
                    <button
                        onClick={next}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        {step < STEPS.length - 1 ? (
                            <>
                                Next <ArrowRight className="h-3.5 w-3.5" />
                            </>
                        ) : (
                            "Let's Go! 🚀"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
