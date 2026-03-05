"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
    ChevronRight,
    ChevronLeft,
    Zap,
    BookOpen,
    Calculator,
    FlaskConical,
    Loader2,
} from "lucide-react";

const CORE_SUBJECTS = {
    mathematics: "f1c1e3bf-92ef-4125-b839-2f7d4e74e44c",
    englishLanguage: "7125f830-cf22-4130-a1db-adbd44d66fd4",
    englishLiterature: "0ff9c52b-4bd8-4fb0-bc85-5bd62874235e",
    english: "1ff040b2-051d-42dc-9602-08c29883b415",
    science: "4ad0729f-0650-441d-8dd0-1688c764afc2",
};

const YEAR_GROUPS = [
    { label: "Year 3", keyStage: "KS2" },
    { label: "Year 4", keyStage: "KS2" },
    { label: "Year 5", keyStage: "KS2" },
    { label: "Year 6", keyStage: "KS2" },
    { label: "Year 7", keyStage: "KS3" },
    { label: "Year 8", keyStage: "KS3" },
    { label: "Year 9", keyStage: "KS3" },
    { label: "Year 10", keyStage: "GCSE" },
    { label: "Year 11", keyStage: "GCSE" },
    { label: "Year 12", keyStage: "A-Level" },
    { label: "Year 13", keyStage: "A-Level" },
];

