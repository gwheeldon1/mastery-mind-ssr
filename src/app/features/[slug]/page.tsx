import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ArrowRight } from "lucide-react";
import {
    Brain,
    FileText,
    MessageSquare,
    Timer,
    Shuffle,
    PenTool,
    Upload,
} from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

const TIER_LABELS = {
    free: { label: "Free", color: "bg-muted text-muted-foreground" },
    pro: { label: "Pro Plan", color: "bg-primary/10 text-primary" },
    premium: { label: "Premium Plan", color: "bg-primary text-primary-foreground" },
};

interface FeatureData {
    title: string;
    subtitle: string;
    description: string;
    icon: string;
    tier: "free" | "pro" | "premium";
    badge?: string;
    benefits: string[];
    howItWorks: { step: string; description: string }[];
    seoTitle?: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    Brain,
    FileText,
    MessageSquare,
    Timer,
    Shuffle,
    PenTool,
    Upload,
};

const FEATURES: Record<string, FeatureData> = {
    quizzes: {
        title: "Smart Quizzes",
        subtitle: "AI-powered adaptive quizzes",
        description:
            "Questions aligned to AQA, Edexcel, OCR & WJEC specifications that adapt to your level. Spaced repetition scheduling ensures you review at the optimal time for long-term retention.",
        icon: "Brain",
        tier: "free",
        seoTitle: "AI Quizzes for GCSE & A-Level Revision",
        benefits: [
            "Questions aligned to your exact specification",
            "Adaptive difficulty that grows with you",
            "Spaced repetition for maximum retention",
            "Instant feedback on every answer",
            "Progress tracking across topics",
            "Works for all major exam boards",
        ],
        howItWorks: [
            { step: "Choose your subject", description: "Pick your subject, exam board, and qualification level." },
            { step: "Answer questions", description: "AI generates questions matched to your current level and specification." },
            { step: "Get instant feedback", description: "See detailed explanations for every answer to deepen understanding." },
            { step: "Review at the right time", description: "Spaced repetition schedules reviews to lock knowledge into long-term memory." },
        ],
    },
    "exam-mode": {
        title: "Exam Mode",
        subtitle: "Practice under real exam conditions",
        description:
            "Timed, exam-style questions with AI grading that mirrors real examiner feedback. Build confidence with mark scheme breakdowns and structured feedback.",
        icon: "FileText",
        tier: "pro",
        seoTitle: "Exam Practice with AI Marking for GCSE & A-Level",
        benefits: [
            "Timed exam-style questions",
            "AI grading against real mark schemes",
            "Detailed examiner-quality feedback",
            "Mark scheme breakdowns",
            "Command word practice",
            "Build exam technique and confidence",
        ],
        howItWorks: [
            { step: "Select your exam", description: "Choose the subject, paper, and topic areas you want to practice." },
            { step: "Answer under timed conditions", description: "Questions appear with realistic mark allocations and time pressure." },
            { step: "Receive AI grading", description: "Your answers are marked against official mark scheme criteria." },
            { step: "Review feedback", description: "See where you gained and lost marks with specific improvement guidance." },
        ],
    },
    "past-papers": {
        title: "Past Papers & AI Marking",
        subtitle: "Import and practice with real papers",
        description:
            "Upload past papers or photograph handwritten answers. Get instant AI marking against official mark schemes with detailed feedback.",
        icon: "Upload",
        tier: "pro",
        seoTitle: "Past Paper Import & AI Marking for GCSE & A-Level",
        benefits: [
            "Upload PDF or photograph answers",
            "AI marking against official mark schemes",
            "Handwriting recognition",
            "Step-by-step working analysis",
            "Comparison with model answers",
            "Track improvement over time",
        ],
        howItWorks: [
            { step: "Upload your paper", description: "Scan, photograph, or upload a PDF of your completed paper." },
            { step: "AI processes your answers", description: "Our AI reads your handwriting and identifies each question response." },
            { step: "Get instant marking", description: "Answers are graded against the official mark scheme with detailed comments." },
            { step: "Review and improve", description: "See model answers and specific guidance on how to gain more marks." },
        ],
    },
    blurt: {
        title: "Blurt — Active Recall",
        subtitle: "The most effective revision technique",
        description:
            "Write everything you know about a topic, then let AI identify your gaps. Backed by cognitive science research showing active recall improves retention by up to 150%.",
        icon: "MessageSquare",
        tier: "free",
        seoTitle: "Blurt Active Recall for GCSE & A-Level Revision",
        benefits: [
            "Write freely about any topic",
            "AI identifies knowledge gaps",
            "Targeted follow-up questions",
            "Tracks mastery over time",
            "Works across all subjects",
            "Research-backed technique",
        ],
        howItWorks: [
            { step: "Pick a topic", description: "Choose any topic from your specification you want to test yourself on." },
            { step: "Blurt everything you know", description: "Write freely — cover as much as you can without checking notes." },
            { step: "AI analyses your response", description: "Our AI compares your knowledge against the full specification content." },
            { step: "Fill the gaps", description: "See exactly what you missed and get targeted practice to fill gaps." },
        ],
    },
    "nea-coach": {
        title: "NEA Coursework Coach",
        subtitle: "JCQ-compliant coursework support",
        description:
            "Get AI coaching for your NEA coursework that stays within JCQ guidelines. Guidance on structure, analysis, and improvements without crossing the line.",
        icon: "PenTool",
        tier: "premium",
        badge: "JCQ Compliant",
        seoTitle: "NEA Coursework Coach — JCQ Compliant AI Guidance",
        benefits: [
            "JCQ-compliant AI guidance",
            "Structure and planning support",
            "Analysis and evaluation coaching",
            "Mark scheme alignment",
            "Draft review with suggestions",
            "Available for all NEA subjects",
        ],
        howItWorks: [
            { step: "Start your project", description: "Input your NEA title, subject, and exam board requirements." },
            { step: "Get structural guidance", description: "AI suggests how to structure your work to maximise marks." },
            { step: "Submit drafts for review", description: "Upload sections for AI feedback (JCQ compliant — no direct answers)." },
            { step: "Refine and improve", description: "Iteratively improve your work with targeted coaching feedback." },
        ],
    },
    "focus-timer": {
        title: "Focus Timer",
        subtitle: "Structured study with XP rewards",
        description:
            "Pomodoro-style study timer with customisable intervals, streak tracking, and XP rewards to keep you motivated during revision sessions.",
        icon: "Timer",
        tier: "free",
        seoTitle: "Study Focus Timer with XP Rewards",
        benefits: [
            "Pomodoro-style timed sessions",
            "Customisable work and break intervals",
            "XP rewards for completing sessions",
            "Daily streak tracking",
            "Session history and stats",
            "Reduces procrastination",
        ],
        howItWorks: [
            { step: "Set your timer", description: "Choose your study and break interval lengths (default: 25/5 minutes)." },
            { step: "Focus and study", description: "Work without distractions until the timer ends." },
            { step: "Take a break", description: "Rest your brain during the break interval before the next session." },
            { step: "Earn XP and build streaks", description: "Complete sessions to earn XP and maintain your daily study streak." },
        ],
    },
    "interleaved-practice": {
        title: "Interleaved Practice",
        subtitle: "Mix topics for better learning",
        description:
            "Practice different topics together instead of one at a time. Research shows interleaving improves exam performance by up to 43% compared to blocking.",
        icon: "Shuffle",
        tier: "pro",
        seoTitle: "Interleaved Practice for GCSE & A-Level",
        benefits: [
            "Mix topics across subjects",
            "Builds stronger connections",
            "Improves exam performance by 43%",
            "AI selects optimal topic mix",
            "Adapts to your weak areas",
            "Research-backed approach",
        ],
        howItWorks: [
            { step: "Select your subjects", description: "Choose which subjects and topics to include in your practice session." },
            { step: "AI creates the mix", description: "Questions from different topics are interleaved for maximum learning benefit." },
            { step: "Practice flexibly", description: "Switch between topic types, building the ability to identify and apply different concepts." },
            { step: "Track cross-topic progress", description: "See how interleaving improves your performance across all included topics." },
        ],
    },
};

