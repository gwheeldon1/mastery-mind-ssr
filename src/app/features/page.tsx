import type { Metadata } from "next";
import Link from "next/link";
import {
    Brain,
    FileText,
    MessageSquare,
    Timer,
    Shuffle,
    PenTool,
    Upload,
    ArrowRight,
} from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
    title: "KS3, GCSE, iGCSE & A-Level Revision Features",
    description:
        "Explore MasteryMind's revision tools: AI quizzes, exam practice, past paper marking, active recall, coursework coaching, and more.",
};

const FEATURES = [
    { title: "Smart Quizzes", description: "AI-powered adaptive quizzes aligned to AQA, Edexcel, OCR & WJEC specs. Questions adjust to your level for maximum learning.", icon: Brain, href: "/features/quizzes", tier: "free" as const },
    { title: "Exam Mode", description: "Timed, exam-style questions with AI grading and examiner-quality feedback. Practice under real conditions.", icon: FileText, href: "/features/exam-mode", tier: "pro" as const },
    { title: "Past Papers & AI Marking", description: "Upload past papers or photograph handwritten answers. Get instant AI marking against official mark schemes.", icon: Upload, href: "/features/past-papers", tier: "pro" as const },
    { title: "Blurt — Active Recall", description: "Write everything you know about a topic, then discover gaps. The most effective revision technique backed by cognitive science.", icon: MessageSquare, href: "/features/blurt", tier: "free" as const },
    { title: "NEA Coursework Coach", description: "JCQ-compliant AI coaching for written coursework. Get guidance without breaking exam board rules.", icon: PenTool, href: "/features/nea-coach", tier: "premium" as const },
    { title: "Focus Timer", description: "Pomodoro-style study timer with XP rewards. Stay focused with structured work and break intervals.", icon: Timer, href: "/features/focus-timer", tier: "free" as const },
    { title: "Interleaved Practice", description: "Mix topics from different subjects for stronger, more flexible learning. Proven to improve exam performance.", icon: Shuffle, href: "/features/interleaved-practice", tier: "pro" as const },
];

const TIER_STYLES = {
    free: "bg-muted text-muted-foreground",
    pro: "bg-primary/10 text-primary",
    premium: "bg-primary text-primary-foreground",
};

const TIER_LABELS = { free: "Free", pro: "Pro", premium: "Premium" };

export default function FeaturesIndexPage() {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Navbar />

            {/* Hero */}
            <section className="bg-gradient-to-b from-primary/5 to-background py-12 md:py-16">
                <div className="mx-auto max-w-3xl px-4 text-center">
                    <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
                        Revision Tools Built for Results — KS3 to A-Level
                    </h1>
                    <p className="mb-6 text-lg text-muted-foreground">
                        Every feature is aligned to UK exam boards and designed to help you
                        get better grades. Start free — upgrade when you&apos;re ready.
                    </p>
                    <Link
                        href="/auth"
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        Get Started Free
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </section>

            {/* Grid */}
            <section className="py-10 md:py-14">
                <div className="mx-auto max-w-5xl px-4">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {FEATURES.map((f) => (
                            <Link key={f.href} href={f.href} className="group">
                                <div className="flex h-full flex-col gap-3 rounded-xl border border-border/50 bg-card p-6 transition-shadow group-hover:shadow-md">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                            <f.icon className="h-5 w-5 text-primary" />
                                        </div>
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${TIER_STYLES[f.tier]}`}
                                        >
                                            {TIER_LABELS[f.tier]}
                                        </span>
                                    </div>
                                    <h2 className="text-lg font-semibold">{f.title}</h2>
                                    <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                                        {f.description}
                                    </p>
                                    <span className="mt-auto text-sm font-medium text-primary group-hover:underline">
                                        Learn more →
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-12 md:py-16">
                <div className="mx-auto max-w-6xl px-4 text-center">
                    <h2 className="mb-4 text-2xl font-bold md:text-3xl">
                        Ready to boost your grades?
                    </h2>
                    <p className="mx-auto mb-6 max-w-xl text-muted-foreground">
                        Join thousands of KS3, GCSE, iGCSE and A-Level students already
                        revising smarter with MasteryMind.
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <Link
                            href="/auth"
                            className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                            Get Started Free
                        </Link>
                        <Link
                            href="/pricing"
                            className="rounded-lg border border-border px-6 py-3 font-medium transition-colors hover:bg-muted"
                        >
                            View Pricing
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
