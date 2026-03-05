"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import {
    useSubscription,
    type SubscriptionTier,
} from "@/contexts/subscription-context";
import { createClient } from "@/lib/supabase/client";
import {
    Check,
    Sparkles,
    Crown,
    Loader2,
    ArrowLeft,
    Settings,
    X,
} from "lucide-react";
import { toast } from "sonner";

interface PricingTier {
    id: "free" | "pro" | "premium";
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    highlighted?: boolean;
    badge?: string;
}

const PRICING_TIERS: PricingTier[] = [
    {
        id: "free",
        name: "Free",
        price: "£0",
        period: "forever",
        description: "Get started with basic quiz practice",
        features: [
            "Unlimited quizzes",
            "Spaced repetition",
            "Progress tracking",
            "Leaderboard access",
        ],
    },
    {
        id: "pro",
        name: "Pro",
        price: "£9.99",
        period: "per month",
        description: "Level up with exam-style practice",
        features: [
            "Everything in Free",
            "Exam-style questions",
            "AI grading & feedback",
            "Blurt knowledge elicitation",
            "Detailed mark schemes",
        ],
        highlighted: true,
        badge: "Most Popular",
    },
    {
        id: "premium",
        name: "Premium",
        price: "£14.99",
        period: "per month",
        description: "Full access with coursework support",
        features: [
            "Everything in Pro",
            "Past paper import",
            "NEA Coach for coursework",
            "Personalised guidance",
            "Priority support",
        ],
    },
];

function SubscriptionContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuth();

    const {
        tier: currentTier,
        subscribed,
        isTrialing,
        subscriptionEnd,
        trialEnd,
        internalTrialActive,
        internalTrialEnd,
        internalTrialExpired,
        loading: subLoading,
        checkSubscription,
        createCheckout,
        openCustomerPortal,
    } = useSubscription();

    const [checkoutLoading, setCheckoutLoading] = useState<
        "pro" | "premium" | null
    >(null);
    const [portalLoading, setPortalLoading] = useState(false);

    // Handle Stripe redirect
    useEffect(() => {
        const success = searchParams.get("success");
        const canceled = searchParams.get("canceled");

        if (success === "true") {
            toast.success("Subscription activated! Welcome aboard 🎉");
            checkSubscription();
            router.replace("/subscription");
        } else if (canceled === "true") {
            toast.info("Checkout canceled");
            router.replace("/subscription");
        }
    }, [searchParams, router, checkSubscription]);

    useEffect(() => {
        if (!authLoading && !user) router.replace("/auth?redirect=/subscription");
    }, [user, authLoading, router]);

    const handleSubscribe = async (tier: "pro" | "premium") => {
        if (!user) {
            router.push("/auth?redirect=/subscription");
            return;
        }
        setCheckoutLoading(tier);
        try {
            const url = await createCheckout(tier);
            if (url) window.open(url, "_blank");
        } finally {
            setCheckoutLoading(null);
        }
    };

    const handleManageSubscription = async () => {
        setPortalLoading(true);
        try {
            const url = await openCustomerPortal();
            if (url) window.open(url, "_blank");
        } finally {
            setPortalLoading(false);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const getButtonState = (
        tierId: "free" | "pro" | "premium"
    ): {
        text: string;
        disabled: boolean;
        action?: "keep-free" | "subscribe" | "manage";
    } => {
        if (tierId === "free")
            return { text: "Keep This", disabled: false, action: "keep-free" };
        if (subscribed && currentTier === tierId)
            return { text: "Current Plan", disabled: true };
        if (internalTrialActive)
            return { text: "Subscribe Now", disabled: false, action: "subscribe" };
        if (subscribed && currentTier === "premium" && tierId === "pro")
            return { text: "Downgrade", disabled: false, action: "manage" };
        if (subscribed && tierId === "premium" && currentTier === "pro")
            return { text: "Upgrade", disabled: false, action: "manage" };
        return { text: "Subscribe", disabled: false, action: "subscribe" };
    };

    if (authLoading || subLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border/40 bg-background/95 backdrop-blur">
                <div className="container flex h-14 items-center">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Link>
                </div>
            </header>

            <main className="container py-8 md:py-12">
                <div className="mb-10 text-center">
                    <h1 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
                        Choose Your Plan
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                        Unlock powerful features to supercharge your revision
                    </p>
                </div>

                {/* Internal Trial Banner */}
                {internalTrialActive && !subscribed && (
                    <div className="mx-auto mb-8 max-w-2xl rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <div className="mb-1 flex items-center gap-2">
                                    <Crown className="h-5 w-5 text-primary" />
                                    <span className="font-semibold">Premium Trial Active</span>
                                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                                        Free Trial
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {internalTrialEnd
                                        ? `Trial ends ${formatDate(internalTrialEnd)}`
                                        : "Enjoy full Premium access"}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Trial Expired */}
                {internalTrialExpired && !subscribed && (
                    <div className="mx-auto mb-6 flex max-w-md items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2">
                        <X className="h-4 w-4 shrink-0 text-red-500" />
                        <p className="text-sm">
                            <span className="font-medium">Trial ended</span>
                            <span className="text-muted-foreground">
                                {" "}
                                · Subscribe to continue
                            </span>
                        </p>
                    </div>
                )}

                {/* Active Subscription */}
                {subscribed && (
                    <div className="mx-auto mb-8 max-w-2xl rounded-xl border border-primary/20 bg-primary/5 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <div className="mb-1 flex items-center gap-2">
                                    {currentTier === "premium" ? (
                                        <Crown className="h-5 w-5 text-primary" />
                                    ) : (
                                        <Sparkles className="h-5 w-5 text-primary" />
                                    )}
                                    <span className="font-semibold capitalize">
                                        {currentTier} Plan
                                    </span>
                                    {isTrialing && (
                                        <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                                            Trial
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {isTrialing && trialEnd
                                        ? `Trial ends ${formatDate(trialEnd)}`
                                        : subscriptionEnd
                                            ? `Renews ${formatDate(subscriptionEnd)}`
                                            : "Active subscription"}
                                </p>
                            </div>
                            <button
                                onClick={handleManageSubscription}
                                disabled={portalLoading}
                                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
                            >
                                {portalLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Settings className="h-4 w-4" />
                                )}
                                Manage Subscription
                            </button>
                        </div>
                    </div>
                )}

                {/* Pricing Cards */}
                <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
                    {PRICING_TIERS.map((tier) => {
                        const buttonState = getButtonState(tier.id);
                        const isCurrent = currentTier === tier.id;

                        return (
                            <div
                                key={tier.id}
                                className={`relative flex flex-col rounded-xl border bg-card p-6 transition-all ${tier.highlighted
                                        ? "scale-[1.02] border-primary shadow-lg"
                                        : "border-border"
                                    } ${isCurrent ? "ring-2 ring-primary" : ""}`}
                            >
                                {tier.badge && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                                        {tier.badge}
                                    </span>
                                )}
                                {isCurrent && (
                                    <span className="absolute -top-3 right-4 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                                        Your Plan
                                    </span>
                                )}

                                <div className="pb-2 text-center">
                                    <h3 className="text-xl font-semibold">{tier.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {tier.description}
                                    </p>
                                </div>

                                <div className="mb-6 text-center">
                                    <span className="text-4xl font-bold">{tier.price}</span>
                                    <span className="ml-1 text-muted-foreground">
                                        /{tier.period}
                                    </span>
                                </div>

                                <ul className="flex-1 space-y-3">
                                    {tier.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                                            <span className="text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    className={`mt-6 w-full rounded-lg py-2.5 text-sm font-medium transition-colors ${tier.highlighted
                                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                            : "border border-border bg-card hover:bg-muted"
                                        } disabled:opacity-50`}
                                    disabled={
                                        (buttonState.disabled &&
                                            buttonState.action !== "keep-free") ||
                                        checkoutLoading !== null
                                    }
                                    onClick={async () => {
                                        if (buttonState.action === "keep-free") {
                                            const supabase = createClient();
                                            if (user) {
                                                await supabase
                                                    .from("profiles")
                                                    .update({
                                                        chose_free_at: new Date().toISOString(),
                                                    })
                                                    .eq("id", user.id);
                                            }
                                            router.push("/dashboard");
                                            return;
                                        }
                                        if (tier.id !== "free" && !buttonState.disabled) {
                                            if (subscribed && currentTier !== tier.id) {
                                                handleManageSubscription();
                                            } else {
                                                handleSubscribe(tier.id as "pro" | "premium");
                                            }
                                        }
                                    }}
                                >
                                    {checkoutLoading === tier.id && (
                                        <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                                    )}
                                    {buttonState.text}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-12 text-center text-sm text-muted-foreground">
                    <p>All plans include our core curriculum content. Cancel anytime.</p>
                    <p className="mt-1">
                        Questions? Contact us at support@masterymind.app
                    </p>
                </div>
            </main>
        </div>
    );
}

export default function SubscriptionPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-background">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }
        >
            <SubscriptionContent />
        </Suspense>
    );
}
