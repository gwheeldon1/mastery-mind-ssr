"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
    Building2,
    Loader2,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    Shield,
    Users,
    Mail,
    Plus,
    Trash2,
} from "lucide-react";

type Step = "details" | "account" | "plan";

const PLANS = [
    {
        id: "pro",
        name: "Pro School",
        price: "£6.99",
        features: [
            "Unlimited AI quizzes",
            "All study guides",
            "Student progress tracking",
            "Domain-based auto-licensing",
        ],
    },
    {
        id: "premium",
        name: "Premium School",
        price: "£10.49",
        features: [
            "Everything in Pro",
            "NEA Coach access",
            "Exam mode with AI marking",
            "Priority support",
            "Teacher dashboard analytics",
        ],
    },
];

export default function SchoolSignupPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const supabase = createClient();

    const [step, setStep] = useState<Step>("details");
    const [schoolName, setSchoolName] = useState("");
    const [domains, setDomains] = useState([""]);
    const [selectedPlan, setSelectedPlan] = useState("pro");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [authMode, setAuthMode] = useState<"signup" | "login">("signup");

    // Add/remove domain helpers
    const addDomain = () => setDomains([...domains, ""]);
    const removeDomain = (idx: number) =>
        setDomains(domains.filter((_, i) => i !== idx));
    const updateDomain = (idx: number, val: string) =>
        setDomains(domains.map((d, i) => (i === idx ? val : d)));

    const handleContinueDetails = () => {
        if (!schoolName.trim()) {
            toast.error("Please enter your school name");
            return;
        }
        const validDomains = domains.filter((d) => d.trim());
        if (validDomains.length === 0) {
            toast.error("Please add at least one email domain");
            return;
        }
        if (user) {
            setStep("plan");
        } else {
            setStep("account");
        }
    };

    const handleAuth = async () => {
        if (!email || !password) {
            toast.error("Please fill in all fields");
            return;
        }

        setIsCreating(true);
        try {
            if (authMode === "signup") {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { display_name: displayName },
                        emailRedirectTo: `${window.location.origin}/school-signup`,
                    },
                });
                if (error) {
                    if (error.message.includes("already registered")) {
                        toast.error("Email already registered. Try logging in.");
                        setAuthMode("login");
                    } else {
                        toast.error(error.message);
                    }
                } else {
                    toast.success("Check your email to verify your account!");
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) {
                    toast.error(error.message);
                } else {
                    setStep("plan");
                }
            }
        } finally {
            setIsCreating(false);
        }
    };

    // Auto-advance to plan step when user logs in
    useEffect(() => {
        if (!authLoading && user && step === "account") {
            setStep("plan");
        }
    }, [user, authLoading, step]);

    const handleStartTrial = async () => {
        if (!user) {
            setStep("account");
            return;
        }

        setIsCreating(true);
        try {
            const validDomains = domains.filter((d) => d.trim());
            const { data, error } = await supabase.functions.invoke(
                "create-school-trial",
                {
                    body: {
                        schoolName: schoolName.trim(),
                        domains: validDomains,
                        tier: selectedPlan,
                        seatCount: 50,
                    },
                }
            );

            if (error) {
                toast.error("Failed to start trial. Please try again.");
            } else {
                toast.success("Your 7-day free trial has started! 🎉");
                router.push("/school-admin");
            }
        } finally {
            setIsCreating(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-16">
            {/* Breadcrumb */}
            <div className="border-b bg-muted/30">
                <div className="container mx-auto px-4 py-3">
                    <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link href="/" className="hover:text-foreground">Home</Link>
                        <span>/</span>
                        <Link href="/schools" className="hover:text-foreground">Schools</Link>
                        <span>/</span>
                        <span className="text-foreground">Sign Up</span>
                    </nav>
                </div>
            </div>

            <main className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
                {/* Title */}
                <div className="mb-10 text-center">
                    <div className="mb-3 flex items-center justify-center gap-2">
                        <Building2 className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                            School Subscription
                        </h1>
                    </div>
                    <p className="text-lg text-muted-foreground">
                        Get 30% off for your entire school with domain-based auto-licensing
                    </p>
                </div>

                {/* Progress */}
                <div className="mb-8 flex flex-wrap items-center justify-center gap-2 md:gap-4">
                    {(["details", "account", "plan"] as Step[]).map((s, idx) => (
                        <div key={s} className="flex items-center gap-2">
                            {idx > 0 && <div className="h-px w-4 bg-border md:w-8" />}
                            <span
                                className={`rounded-full px-4 py-2 text-sm font-medium ${step === s
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground"
                                    }`}
                            >
                                {idx + 1}. {s === "details" ? "Details" : s === "account" ? "Account" : "Plan"}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Step 1: Details */}
                {step === "details" && (
                    <div className="mx-auto max-w-lg space-y-6 rounded-xl border border-border bg-card p-6">
                        <div>
                            <label className="mb-2 block text-sm font-medium">School Name</label>
                            <input
                                type="text"
                                value={schoolName}
                                onChange={(e) => setSchoolName(e.target.value)}
                                placeholder="e.g. Riverside Academy"
                                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Email Domains
                            </label>
                            <p className="mb-3 text-xs text-muted-foreground">
                                Students signing up with these domains get automatic licenses
                            </p>
                            <div className="space-y-2">
                                {domains.map((domain, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <span className="rounded-l-lg border border-r-0 border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground">
                                            @
                                        </span>
                                        <input
                                            type="text"
                                            value={domain}
                                            onChange={(e) => updateDomain(idx, e.target.value.toLowerCase())}
                                            placeholder="school.edu"
                                            className="h-11 w-full rounded-r-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                        {domains.length > 1 && (
                                            <button
                                                onClick={() => removeDomain(idx)}
                                                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-red-500"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={addDomain}
                                className="mt-2 flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                                <Plus className="h-3 w-3" /> Add another domain
                            </button>
                        </div>

                        <button
                            onClick={handleContinueDetails}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            Continue <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Step 2: Account */}
                {step === "account" && (
                    <div className="mx-auto max-w-lg space-y-6 rounded-xl border border-border bg-card p-6">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setStep("details")}
                                className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                            <h2 className="text-lg font-semibold">
                                {authMode === "signup" ? "Create Account" : "Log In"}
                            </h2>
                        </div>

                        <div className="space-y-4">
                            {authMode === "signup" && (
                                <div>
                                    <label className="mb-2 block text-sm font-medium">Name</label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Your full name"
                                        className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="mb-2 block text-sm font-medium">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@school.edu"
                                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleAuth}
                            disabled={isCreating}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                            {isCreating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : authMode === "signup" ? (
                                "Create Account"
                            ) : (
                                "Log In"
                            )}
                        </button>

                        <p className="text-center text-sm text-muted-foreground">
                            {authMode === "signup" ? (
                                <>
                                    Already have an account?{" "}
                                    <button onClick={() => setAuthMode("login")} className="text-primary hover:underline">
                                        Log in
                                    </button>
                                </>
                            ) : (
                                <>
                                    Need an account?{" "}
                                    <button onClick={() => setAuthMode("signup")} className="text-primary hover:underline">
                                        Sign up
                                    </button>
                                </>
                            )}
                        </p>
                    </div>
                )}

                {/* Step 3: Plan selection */}
                {step === "plan" && (
                    <div className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            {PLANS.map((plan) => (
                                <button
                                    key={plan.id}
                                    onClick={() => setSelectedPlan(plan.id)}
                                    className={`rounded-xl border-2 bg-card p-6 text-left transition-all ${selectedPlan === plan.id
                                            ? "border-primary shadow-md"
                                            : "border-border hover:border-primary/30"
                                        }`}
                                >
                                    <h3 className="mb-1 text-xl font-bold">{plan.name}</h3>
                                    <p className="mb-4 text-2xl font-bold">
                                        {plan.price}
                                        <span className="text-sm font-normal text-muted-foreground">
                                            /seat/month
                                        </span>
                                    </p>
                                    <ul className="space-y-2">
                                        {plan.features.map((f) => (
                                            <li key={f} className="flex items-center gap-2 text-sm">
                                                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                </button>
                            ))}
                        </div>

                        {/* Summary */}
                        <div className="mx-auto max-w-lg rounded-xl border border-border bg-muted/30 p-6">
                            <h3 className="mb-3 font-semibold">Trial Summary</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">School</span>
                                    <span className="font-medium">{schoolName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Plan</span>
                                    <span className="font-medium">
                                        {PLANS.find((p) => p.id === selectedPlan)?.name}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Trial seats</span>
                                    <span className="font-medium">50</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Trial duration</span>
                                    <span className="font-medium">7 days free</span>
                                </div>
                            </div>

                            <button
                                onClick={handleStartTrial}
                                disabled={isCreating}
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                            >
                                {isCreating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Shield className="h-4 w-4" />
                                        Start Free 7-Day Trial
                                    </>
                                )}
                            </button>
                        </div>

                        <p className="text-center text-sm text-muted-foreground">
                            Need more than 100 seats?{" "}
                            <a href="mailto:schools@masterymind.app" className="text-primary hover:underline">
                                Contact us
                            </a>{" "}
                            for custom pricing.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