const QUICK_SUBJECTS = [
    {
        id: "maths",
        label: "Maths",
        icon: Calculator,
        color:
            "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    },
    {
        id: "english",
        label: "English",
        icon: BookOpen,
        color:
            "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
    },
    {
        id: "science",
        label: "Science",
        icon: FlaskConical,
        color:
            "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
    },
];

const TOTAL_STEPS = 2;

async function autoConfigureCoreSubjects(
    userId: string,
    yearGroup: string
): Promise<void> {
    const supabase = createClient();
    const isALevel = ["Year 12", "Year 13"].includes(yearGroup);
    const isExamYear = ["Year 10", "Year 11", "Year 12", "Year 13"].includes(
        yearGroup
    );
    const isKS3 = ["Year 7", "Year 8", "Year 9"].includes(yearGroup);
    const isKS2 = ["Year 3", "Year 4", "Year 5", "Year 6"].includes(yearGroup);

    let subjectsToAdd: {
        subject_id: string;
        exam_board: string | null;
        qualification_level: string | null;
    }[] = [];

    if (isALevel) {
        subjectsToAdd = [
            { subject_id: CORE_SUBJECTS.mathematics, exam_board: "AQA", qualification_level: "A-Level" },
            { subject_id: CORE_SUBJECTS.englishLanguage, exam_board: "AQA", qualification_level: "A-Level" },
            { subject_id: CORE_SUBJECTS.englishLiterature, exam_board: "AQA", qualification_level: "A-Level" },
        ];
    } else if (isExamYear) {
        subjectsToAdd = [
            { subject_id: CORE_SUBJECTS.mathematics, exam_board: "AQA", qualification_level: "GCSE" },
            { subject_id: CORE_SUBJECTS.englishLanguage, exam_board: "AQA", qualification_level: "GCSE" },
            { subject_id: CORE_SUBJECTS.englishLiterature, exam_board: "AQA", qualification_level: "GCSE" },
        ];
    } else if (isKS3) {
        subjectsToAdd = [
            { subject_id: CORE_SUBJECTS.mathematics, exam_board: null, qualification_level: null },
            { subject_id: CORE_SUBJECTS.englishLanguage, exam_board: null, qualification_level: null },
            { subject_id: CORE_SUBJECTS.englishLiterature, exam_board: null, qualification_level: null },
        ];
    } else if (isKS2) {
        subjectsToAdd = [
            { subject_id: CORE_SUBJECTS.mathematics, exam_board: null, qualification_level: null },
            { subject_id: CORE_SUBJECTS.english, exam_board: null, qualification_level: null },
        ];
    }

    if (subjectsToAdd.length === 0) return;

    const insertData = subjectsToAdd.map((s) => ({
        user_id: userId,
        subject_id: s.subject_id,
        exam_board: s.exam_board,
        year_group: yearGroup,
        qualification_level: s.qualification_level,
    }));

    const { error } = await supabase
        .from("user_subjects")
        .upsert(insertData, { ignoreDuplicates: true });

    if (error) console.error("Failed to configure subjects:", error);
}

export default function OnboardingPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const supabase = createClient();

    const [currentStep, setCurrentStep] = useState(0);
    const [selectedYear, setSelectedYear] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(true);

    // Check if user already has year_group → skip onboarding
    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.replace("/auth");
            return;
        }

        (async () => {
            const { data } = await supabase
                .from("profiles")
                .select("year_group")
                .eq("id", user.id)
                .single();

            if (data?.year_group) {
                router.replace("/dashboard");
                return;
            }
            setProfileLoading(false);
        })();
    }, [authLoading, user, router, supabase]);

    // Check for demo year group from localStorage
    useEffect(() => {
        const demoYearGroup = localStorage.getItem("demo_year_group");
        if (demoYearGroup) {
            setSelectedYear(demoYearGroup);
            setCurrentStep(1);
            localStorage.removeItem("demo_year_group");
        }
    }, []);

    const completeOnboarding = async () => {
        if (!selectedYear || !user) return;
        setLoading(true);

        try {
            // Update profile with year group
            const { error: profileError } = await supabase
                .from("profiles")
                .update({ year_group: selectedYear })
                .eq("id", user.id);

            if (profileError) {
                toast.error("Failed to save profile");
                setLoading(false);
                return;
            }

            // Set default avatar
            await supabase
                .from("profiles")
                .update({ avatar_id: "fox", avatar_bg_color: "cyan" })
                .eq("id", user.id);

            // Auto-configure core subjects
            await autoConfigureCoreSubjects(user.id, selectedYear);

            toast.success("Let's start learning! 🚀");
            router.push("/dashboard?autostart=true");
        } catch (err) {
            console.error("Onboarding error:", err);
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || profileLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="flex min-h-screen flex-col bg-background">
            {/* Progress Bar */}
            <div className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
                <div className="mx-auto max-w-2xl">
                    <div className="relative flex items-center gap-2">
                        {Array.from({ length: TOTAL_STEPS }).map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-2 flex-1 rounded-full transition-all duration-300 ${idx <= currentStep ? "bg-primary" : "bg-muted"
                                    }`}
                            />
                        ))}
                        <div
                            className="absolute top-1/2 -translate-y-1/2 transition-all duration-500 ease-out"
                            style={{
                                left: `calc(${(currentStep / (TOTAL_STEPS - 1)) * 100}% - 12px)`,
                            }}
                        >
                            <span className="text-lg">🎓</span>
                        </div>
                    </div>
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                        Step {currentStep + 1} of {TOTAL_STEPS}
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex flex-1 items-center justify-center p-4">
                <div className="w-full max-w-lg">
                    {/* Step 1: Year Group Selection */}
                    {currentStep === 0 && (
                        <div className="space-y-6">
                            <div className="space-y-2 text-center">
                                <h1 className="font-display text-2xl font-bold sm:text-3xl">
                                    What year are you in?
                                </h1>
                                <p className="text-muted-foreground">
                                    This helps us match content to your curriculum
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                                {YEAR_GROUPS.map((year) => (
                                    <button
                                        key={year.label}
                                        onClick={() => setSelectedYear(year.label)}
                                        className={`min-h-[60px] rounded-xl border-2 p-3 transition-all duration-200 sm:p-4 ${selectedYear === year.label
                                                ? "border-primary bg-primary/5 shadow-md"
                                                : "border-border hover:border-primary/50 hover:bg-muted/50"
                                            }`}
                                    >
                                        <span className="flex flex-col items-center gap-1">
                                            <span className="font-semibold">{year.label}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {year.keyStage}
                                            </span>
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={() => setCurrentStep(1)}
                                    disabled={!selectedYear}
                                    className="flex h-12 w-full items-center justify-center gap-1 rounded-lg bg-primary font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                                >
                                    Continue <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Quick Subject Choice + Start */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div className="space-y-2 text-center">
                                <h1 className="font-display text-2xl font-bold sm:text-3xl">
                                    Ready to start! 🎉
                                </h1>
                                <p className="text-muted-foreground">
                                    We&apos;ve set up Maths & English for you. Click below to
                                    answer your first question!
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                {QUICK_SUBJECTS.map((subject) => {
                                    const Icon = subject.icon;
                                    return (
                                        <div
                                            key={subject.id}
                                            className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 ${subject.color}`}
                                        >
                                            <Icon className="h-6 w-6" />
                                            <span className="text-sm font-medium">
                                                {subject.label}
                                            </span>
                                            <span className="text-xs opacity-70">Ready</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="rounded-xl bg-muted/50 p-4 text-center">
                                <p className="text-sm text-muted-foreground">
                                    ✨ You can add more subjects and customize your profile
                                    anytime in Settings
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setCurrentStep(0)}
                                    className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border py-3 text-sm font-medium transition-colors hover:bg-muted"
                                >
                                    <ChevronLeft className="h-4 w-4" /> Back
                                </button>
                                <button
                                    onClick={completeOnboarding}
                                    disabled={loading}
                                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Setting up...
                                        </>
                                    ) : (
                                        <>
                                            Start Learning <Zap className="h-4 w-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
