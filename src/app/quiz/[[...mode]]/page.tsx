"use client";

/**
 * Quiz Page — self-contained quiz engine.
 *
 * Flow: loading → question → answered → next question → results
 *
 * URL params:
 *   name        topic/subject display name
 *   subject     subject UUID
 *   curriculum  curriculum content UUID
 *   count       # questions (default 5)
 *   mode        "interleaved" for multi-topic
 *   topics      comma-separated topic IDs (interleaved)
 */

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useUserProfile } from "@/contexts/user-profile-context";
import { useAdaptiveQuiz } from "@/hooks/useAdaptiveQuiz";
import { getUserExamBoard, logQuizAnswer } from "@/actions/quiz";
import { toast } from "sonner";
import type { AIQuestion, DifficultyTier, ProblemArea } from "@/types/quiz";
import {
    ArrowLeft,
    Loader2,
    CheckCircle2,
    XCircle,
    SkipForward,
    RotateCcw,
    Trophy,
    Target,
    Zap,
    ChevronRight,
    Flame,
    Brain,
    Sparkles,
} from "lucide-react";

// Encouragement messages by streak length
const ENCOURAGEMENT: Record<number, string[]> = {
    1: ["Nice! 👍", "Correct! ✓", "Got it! 🎯"],
    2: ["Two in a row! 🔥", "On a roll! 💪", "Keep going! 🚀"],
    3: ["Three streak! 🔥🔥", "You're on fire! 🌟", "Unstoppable! ⚡"],
    5: ["FIVE STREAK! 🏆", "Absolute legend! 👑", "Mastery mode! 🧠"],
};
function getEncouragement(streak: number): string | null {
    const thresholds = [5, 3, 2, 1];
    for (const t of thresholds) {
        if (streak >= t && ENCOURAGEMENT[t]) {
            const msgs = ENCOURAGEMENT[t];
            return msgs[Math.floor(Math.random() * msgs.length)];
        }
    }
    return null;
}

const CONFIDENCE_EMOJIS = [
    { value: 1, emoji: "😰", label: "Guessed" },
    { value: 2, emoji: "🤔", label: "Unsure" },
    { value: 3, emoji: "😐", label: "Okay" },
    { value: 4, emoji: "😊", label: "Confident" },
    { value: 5, emoji: "💯", label: "Certain" },
];

const LOADING_TIPS = [
    "Spaced repetition boosts recall by 200%",
    "Active recall is more effective than re-reading",
    "Teaching others strengthens your understanding",
    "Taking breaks helps consolidate memory",
    "Interleaving topics improves long-term retention",
];

