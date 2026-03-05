"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useUserProfile } from "@/contexts/user-profile-context";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
    Sparkles,
    ArrowRight,
    BookOpen,
    Calculator,
    Loader2,
    CheckCircle2,
    XCircle,
} from "lucide-react";

type Stage = "loading" | "ready" | "question" | "feedback";

interface QuickQuestion {
    question_text: string;
    correct_answer: string;
    distractors: string[];
    explanation: string;
    concept_tag: string;
    difficulty_tier: number;
}

export default function QuickStartPage() {
    const { user, loading: authLoading } = useAuth();
    const { profile, isPrimaryMode } = useUserProfile();
    const router = useRouter();
    const supabase = createClient();

    const [stage, setStage] = useState<Stage>("loading");
    const [question, setQuestion] = useState<QuickQuestion | null>(null);
    const [shuffledAnswers, setShuffledAnswers] = useState<string[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState(false);
    const [subjectChoice, setSubjectChoice] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace("/auth");
        } else if (!authLoading && user && !profile?.year_group) {
            router.replace("/onboarding");
        } else if (!authLoading && user && profile?.year_group) {
            setStage("ready");
        }
    }, [authLoading, user, profile, router]);

    const generateQuestion = useCallback(
        async (subject: "maths" | "english") => {
            setSubjectChoice(subject);
            setStage("loading");

            const yearGroup = profile?.year_group || "Year 7";
            const isPrimary = ["Year 3", "Year 4", "Year 5", "Year 6"].includes(
                yearGroup
            );

            const topicTitle =
                subject === "maths"
                    ? isPrimary
                        ? "Basic Arithmetic"
                        : "Number Skills"
                    : isPrimary
                        ? "Reading Comprehension"
                        : "Language Analysis";

            try {
                const { data, error } = await supabase.functions.invoke(
                    "generate-quiz",
                    {
                        body: {
                            topicTitle,
                            yearGroup,
                            count: 1,
                            difficulty: isPrimary ? 1 : 2,
                        },
                    }
                );

                if (error || !data?.questions?.length) {
                    toast.error("Failed to generate question. Try the dashboard instead.");
                    router.push("/dashboard");
                    return;
                }

                const q = data.questions[0];
                setQuestion(q);
                const answers = [q.correct_answer, ...q.distractors].sort(
                    () => Math.random() - 0.5
                );
                setShuffledAnswers(answers);
                setStage("question");
            } catch {
                toast.error("Something went wrong");
                router.push("/dashboard");
            }
        },
        [supabase, profile, router]
    );

    const handleSelectAnswer = (answer: string) => {
        if (selectedAnswer) return;
        setSelectedAnswer(answer);
        const correct = answer === question?.correct_answer;
        setIsCorrect(correct);
        setStage("feedback");
    };

    const handleContinue = () => {
        toast.success(
            isPrimaryMode ? "Great start! Keep learning! 🌟" : "Well done! Explore more topics."
        );
        router.push("/dashboard");
    };

    const isPrimary = ["Year 3", "Year 4", "Year 5", "Year 6"].includes(
        profile?.year_group || ""
    );

    if (authLoading || stage === "loading") {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="mt-4 animate-pulse text-muted-foreground">
                    {stage === "loading" && subjectChoice
                        ? "Creating your first question..."
                        : "Getting ready..."}
                </p>
            </div>
        );
    }

    // Subject choice
    if (stage === "ready") {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
                <div className="w-full max-w-md space-y-6">
                    <div className="space-y-2 text-center">
                        <Sparkles className="mx-auto h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold">
                            {isPrimary ? "Let's Learn! 🚀" : "Ready to Start?"}
                        </h1>
                        <p className="text-muted-foreground">
                            {isPrimary
                                ? "Pick a subject to try your first question!"
                                : "Choose a subject to dive right in"}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => generateQuestion("maths")}
                            className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/50 hover:shadow-md active:scale-[0.98]"
                        >
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                <Calculator className="h-8 w-8 text-primary" />
                            </div>
                            <span className="text-lg font-semibold">Maths</span>
                        </button>

                        <button
                            onClick={() => generateQuestion("english")}
                            className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/50 hover:shadow-md active:scale-[0.98]"
                        >
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
                                <BookOpen className="h-8 w-8 text-blue-500" />
                            </div>
                            <span className="text-lg font-semibold">English</span>
                        </button>
                    </div>

                    <Link
                        href="/dashboard"
                        className="block w-full rounded-lg py-2.5 text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        Skip to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    // Question + feedback
    return (
        <div className="flex min-h-screen items-start justify-center bg-background p-4 pt-12">
            <div className="w-full max-w-lg space-y-6">
                {/* Progress dots */}
                <div className="flex items-center justify-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <div className="h-2 w-2 rounded-full bg-muted" />
                    <div className="h-2 w-2 rounded-full bg-muted" />
                </div>

                {question && (
                    <>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 capitalize text-primary">
                                    {subjectChoice}
                                </span>
                                {question.concept_tag && (
                                    <span className="rounded-full bg-muted px-2 py-0.5">
                                        {question.concept_tag}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-xl font-bold">{question.question_text}</h2>
                        </div>

                        <div className="space-y-3">
                            {shuffledAnswers.map((answer, idx) => {
                                const isSelected = selectedAnswer === answer;
                                const isCorrectAnswer = answer === question.correct_answer;
                                const isAnswered = !!selectedAnswer;

                                let styles =
                                    "border-border bg-card hover:border-primary/50 hover:bg-primary/5";
                                if (isAnswered) {
                                    if (isCorrectAnswer) {
                                        styles = "border-green-500 bg-green-500/10";
                                    } else if (isSelected) {
                                        styles = "border-red-500 bg-red-500/10";
                                    } else {
                                        styles = "border-border bg-card opacity-50";
                                    }
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelectAnswer(answer)}
                                        disabled={isAnswered}
                                        className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all ${styles} disabled:cursor-default`}
                                    >
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                        <span className="flex-1 text-sm font-medium">{answer}</span>
                                        {isAnswered && isCorrectAnswer && (
                                            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                                        )}
                                        {isAnswered && isSelected && !isCorrectAnswer && (
                                            <XCircle className="h-5 w-5 shrink-0 text-red-500" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Feedback */}
                        {stage === "feedback" && (
                            <div
                                className={`rounded-xl border-2 p-4 ${isCorrect
                                        ? "border-green-500 bg-green-500/5"
                                        : "border-yellow-500 bg-yellow-500/5"
                                    }`}
                            >
                                <div className="mb-3 flex items-center gap-2">
                                    <span className="text-2xl">
                                        {isCorrect ? "🎉" : "💪"}
                                    </span>
                                    <span className="text-lg font-semibold">
                                        {isCorrect
                                            ? isPrimary
                                                ? "Amazing!"
                                                : "Correct!"
                                            : isPrimary
                                                ? "Good try!"
                                                : "Not quite"}
                                    </span>
                                </div>

                                {question.explanation && (
                                    <p className="mb-4 text-sm text-muted-foreground">
                                        {question.explanation}
                                    </p>
                                )}

                                <button
                                    onClick={handleContinue}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                                >
                                    {isPrimary
                                        ? "Go to Dashboard! 🚀"
                                        : "Continue to Dashboard"}
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
