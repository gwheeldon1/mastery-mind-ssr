"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useUserProfile } from "@/contexts/user-profile-context";
import { useSubscription } from "@/contexts/subscription-context";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
    ArrowLeft,
    GraduationCap,
    AlertTriangle,
    Loader2,
    MessageCircle,
    Target,
    Lightbulb,
    Send,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    BookOpen,
} from "lucide-react";

function NEACoachContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuth();
    const { profile, loading: profileLoading } = useUserProfile();
    const { hasAccess, loading: subLoading } = useSubscription();

    const subjectName = searchParams.get("subject") || "";
    const examBoard = searchParams.get("examBoard") || "";
    const yearGroup =
        searchParams.get("yearGroup") || profile?.year_group || "";

    useEffect(() => {
        if (!authLoading && !profileLoading && !user) router.replace("/auth");
    }, [authLoading, profileLoading, user, router]);

    if (authLoading || profileLoading || subLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Subscription gate — Premium only
    if (!hasAccess("nea-coach")) {
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
                        <GraduationCap className="mx-auto mb-3 h-12 w-12 text-primary/50" />
                        <h2 className="mb-2 text-lg font-semibold">
                            NEA Coach requires Premium
                        </h2>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Get AI-powered guidance for your Non-Examined Assessment with
                            section checklists, feedback, and structure coaching.
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

    // Check required params
    if (!subjectName || !examBoard) {
        return (
            <div className="min-h-screen bg-background p-4">
                <div className="mx-auto max-w-2xl space-y-4">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" /> Dashboard
                    </Link>
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
                        <div className="mb-3 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            <h2 className="font-semibold text-red-600">
                                Missing Information
                            </h2>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {!subjectName && "No subject specified. "}
                            {!examBoard && "No exam board specified. "}
                            Please navigate to the NEA Coach from your subject page.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // NEA Coach Dashboard
    const NEA_SECTIONS = [
        {
            title: "Analysis & Investigation",
            description:
                "Define your problem, research existing solutions, and identify stakeholder requirements.",
            tips: [
                "Research at least 3 existing solutions",
                "Interview or survey your stakeholder",
                "Create a clear problem statement",
            ],
            soWhatPrompt: "Why is your chosen problem worth solving? What gap exists in current solutions?",
            theoryLink: "Requirements gathering, Stakeholder analysis",
        },
        {
            title: "Design",
            description:
                "Create detailed designs for your solution, including data structures and algorithms.",
            tips: [
                "Use multiple design techniques",
                "Show iterative development",
                "Include pseudocode or flowcharts",
            ],
            soWhatPrompt: "How does your design address your stakeholder's specific requirements?",
            theoryLink: "Data flow diagrams, Entity relationship models",
        },
        {
            title: "Development & Testing",
            description:
                "Build your solution with well-documented code and comprehensive testing.",
            tips: [
                "Test with normal, boundary, and erroneous data",
                "Document your development process",
                "Show evidence of debugging",
            ],
            soWhatPrompt: "What was the hardest part to implement and why? What did you learn from testing?",
            theoryLink: "Testing strategies, Debugging techniques",
        },
        {
            title: "Evaluation",
            description:
                "Critically evaluate your solution against your original objectives.",
            tips: [
                "Refer back to your success criteria",
                "Get stakeholder feedback",
                "Suggest future improvements",
            ],
            soWhatPrompt: "How well does your final solution meet each of your success criteria? What would you do differently?",
            theoryLink: "Critical evaluation, Reflective practice",
        },
    ];

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-4xl p-4">
                <Link
                    href="/dashboard"
                    className="mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Subjects
                </Link>

                <div className="mb-6">
                    <h1 className="flex items-center gap-3 text-2xl font-bold">
                        <GraduationCap className="h-7 w-7 text-primary" />
                        NEA Coach
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {subjectName} · {examBoard} · {yearGroup}
                    </p>
                </div>

                {/* Section cards */}
                <div className="space-y-4">
                    {NEA_SECTIONS.map((section, idx) => (
                        <NEASectionCard key={idx} section={section} index={idx} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function NEASectionCard({
    section,
    index,
}: {
    section: {
        title: string;
        description: string;
        tips: string[];
        soWhatPrompt: string;
        theoryLink: string;
    };
    index: number;
}) {
    const [expanded, setExpanded] = useState(false);
    const [soWhatAnswer, setSoWhatAnswer] = useState("");
    const [feedback, setFeedback] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"not-started" | "in-progress" | "complete">("not-started");
    const supabase = createClient();

    const statusColors = {
        "not-started": "bg-muted text-muted-foreground",
        "in-progress": "bg-yellow-500/10 text-yellow-600",
        complete: "bg-green-500/10 text-green-600",
    };
    const statusLabels = {
        "not-started": "Not Started",
        "in-progress": "In Progress",
        complete: "Complete",
    };

    const handleSoWhatSubmit = async () => {
        if (!soWhatAnswer.trim()) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke("ai-tutor-chat", {
                body: {
                    messages: [
                        {
                            role: "system",
                            content: `You are an NEA Coach for UK students. Evaluate this student's answer to the "So What" drill for the ${section.title} section. Give specific, constructive feedback in 2-3 sentences. Be encouraging.`,
                        },
                        {
                            role: "user",
                            content: `Question: ${section.soWhatPrompt}\n\nStudent answer: ${soWhatAnswer}`,
                        },
                    ],
                },
            });

            if (data?.response) {
                setFeedback(data.response);
                if (status === "not-started") setStatus("in-progress");
            } else {
                toast.error("Failed to get feedback");
            }
        } catch {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rounded-xl border border-border bg-card">
            {/* Header */}
            <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                        {index + 1}
                    </span>
                    <div>
                        <h3 className="font-semibold">{section.title}</h3>
                        <p className="text-xs text-muted-foreground">{section.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Status badge */}
                    <button
                        onClick={() => {
                            const next = status === "not-started" ? "in-progress" : status === "in-progress" ? "complete" : "not-started";
                            setStatus(next);
                        }}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${statusColors[status]}`}
                    >
                        {status === "complete" && <CheckCircle2 className="mr-1 inline h-3 w-3" />}
                        {statusLabels[status]}
                    </button>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                    >
                        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {/* Expanded content */}
            {expanded && (
                <div className="border-t border-border p-5 pt-4">
                    {/* Tips */}
                    <div className="mb-4 space-y-1.5">
                        <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            <Target className="h-3 w-3" /> Key Tips
                        </h4>
                        {section.tips.map((tip, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <span className="mt-0.5 text-primary">•</span>
                                <span>{tip}</span>
                            </div>
                        ))}
                    </div>

                    {/* Theory link */}
                    <div className="mb-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-600">
                            <BookOpen className="h-3 w-3" />
                            Theory: {section.theoryLink}
                        </span>
                    </div>

                    {/* So What Drill */}
                    <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
                        <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                            <Lightbulb className="h-4 w-4 text-yellow-500" />
                            &quot;So What?&quot; Drill
                        </h4>
                        <p className="mb-3 text-xs text-muted-foreground">{section.soWhatPrompt}</p>

                        <textarea
                            value={soWhatAnswer}
                            onChange={(e) => setSoWhatAnswer(e.target.value)}
                            placeholder="Type your answer here..."
                            rows={3}
                            className="mb-2 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />

                        <button
                            onClick={handleSoWhatSubmit}
                            disabled={loading || !soWhatAnswer.trim()}
                            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Send className="h-3.5 w-3.5" />
                            )}
                            Get Feedback
                        </button>

                        {/* AI Feedback */}
                        {feedback && (
                            <div className="mt-3 rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                                <div className="mb-1 flex items-center gap-1 text-xs font-semibold text-green-600">
                                    <MessageCircle className="h-3 w-3" /> Coach Feedback
                                </div>
                                <p className="text-xs text-muted-foreground">{feedback}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function NEACoachPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-background">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }
        >
            <NEACoachContent />
        </Suspense>
    );
}