// Shuffle helper
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function QuizContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();
    const { user, loading: authLoading } = useAuth();
    const { profile, isPrimaryMode } = useUserProfile();
    const { generateQuestions, isGenerating } = useAdaptiveQuiz();

    // URL params
    const subjectName = searchParams.get("name") || "Quiz";
    const subjectId = searchParams.get("subject") || null;
    const curriculumContentId = searchParams.get("curriculum") || null;
    const urlCount = searchParams.get("count");
    const [selectedCount, setSelectedCount] = useState<number | null>(
        urlCount ? parseInt(urlCount, 10) : null
    );
    const questionCount = selectedCount || 5;
    const isInterleavedMode = searchParams.get("mode") === "interleaved";
    const interleavedTopics =
        searchParams.get("topics")?.split(",").filter(Boolean) || [];
    const customNotes = searchParams.get("notes") || null;
    const customPrompt = searchParams.get("prompt") || null;

    // Quiz state
    const [questions, setQuestions] = useState<AIQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [score, setScore] = useState(0);
    const [sessionWrong, setSessionWrong] = useState(0);
    const [streak, setStreak] = useState(0);
    const [currentDifficulty, setCurrentDifficulty] = useState<DifficultyTier>(2);
    const [shuffledAnswers, setShuffledAnswers] = useState<string[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(true);
    const [problemAreas, setProblemAreas] = useState<ProblemArea[]>([]);
    const [confidenceRatings, setConfidenceRatings] = useState<Record<number, number>>({});
    const [encouragementMsg, setEncouragementMsg] = useState<string | null>(null);
    const [bestStreak, setBestStreak] = useState(0);
    const [loadingTip] = useState(
        () => LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)]
    );
    const [struckAnswers, setStruckAnswers] = useState<Set<string>>(new Set());

    const hasInitialized = useRef(false);

    // Auth guard
    useEffect(() => {
        if (!authLoading && !user) router.replace("/auth");
    }, [authLoading, user, router]);

    // Current question
    const currentQuestion = questions[currentIndex] || null;

    // Initialize quiz
    const initQuiz = useCallback(async () => {
        if (!user || hasInitialized.current || !selectedCount) return;
        hasInitialized.current = true;
        setLoading(true);

        try {
            // Fetch exam board if we have a subject
            let examBoard: string | undefined;
            if (subjectId) {
                examBoard = await getUserExamBoard(user.id, subjectId);
            }

            const generated = await generateQuestions(
                {
                    yearGroup: profile?.year_group || "Year 10",
                    learningStyle: "text",
                    topicTitle: subjectName,
                    subjectId: subjectId || undefined,
                    curriculumContentId: curriculumContentId || undefined,
                    userId: user.id,
                    examBoard,
                    masteryScore: 50,
                    currentDifficulty,
                    customNotes: customNotes || undefined,
                    customPrompt: customPrompt || undefined,
                },
                questionCount
            );

            if (generated.length > 0) {
                setQuestions(generated);
                // Shuffle answers for first question
                const q = generated[0];
                setShuffledAnswers(shuffle([q.correct_answer, ...q.distractors]));
            }
        } catch (err) {
            console.error("Failed to generate questions:", err);
            toast.error("Failed to load questions. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [
        user,
        subjectId,
        subjectName,
        curriculumContentId,
        questionCount,
        currentDifficulty,
        customNotes,
        customPrompt,
        generateQuestions,
        profile?.year_group,
    ]);

    useEffect(() => {
        if (user && !hasInitialized.current && selectedCount) initQuiz();
    }, [user, initQuiz, selectedCount]);

    // Handle answer selection
    const handleAnswer = useCallback(
        async (answer: string) => {
            if (isAnswered || !currentQuestion) return;

            const correct = answer === currentQuestion.correct_answer;
            setSelectedAnswer(answer);
            setIsAnswered(true);
            setIsCorrect(correct);

            if (correct) {
                setScore((s) => s + 1);
                setStreak((s) => {
                    const newStreak = s + 1;
                    setBestStreak((b) => Math.max(b, newStreak));
                    setEncouragementMsg(getEncouragement(newStreak));
                    return newStreak;
                });
            } else {
                setEncouragementMsg(null);
                setSessionWrong((w) => w + 1);
                setStreak(0);

                // Track problem area
                const conceptTag = currentQuestion.concept_tag || "general";
                setProblemAreas((prev) => {
                    const existing = prev.find((p) => p.concept === conceptTag);
                    if (existing) {
                        return prev.map((p) =>
                            p.concept === conceptTag
                                ? { ...p, attempts: p.attempts + 1 }
                                : p
                        );
                    }
                    return [
                        ...prev,
                        { concept: conceptTag, attempts: 1, lastApproach: "mcq" },
                    ];
                });
            }

            // Log answer to database via server action
            if (user) {
                logQuizAnswer({
                    userId: user.id,
                    questionText: currentQuestion.question_text,
                    selectedAnswer: answer,
                    correctAnswer: currentQuestion.correct_answer,
                    isCorrect: correct,
                    conceptTag: currentQuestion.concept_tag || null,
                    curriculumContentId,
                    subjectId,
                    difficultyTier: currentQuestion.difficulty_tier,
                }).catch((err) => console.error("Failed to log answer:", err));
            }
        },
        [isAnswered, currentQuestion, user, curriculumContentId, subjectId]
    );

    // Move to next question
    const handleNext = useCallback(() => {
        const nextIndex = currentIndex + 1;
        if (nextIndex >= questions.length) {
            setShowResults(true);
            return;
        }

        setCurrentIndex(nextIndex);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setIsCorrect(false);
        setStruckAnswers(new Set());

        const q = questions[nextIndex];
        setShuffledAnswers(shuffle([q.correct_answer, ...q.distractors]));
    }, [currentIndex, questions]);

    // Skip question
    const handleSkip = useCallback(() => {
        setSessionWrong((w) => w + 1);
        setStreak(0);
        handleNext();
    }, [handleNext]);

    // Continue practice (from results)
    const handleContinue = useCallback(() => {
        hasInitialized.current = false;
        setQuestions([]);
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setIsCorrect(false);
        setScore(0);
        setSessionWrong(0);
        setStreak(0);
        setShowResults(false);
        setLoading(true);
        setProblemAreas([]);
        setConfidenceRatings({});
        setStruckAnswers(new Set());
        setEncouragementMsg(null);
        setBestStreak(0);
        initQuiz();
    }, [initQuiz]);

    // Quiz length selector (shown before quiz starts)
    if (!selectedCount && !loading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
                <div className="mx-auto max-w-sm text-center">
                    <Brain className="mx-auto mb-4 h-12 w-12 text-primary" />
                    <h2 className="mb-1 text-xl font-bold">{subjectName}</h2>
                    <p className="mb-6 text-sm text-muted-foreground">How many questions?</p>
                    <div className="flex justify-center gap-3 mb-6">
                        {[5, 10, 15].map((n) => (
                            <button
                                key={n}
                                onClick={() => setSelectedCount(n)}
                                className="flex h-20 w-20 flex-col items-center justify-center rounded-xl border-2 border-border bg-card text-center hover:border-primary hover:bg-primary/5 transition-all"
                            >
                                <span className="text-2xl font-bold text-primary">{n}</span>
                                <span className="text-[10px] text-muted-foreground">
                                    {n === 5 ? "Quick" : n === 10 ? "Standard" : "Deep"}
                                </span>
                            </button>
                        ))}
                    </div>
                    <Link
                        href="/dashboard"
                        className="text-sm text-muted-foreground hover:text-foreground"
                    >
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    // Loading state with animation
    if (authLoading || loading || isGenerating) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
                <div className="relative mb-6">
                    <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                    <Brain className="relative h-14 w-14 animate-pulse text-primary" />
                </div>
                <h2 className="mb-1 text-lg font-semibold">
                    {isPrimaryMode
                        ? "Getting your questions ready! 🧠"
                        : "Generating questions..."}
                </h2>
                <p className="mb-6 text-sm text-muted-foreground">{subjectName}</p>
                {/* Skeleton questions */}
                <div className="w-full max-w-md space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-xl border border-border p-4">
                            <div className="h-7 w-7 rounded-lg bg-muted animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 rounded bg-muted animate-pulse" style={{ width: `${60 + i * 10}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
                <p className="mt-6 max-w-xs text-center text-xs text-muted-foreground italic">
                    💡 {loadingTip}
                </p>
            </div>
        );
    }

    // No questions
    if (!currentQuestion && !showResults) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="mx-auto max-w-sm space-y-4 px-4 text-center">
                    <div className="text-4xl">😕</div>
                    <h2 className="text-lg font-semibold">No questions available</h2>
                    <p className="text-sm text-muted-foreground">
                        {isPrimaryMode
                            ? "Hmm, we couldn't load questions. Don't worry — let's try again!"
                            : "Questions couldn't be generated. This may be a temporary issue."}
                    </p>
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => {
                                hasInitialized.current = false;
                                window.location.reload();
                            }}
                            className="rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground"
                        >
                            Try Again
                        </button>
                        <Link
                            href="/dashboard"
                            className="flex items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Results screen
    if (showResults) {
        const total = score + sessionWrong;
        const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
        const emoji =
            percentage >= 80 ? "🏆" : percentage >= 60 ? "💪" : percentage >= 40 ? "📚" : "🔄";

        return (
            <div className="min-h-screen bg-background">
                <header className="border-b border-border bg-background/95 backdrop-blur">
                    <div className="container flex h-14 items-center px-4">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" /> Dashboard
                        </Link>
                    </div>
                </header>

                <main className="container mx-auto max-w-lg px-4 py-8">
                    <div className="mb-8 text-center">
                        <div className="mb-4 text-6xl">{emoji}</div>
                        <h1 className="mb-1 text-3xl font-bold">
                            {isPrimaryMode
                                ? percentage >= 80
                                    ? "Amazing! 🌟"
                                    : "Nice work!"
                                : "Quiz Complete"}
                        </h1>
                        <p className="text-muted-foreground">{subjectName}</p>
                    </div>

                    {/* Score card */}
                    <div className="mb-6 rounded-xl border border-border bg-card p-6 text-center">
                        <p className="mb-2 text-5xl font-bold text-primary">{percentage}%</p>
                        <p className="text-sm text-muted-foreground">
                            {score} correct out of {total} questions
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="mb-6 grid grid-cols-3 gap-3">
                        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-center">
                            <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-green-500" />
                            <p className="text-lg font-bold text-green-600">{score}</p>
                            <p className="text-xs text-muted-foreground">Correct</p>
                        </div>
                        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
                            <XCircle className="mx-auto mb-1 h-5 w-5 text-red-500" />
                            <p className="text-lg font-bold text-red-600">{sessionWrong}</p>
                            <p className="text-xs text-muted-foreground">Wrong</p>
                        </div>
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
                            <Flame className="mx-auto mb-1 h-5 w-5 text-primary" />
                            <p className="text-lg font-bold text-primary">{bestStreak}</p>
                            <p className="text-xs text-muted-foreground">Best Streak</p>
                        </div>
                    </div>

                    {/* Confidence summary */}
                    {Object.keys(confidenceRatings).length > 0 && (
                        <div className="mb-6 rounded-xl border border-border bg-card p-5">
                            <h3 className="mb-3 flex items-center gap-2 font-semibold">
                                <Sparkles className="h-4 w-4 text-primary" />
                                Confidence vs Accuracy
                            </h3>
                            <div className="grid grid-cols-5 gap-1">
                                {CONFIDENCE_EMOJIS.map((c) => {
                                    const count = Object.entries(confidenceRatings).filter(
                                        ([, v]) => v === c.value
                                    ).length;
                                    return (
                                        <div key={c.value} className="rounded-lg bg-muted/50 p-2 text-center">
                                            <div className="text-lg">{c.emoji}</div>
                                            <div className="text-xs font-medium">{count}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Problem areas */}
                    {problemAreas.length > 0 && (
                        <div className="mb-6 rounded-xl border border-border bg-card p-5">
                            <h3 className="mb-3 flex items-center gap-2 font-semibold">
                                <Target className="h-4 w-4 text-primary" />
                                Areas to Focus On
                            </h3>
                            <div className="space-y-2">
                                {problemAreas.map((area) => (
                                    <div
                                        key={area.concept}
                                        className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"
                                    >
                                        <span>{area.concept}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {area.attempts} mistake{area.attempts !== 1 ? "s" : ""}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleContinue}
                            className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            <RotateCcw className="h-4 w-4" />
                            {isPrimaryMode ? "Practice More! 🚀" : "Continue Practice"}
                        </button>
                        <Link
                            href="/dashboard"
                            className="flex items-center justify-center rounded-xl border border-border py-3 text-sm font-medium hover:bg-muted"
                        >
                            Back to Dashboard
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    // Question view
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
                <div className="container flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <span className="text-sm font-medium text-muted-foreground">
                            {subjectName}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        {streak > 1 && (
                            <span className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-0.5 text-xs font-bold text-orange-500">
                                <Flame className="h-3.5 w-3.5" />
                                {streak}
                            </span>
                        )}
                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                            {currentIndex + 1}/{questions.length}
                        </span>
                    </div>
                </div>
                {/* Progress bar */}
                <div className="h-1 bg-muted">
                    <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{
                            width: `${((currentIndex + (isAnswered ? 1 : 0)) / questions.length) * 100}%`,
                        }}
                    />
                </div>
            </header>

            {/* Question */}
            <main className="container mx-auto max-w-2xl px-4 py-6">
                <div className="mb-8">
                    <p className="text-lg font-medium leading-relaxed">
                        {currentQuestion.question_text}
                    </p>
                </div>

                {/* Answer options */}
                <div className="space-y-3">
                    {shuffledAnswers.map((answer, idx) => {
                        const isSelected = selectedAnswer === answer;
                        const isCorrectAnswer = answer === currentQuestion.correct_answer;

                        let bgClass = "border-border bg-card hover:bg-muted/50";
                        if (isAnswered) {
                            if (isCorrectAnswer) {
                                bgClass =
                                    "border-green-500 bg-green-500/10 ring-1 ring-green-500/30";
                            } else if (isSelected && !isCorrectAnswer) {
                                bgClass =
                                    "border-red-500 bg-red-500/10 ring-1 ring-red-500/30";
                            } else {
                                bgClass = "border-border bg-card opacity-50";
                            }
                        } else if (isSelected) {
                            bgClass =
                                "border-primary bg-primary/10 ring-1 ring-primary/30";
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => !isAnswered && handleAnswer(answer)}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    if (isAnswered) return;
                                    setStruckAnswers((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(answer)) next.delete(answer);
                                        else next.add(answer);
                                        return next;
                                    });
                                }}
                                disabled={isAnswered}
                                className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all ${bgClass}`}
                            >
                                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold ${struckAnswers.has(answer) && !isAnswered ? "line-through opacity-40" : ""}`}>
                                    {String.fromCharCode(65 + idx)}
                                </span>
                                <span className={`flex-1 pt-0.5 text-sm ${struckAnswers.has(answer) && !isAnswered ? "line-through opacity-40" : ""}`}>{answer}</span>
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

                {/* Encouragement toast */}
                {isAnswered && isCorrect && encouragementMsg && (
                    <div className="mt-4 animate-bounce rounded-xl bg-gradient-to-r from-primary/10 to-emerald-500/10 px-4 py-2.5 text-center text-sm font-semibold text-primary">
                        {encouragementMsg}
                    </div>
                )}

                {/* Confidence rating */}
                {isAnswered && !confidenceRatings[currentIndex] && (
                    <div className="mt-4 rounded-xl border border-border bg-card p-4 text-center">
                        <p className="mb-2 text-xs text-muted-foreground">How confident were you?</p>
                        <div className="flex justify-center gap-2">
                            {CONFIDENCE_EMOJIS.map((c) => (
                                <button
                                    key={c.value}
                                    onClick={() =>
                                        setConfidenceRatings((prev) => ({
                                            ...prev,
                                            [currentIndex]: c.value,
                                        }))
                                    }
                                    className="flex flex-col items-center gap-0.5 rounded-lg p-2 hover:bg-muted transition-colors"
                                    title={c.label}
                                >
                                    <span className="text-xl">{c.emoji}</span>
                                    <span className="text-[9px] text-muted-foreground">{c.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Explanation (after answering) */}
                {isAnswered && currentQuestion.explanation && (
                    <div
                        className={`mt-4 rounded-xl border p-5 ${isCorrect
                            ? "border-green-500/20 bg-green-500/5"
                            : "border-red-500/20 bg-red-500/5"
                            }`}
                    >
                        <h3 className="mb-2 text-sm font-semibold">
                            {isCorrect ? "✅ Correct!" : "❌ Not quite right"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {currentQuestion.explanation}
                        </p>

                        {/* Show distractor explanations for wrong answers */}
                        {!isCorrect &&
                            currentQuestion.distractor_explanations &&
                            selectedAnswer && (
                                <div className="mt-3 border-t border-border/50 pt-3">
                                    {currentQuestion.distractor_explanations
                                        .filter((de) => de.answer === selectedAnswer)
                                        .map((de, i) => (
                                            <p key={i} className="text-sm text-muted-foreground">
                                                <span className="font-medium">Why wrong:</span>{" "}
                                                {de.whyWrong}
                                            </p>
                                        ))}
                                </div>
                            )}
                    </div>
                )}

                {/* Navigation */}
                <div className="mt-6 flex gap-3">
                    {!isAnswered && (
                        <button
                            onClick={handleSkip}
                            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted"
                        >
                            <SkipForward className="h-4 w-4" /> Skip
                        </button>
                    )}
                    {isAnswered && (
                        <button
                            onClick={handleNext}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            {currentIndex < questions.length - 1 ? (
                                <>
                                    Next <ChevronRight className="h-4 w-4" />
                                </>
                            ) : (
                                <>
                                    <Trophy className="h-4 w-4" /> See Results
                                </>
                            )}
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function QuizPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-background">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }
        >
            <QuizContent />
        </Suspense>
    );
}
