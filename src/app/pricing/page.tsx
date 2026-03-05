import type { Metadata } from "next";
import Link from "next/link";
import { Check, Sparkles, Crown, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
    title: "Pricing",
    description:
        "Choose your MasteryMind plan. Start free with unlimited quizzes, or upgrade for exam-style questions, AI grading, and coursework support. 7-day free trial.",
};

interface PricingTier {
    id: "free" | "pro" | "premium";
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    highlighted?: boolean;
    badge?: string;
    icon?: typeof Sparkles;
}

const TIERS: PricingTier[] = [
    {
        id: "free",
        name: "Free",
        price: "£0",
        period: "forever",
        description: "Get started with basic quiz practice",
        features: [
            "Unlimited quizzes",
            "Spaced repetition scheduling",
            "Progress tracking",
            "Weekly leaderboard",
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
            "AI grading & detailed feedback",
            "Blurt knowledge elicitation",
            "Mark scheme breakdowns",
        ],
        highlighted: true,
        badge: "Most Popular",
        icon: Sparkles,
    },
    {
        id: "premium",
        name: "Premium",
        price: "£14.99",
        period: "per month",
        description: "Full access with coursework support",
        features: [
            "Everything in Pro",
            "Past paper import & practice",
            "NEA Coach for coursework",
            "JCQ-compliant guidance",
            "Priority support",
        ],
        icon: Crown,
    },
];

const FAQ = [
    {
        q: "Can I cancel anytime?",
        a: "Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.",
    },
    {
        q: "What exam boards are supported?",
        a: "We support AQA, Edexcel, OCR, and WJEC/Eduqas across GCSE and A-Level for most subjects.",
    },
    {
        q: "How does the free trial work?",
        a: "Every new user gets 7 days of free Premium access with no payment required. You can subscribe at any time during or after your trial.",
    },
    {
        q: "Can I upgrade or downgrade later?",
        a: "Absolutely. You can change your plan at any time from your subscription settings.",
    },
];

export default function PricingPage() {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Navbar />

            {/* Hero */}
            <section className="bg-gradient-to-b from-primary/5 to-background py-8 md:py-12">
                <div className="mx-auto max-w-6xl px-4 text-center">
                    <span className="mb-3 inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                        Simple Pricing
                    </span>
                    <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">
                        Choose Your Plan
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                        Start free, upgrade when you&apos;re ready. All plans include our
                        core curriculum content.
                    </p>
                </div>
            </section>

            {/* Cards */}
            <section className="py-6 md:py-10">
                <div className="mx-auto grid max-w-5xl gap-5 px-4 md:grid-cols-3">
                    {TIERS.map((tier) => (
                        <div
                            key={tier.id}
                            className={`relative flex flex-col rounded-xl border bg-card p-6 transition-all ${tier.highlighted
                                    ? "scale-[1.02] border-primary shadow-lg"
                                    : "border-border"
                                }`}
                        >
                            {tier.badge && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                                    {tier.badge}
                                </span>
                            )}

                            <div className="pb-2 text-center">
                                <h2 className="flex items-center justify-center gap-2 text-xl font-semibold">
                                    {tier.icon && (
                                        <tier.icon className="h-5 w-5 text-primary" />
                                    )}
                                    {tier.name}
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
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
                                {tier.features.map((f) => (
                                    <li key={f} className="flex items-start gap-2">
                                        <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                                        <span className="text-sm">{f}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-6">
                                <Link
                                    href="/auth"
                                    className={`block w-full rounded-lg py-2.5 text-center text-sm font-medium transition-colors ${tier.highlighted
                                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                            : "border border-border hover:bg-muted"
                                        }`}
                                >
                                    {tier.id === "free"
                                        ? "Start Now"
                                        : "Start 7-Day Free Trial"}
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ */}
            <section className="bg-muted/30 py-8 md:py-10">
                <div className="mx-auto max-w-4xl px-4">
                    <h2 className="mb-6 text-center text-xl font-bold md:text-2xl">
                        Frequently Asked Questions
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        {FAQ.map((item) => (
                            <div
                                key={item.q}
                                className="rounded-lg border border-border/50 bg-card p-4"
                            >
                                <h3 className="mb-1 text-sm font-semibold">{item.q}</h3>
                                <p className="text-xs text-muted-foreground">{item.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-10 md:py-14">
                <div className="mx-auto max-w-6xl px-4 text-center">
                    <h2 className="mb-3 text-xl font-bold md:text-2xl">
                        Ready to boost your grades?
                    </h2>
                    <p className="mx-auto mb-6 max-w-xl text-sm text-muted-foreground">
                        Join thousands of students already using MasteryMind to ace their
                        exams.
                    </p>
                    <Link
                        href="/auth"
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        Get Started Free
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </section>

            <Footer />
        </div>
    );
}