export async function generateStaticParams() {
    return Object.keys(FEATURES).map((slug) => ({ slug }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const feature = FEATURES[slug];
    if (!feature) return {};
    return {
        title: feature.seoTitle || feature.title,
        description: feature.description,
    };
}

export default async function FeaturePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const feature = FEATURES[slug];
    if (!feature) notFound();

    const Icon = ICON_MAP[feature.icon] || Brain;
    const tierInfo = TIER_LABELS[feature.tier];

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Navbar />

            {/* Hero */}
            <section className="bg-gradient-to-b from-primary/5 to-background py-12 md:py-16">
                <div className="mx-auto max-w-3xl px-4 text-center">
                    <div className="mb-4 flex items-center justify-center gap-2">
                        {feature.badge && (
                            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                                {feature.badge}
                            </span>
                        )}
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tierInfo.color}`}>
                            {tierInfo.label}
                        </span>
                    </div>
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                        <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
                        {feature.title}
                    </h1>
                    <p className="mb-2 text-xl text-muted-foreground">{feature.subtitle}</p>
                    <p className="mx-auto mb-8 max-w-2xl text-muted-foreground">
                        {feature.description}
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <Link
                            href="/auth"
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                            Get Started <ArrowRight className="h-4 w-4" />
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

            {/* Benefits */}
            <section className="py-8 md:py-12">
                <div className="mx-auto max-w-4xl px-4">
                    <h2 className="mb-8 text-center text-2xl font-bold md:text-3xl">
                        Key Benefits
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {feature.benefits.map((b) => (
                            <div
                                key={b}
                                className="flex items-start gap-3 rounded-lg border border-border/50 bg-card p-4"
                            >
                                <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                                <span>{b}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="bg-muted/30 py-8 md:py-12">
                <div className="mx-auto max-w-3xl px-4">
                    <h2 className="mb-8 text-center text-2xl font-bold md:text-3xl">
                        How It Works
                    </h2>
                    <div className="space-y-5">
                        {feature.howItWorks.map((step, idx) => (
                            <div key={idx} className="flex gap-4">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                                    {idx + 1}
                                </div>
                                <div>
                                    <h3 className="mb-1 font-semibold">{step.step}</h3>
                                    <p className="text-muted-foreground">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-12 md:py-16">
                <div className="mx-auto max-w-6xl px-4 text-center">
                    <h2 className="mb-4 text-2xl font-bold md:text-3xl">
                        Ready to try {feature.title}?
                    </h2>
                    <p className="mx-auto mb-6 max-w-xl text-muted-foreground">
                        Join thousands of students already improving their grades with
                        MasteryMind.
                    </p>
                    <Link
                        href="/auth"
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        Get Started Free <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </section>

            <Footer />
        </div>
    );
}
