"use client";

/**
 * Exam Session page — timed exam practice with AI grading.
 *
 * Flow: loading → question list → answer → grade → results
 *
 * URL params:
 *   subject     subject name
 *   examBoard   exam board (AQA, OCR etc)
 *   paper       paper number
 *   year        paper year
 */

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useUserProfile } from "@/contexts/user-profile-context";
import { useSubscription } from "@/contexts/subscription-context";
import { generateExamQuestions, gradeExamAnswers, saveExamSubmission } from "@/actions/exam";
import { toast } from "sonner";
import {
    ArrowLeft,
    Loader2,
    Clock,
    Send,
    CheckCircle2,
    XCircle,
    ChevronRight,
    Trophy,
    FileText,
    Camera,
    Type,
} from "lucide-react";
import { HandwrittenCapture } from "@/components/exam/HandwrittenCapture";
import { useExamRecovery } from "@/hooks/useExamRecovery";

interface ExamQuestion {
    id: string;
    question_number: string;
    question_text: string;
    total_marks: number;
    mark_scheme?: string;
}

interface GradedAnswer {
    questionId: string;
    response: string;
    marksAwarded: number;
    totalMarks: number;
    feedback: string;
}

function ExamContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuth();
    const { profile } = useUserProfile();
    const { hasAccess, loading: subLoading } = useSubscription();


    const subjectName = searchParams.get("subject") || "Exam Practice";
    const examBoard = searchParams.get("examBoard") || "";
    const paperNumber = searchParams.get("paper") || "";
    const paperYear = searchParams.get("year") || "";

    const [questions, setQuestions] = useState<ExamQuestion[]>([]);
    const [responses, setResponses] = useState<Record<string, string>>({});
    const [currentIdx, setCurrentIdx] = useState(0);
    const [loading, setLoading] = useState(true);
    const [grading, setGrading] = useState(false);
    const [gradedAnswers, setGradedAnswers] = useState<GradedAnswer[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [answerMode, setAnswerMode] = useState<"typed" | "handwritten">("typed");
    const [capturedImages, setCapturedImages] = useState<any[]>([]);

    // Timer
    const [elapsed, setElapsed] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const { save: saveExamDraft, recover: recoverExamDraft, clear: clearExamDraft } = useExamRecovery();

    useEffect(() => {
        if (!authLoading && !user) router.replace("/auth");
    }, [authLoading, user, router]);

    // Recover draft on mount
    useEffect(() => {
        const draft = recoverExamDraft();
        if (draft) {
            setResponses(draft.responses);
            setCurrentIdx(draft.currentIdx);
            setElapsed(draft.elapsed);
        }
    }, [recoverExamDraft]);

    // Auto-save on change
    useEffect(() => {
        if (Object.keys(responses).length > 0) {
            saveExamDraft(responses, currentIdx, elapsed);
        }
    }, [responses, currentIdx, elapsed, saveExamDraft]);

    // Start timer
    useEffect(() => {
        timerRef.current = setInterval(() => {
            setElapsed((e) => e + 1);
        }, 1000);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Generate exam questions via server action
    useEffect(() => {
        async function loadQuestions() {
            if (!user) return;
            setLoading(true);

            try {
                const { questions: q, error } = await generateExamQuestions({
                    subjectName,
                    examBoard,
                    paperNumber,
                    paperYear,
                    yearGroup: profile?.year_group || "Year 11",
                    questionCount: 5,
                });

                if (error) throw new Error(error);
                setQuestions(q);
            } catch (err) {
                console.error("Failed to generate exam questions:", err);
                toast.error("Failed to generate questions. Please try again.");
            } finally {
                setLoading(false);
            }
        }

        if (user) loadQuestions();
    }, [user, subjectName, examBoard, paperNumber, paperYear, profile?.year_group]);

    const currentQuestion = questions[currentIdx] || null;

    const formatTime = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        if (h > 0)
            return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const handleResponseChange = (value: string) => {
        if (!currentQuestion) return;
        setResponses((prev) => ({ ...prev, [currentQuestion.id]: value }));
    };

    const handleNext = () => {
        if (currentIdx < questions.length - 1) {
            setCurrentIdx(currentIdx + 1);
        }
    };

    const handlePrev = () => {
        if (currentIdx > 0) {
            setCurrentIdx(currentIdx - 1);
        }
    };

    const handleSubmitAll = async () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setGrading(true);
        clearExamDraft();

        try {
            const answers = questions.map((q) => ({
                questionId: q.id,
                questionText: q.question_text,
                response: responses[q.id] || "",
                totalMarks: q.total_marks,
                markScheme: q.mark_scheme,
            }));

            const { results, error } = await gradeExamAnswers({
                answers,
                subjectName,
                examBoard,
                yearGroup: profile?.year_group || "Year 11",
            });

            if (error) throw new Error(error);

            const graded: GradedAnswer[] = results.map((r, i) => ({
                questionId: r.questionId,
                response: responses[questions[i]?.id] || "",
                marksAwarded: r.marksAwarded,
                totalMarks: r.totalMarks,
                feedback: r.feedback,
            }));

            setGradedAnswers(graded);
            setShowResults(true);

            // Save submission via server action
            if (user) {
                saveExamSubmission({
                    userId: user.id,
                    subjectName,
                    examBoard,
                    paperYear,
                    totalMarksAvailable: questions.reduce((s, q) => s + q.total_marks, 0),
                    totalMarksAwarded: graded.reduce((s, g) => s + g.marksAwarded, 0),
                    timeSpentSeconds: elapsed,
                    questionsData: answers,
                    gradedResults: graded,
                }).catch((err) => console.error("Failed to save submission:", err));
            }
        } catch (err) {
            console.error("Grading failed:", err);
            toast.error("Failed to grade. Please try again.");
        } finally {
            setGrading(false);
        }
    };

    // Subscription gate
    if (!subLoading && !hasAccess("exam-questions")) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <div className="w-full max-w-md">
                    <Link
                        href="/dashboard"
                        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Link>
                    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6 text-center">
                        <FileText className="mx-auto mb-3 h-12 w-12 text-primary/50" />
                        <h2 className="mb-2 text-lg font-semibold">
                            Exam Practice requires Pro
                        </h2>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Upgrade for AI-graded exam questions with detailed mark scheme
                            feedback.
                        </p>
                        <Link
                            href="/subscription"
                            className="inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
                        >
                            View Plans
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background">
                <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
                <h2 className="mb-1 text-lg font-semibold">
                    Generating exam questions...
                </h2>
                <p className="text-sm text-muted-foreground">
                    {subjectName} · {examBoard}
                </p>
            </div>
        );
    }

    if (grading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background">
                <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
                <h2 className="mb-1 text-lg font-semibold">Grading your answers...</h2>
                <p className="text-sm text-muted-foreground">
                    AI is reviewing against the mark scheme
                </p>
            </div>
        );
    }

    // Results
    if (showResults) {
        const totalAwarded = gradedAnswers.reduce(
            (s, g) => s + g.marksAwarded,
            0
        );
        const totalAvailable = gradedAnswers.reduce(
            (s, g) => s + g.totalMarks,
            0
        );
        const percentage =
            totalAvailable > 0 ? Math.round((totalAwarded / totalAvailable) * 100) : 0;

        return (
            <div className="min-h-screen bg-background">
                <header className="border-b border-border bg-background/95 backdrop-blur">
                    <div className="container flex h-14 items-center px-4">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" /> Dashboard
                        </Link>
                    </div>
                </header>
                <main className="container mx-auto max-w-2xl space-y-6 px-4 py-8">
                    <div className="text-center">
                        <Trophy className="mx-auto mb-3 h-12 w-12 text-primary" />
                        <h1 className="text-2xl font-bold">Exam Complete</h1>
                        <p className="text-sm text-muted-foreground">
                            {subjectName} · {formatTime(elapsed)}
                        </p>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6 text-center">
                        <p className="mb-1 text-5xl font-bold text-primary">{percentage}%</p>
                        <p className="text-sm text-muted-foreground">
                            {totalAwarded}/{totalAvailable} marks
                        </p>
                    </div>

                    {/* Per-question feedback */}
                    {gradedAnswers.map((ga, idx) => (
                        <div
                            key={ga.questionId}
                            className={`rounded-xl border p-5 ${ga.marksAwarded >= ga.totalMarks
                                ? "border-green-500/20 bg-green-500/5"
                                : ga.marksAwarded > 0
                                    ? "border-yellow-500/20 bg-yellow-500/5"
                                    : "border-red-500/20 bg-red-500/5"
                                }`}
                        >
                            <div className="mb-2 flex items-center justify-between">
                                <h3 className="font-semibold">
                                    Q{questions[idx]?.question_number || idx + 1}
                                </h3>
                                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold">
                                    {ga.marksAwarded}/{ga.totalMarks}
                                </span>
                            </div>
                            <p className="mb-2 text-xs text-muted-foreground">
                                {questions[idx]?.question_text.slice(0, 100)}
                                {(questions[idx]?.question_text.length || 0) > 100 ? "..." : ""}
                            </p>
                            {ga.feedback && (
                                <p className="text-sm text-muted-foreground">{ga.feedback}</p>
                            )}
                        </div>
                    ))}

                    <Link
                        href="/dashboard"
                        className="block rounded-xl bg-primary py-3 text-center font-medium text-primary-foreground"
                    >
                        Back to Dashboard
                    </Link>
                </main>
            </div>
        );
    }

    // Question view
    if (!currentQuestion) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <p className="mb-4 text-muted-foreground">No questions generated</p>
                    <Link
                        href="/dashboard"
                        className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

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
                        <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-mono">
                            <Clock className="h-3.5 w-3.5" />
                            {formatTime(elapsed)}
                        </span>
                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                            {currentIdx + 1}/{questions.length}
                        </span>
                    </div>
                </div>
            </header>

            <main className="container mx-auto max-w-2xl px-4 py-6">
                {/* Question */}
                <div className="mb-4">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                            Q{currentQuestion.question_number}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            [{currentQuestion.total_marks} mark
                            {currentQuestion.total_marks !== 1 ? "s" : ""}]
                        </span>
                    </div>
                    <p className="text-lg leading-relaxed">
                        {currentQuestion.question_text}
                    </p>
                </div>

                {/* Answer mode toggle */}
                <div className="mb-3 flex gap-1 rounded-lg bg-muted p-1">
                    <button
                        onClick={() => setAnswerMode("typed")}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${answerMode === "typed"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <Type className="h-3.5 w-3.5" />
                        Type Answer
                    </button>
                    <button
                        onClick={() => setAnswerMode("handwritten")}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${answerMode === "handwritten"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <Camera className="h-3.5 w-3.5" />
                        Handwritten
                    </button>
                </div>

                {/* Answer area */}
                {answerMode === "typed" ? (
                    <textarea
                        value={responses[currentQuestion.id] || ""}
                        onChange={(e) => handleResponseChange(e.target.value)}
                        placeholder="Type your answer here..."
                        className="mb-4 min-h-[200px] w-full resize-none rounded-xl border border-border bg-background p-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                ) : (
                    <div className="mb-4">
                        <HandwrittenCapture
                            onCapture={(imgs) => {
                                setCapturedImages(imgs);
                                handleResponseChange(`[handwritten: ${imgs.length} image(s) captured]`);
                            }}
                            maxImages={3}
                        />
                    </div>
                )}

                {/* Navigation */}
                <div className="flex gap-3">
                    {currentIdx > 0 && (
                        <button
                            onClick={handlePrev}
                            className="rounded-xl border border-border px-4 py-2.5 text-sm hover:bg-muted"
                        >
                            Previous
                        </button>
                    )}
                    <div className="flex-1" />
                    {currentIdx < questions.length - 1 ? (
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
                        >
                            Next <ChevronRight className="h-4 w-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmitAll}
                            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
                        >
                            <Send className="h-4 w-4" /> Submit for Grading
                        </button>
                    )}
                </div>

                {/* Question navigator */}
                <div className="mt-6 flex flex-wrap gap-2">
                    {questions.map((q, idx) => (
                        <button
                            key={q.id}
                            onClick={() => setCurrentIdx(idx)}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium ${idx === currentIdx
                                ? "bg-primary text-primary-foreground"
                                : responses[q.id]
                                    ? "bg-primary/10 text-primary"
                                    : "bg-muted text-muted-foreground"
                                }`}
                        >
                            {q.question_number}
                        </button>
                    ))}
                </div>
            </main>
        </div>
    );
}

export default function ExamPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-background">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }
        >
            <ExamContent />
        </Suspense>
    );
}
