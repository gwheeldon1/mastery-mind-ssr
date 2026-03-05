import type { Metadata } from "next";
import Link from "next/link";
import {
    ArrowRight,
    Globe,
    BookOpen,
    FileText,
    Target,
    Sparkles,
    CheckCircle2,
    GraduationCap,
} from "lucide-react";

export const metadata: Metadata = {
    title: "iGCSE Revision — Cambridge & Edexcel International GCSE | MasteryMind",
    description:
        "Smart revision for iGCSE students worldwide. AI quizzes, past paper practice, and study guides aligned to Cambridge International & Edexcel iGCSE specifications. Free to start.",
    alternates: { canonical: "/igcse" },
};

const IGCSE_BOARDS = [
    { name: "Cambridge International (CAIE)", detail: "0475, 0580, 0620 and more" },
    { name: "Edexcel International GCSE", detail: "4MA1, 4BI1, 4CH1 and more" },
];

const IGCSE_SUBJECTS = [
    "Mathematics", "English Literature", "English Language", "Biology",
    "Chemistry", "Physics", "History", "Geography", "Computer Science",
    "Business", "Economics", "French", "Spanish",
];

const BENEFITS = [
    {
        icon: Globe,
        title: "Built for International Students",
        description:
            "Whether you study in the UK, Middle East, Asia or Africa — our content matches your exact iGCSE specification.",
    },
    {
        icon: FileText,
        title: "Exam-Style Practice with AI Marking",
        description:
            "Practise past paper questions and get instant AI feedback against official mark schemes.",
    },
    {
        icon: Target,
        title: "Adaptive Difficulty",
        description:
            "Questions adjust to your level. Struggling? We simplify. Finding it easy? We challenge you harder.",
    },
    {
        icon: BookOpen,
        title: "Comprehensive Study Guides",
        description:
            "Syllabus-aligned guides with worked examples, key terminology, and exam tips for every topic.",
    },
];

export default function IGCSEPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Schema.org structured data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Course",
                        name: "iGCSE Revision on MasteryMind",
                        description:
                            "Adaptive revision platform for Cambridge International and Edexcel iGCSE students worldwide",
                        provider: { "@type": "Organization", name: "MasteryMind" },
                        educationalLevel: "iGCSE",
                        isAccessibleForFree: true,
                    }),
                }}
            />

            {/* Hero */}
            <section className="bg-gradient-to-b from-primary/5 to-background py-14 md:py-20">
                <div className="container mx-auto max-w-3xl px-4 text-center">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                        <Globe className="h-4 w-4" />
                        International GCSE
                    </div>
                    <h1 className="mb-5 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                        iGCSE Revision That{" "}
                        <span className="text-primary">Actually Works</span>
                    </h1>
                    <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
                        AI-powered revision aligned to Cambridge International and Edexcel iGCSE
                        specifications. Practise smarter, score higher — from anywhere in the world.
                    </p>
                    <Link
                        href="/auth?mode=signup"
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-lg font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        Start Revising Free
                        <ArrowRight className="h-5 w-5" />
                    </Link>
                    <p className="mt-4 text-sm text-muted-foreground">
                        No credit card required • Cambridge & Edexcel iGCSE
                    </p>
                </div>
            </section>

            {/* Exam Boards */}
            <section className="border-y border-border/40 bg-muted/30 py-10">
                <div className="container mx-auto px-4">
                    <div className="flex flex-wrap justify-center gap-8">
                        {IGCSE_BOARDS.map((b) => (
                            <div key={b.name} className="text-center">
                                <div className="text-lg font-semibold">{b.name}</div>
                                <div className="text-sm text-muted-foreground">{b.detail}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-12 md:py-16">
                <div className="container mx-auto px-4">
                    <h2 className="mb-10 text-center text-3xl font-bold md:text-4xl">
                        Why iGCSE Students Choose MasteryMind
                    </h2>
                    <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {BENEFITS.map((b) => {
                            const Icon = b.icon;
                            return (
                                <div
                                    key={b.title}
                                    className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-6"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                                        <Icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <h3 className="text-lg font-semibold">{b.title}</h3>
                                    <p className="text-sm leading-relaxed text-muted-foreground">
                                        {b.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Subjects */}
            <section className="bg-muted/30 py-12 md:py-16">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="mb-3 text-3xl font-bold">iGCSE Subjects Available</h2>
                    <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
                        Full syllabus coverage for Cambridge International and Edexcel iGCSE
                        specifications.
                    </p>
                    <div className="mx-auto flex max-w-2xl flex-wrap justify-center gap-3">
                        {IGCSE_SUBJECTS.map((s) => (
                            <span
                                key={s}
                                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium"
                            >
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                {s}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* International Schools */}
            <section className="py-12 md:py-16">
                <div className="container mx-auto max-w-3xl px-4 text-center">
                    <h2 className="mb-4 text-3xl font-bold">International Schools Welcome</h2>
                    <p className="mb-6 text-lg text-muted-foreground">
                        MasteryMind works with international schools offering iGCSE programmes. Set
                        up classes, assign topics, and track student progress — all aligned to your
                        exact specification.
                    </p>
                    <Link
                        href="/schools"
                        className="inline-block rounded-xl border border-border px-8 py-3 font-medium transition-colors hover:bg-muted"
                    >
                        Learn About School Plans
                    </Link>
                </div>
            </section>

            {/* CTA */}
            <section className="bg-muted/30 py-14 md:py-20">
                <div className="container mx-auto max-w-3xl px-4 text-center">
                    <GraduationCap className="mx-auto mb-6 h-14 w-14 text-primary" />
                    <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                        Ready to Ace Your iGCSEs?
                    </h2>
                    <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground">
                        Join students worldwide who are revising smarter with adaptive AI — aligned
                        to your exact iGCSE syllabus.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Link
                            href="/auth?mode=signup"
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            Create Free Account
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                        <Link
                            href="/pricing"
                            className="inline-block rounded-xl border border-border px-8 py-3 font-medium transition-colors hover:bg-muted"
                        >
                            View Pricing
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
