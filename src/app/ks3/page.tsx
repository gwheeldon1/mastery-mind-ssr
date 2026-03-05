import type { Metadata } from "next";
import Link from "next/link";
import {
    ArrowRight,
    Brain,
    BookOpen,
    Target,
    Clock,
    Sparkles,
    CheckCircle2,
    GraduationCap,
} from "lucide-react";

export const metadata: Metadata = {
    title: "KS3 Revision — Year 7, 8 & 9 Study Tools | MasteryMind",
    description:
        "Smart revision for KS3 students in Years 7–9. Adaptive quizzes, study guides, and spaced repetition to build strong foundations before GCSE. Free to start.",
    alternates: { canonical: "/ks3" },
};

const KS3_SUBJECTS = [
    "Maths", "English", "Science", "History", "Geography",
    "Computer Science", "French", "Spanish", "German", "RE",
];

const BENEFITS = [
    {
        icon: Brain,
        title: "Build Strong Foundations",
        description:
            "KS3 is where lasting study habits form. Our adaptive quizzes adjust to your level so you're always learning, never stuck.",
    },
    {
        icon: Target,
        title: "Prepare for GCSEs Early",
        description:
            "Students who revise actively from Year 7 outperform at GCSE. Get ahead by mastering core concepts now.",
    },
    {
        icon: BookOpen,
        title: "Study Guides & Worked Examples",
        description:
            "Clear, student-friendly guides for every topic — written to match what you're learning in class.",
    },
    {
        icon: Clock,
        title: "Spaced Repetition That Works",
        description:
            "Our smart scheduling reviews topics at the perfect time so knowledge sticks for years, not days.",
    },
];

export default function KS3Page() {
    return (
        <div className="min-h-screen bg-background">
            {/* Schema.org structured data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Course",
                        name: "KS3 Revision on MasteryMind",
                        description:
                            "Adaptive revision platform for Key Stage 3 students covering Maths, English, Science and more",
                        provider: { "@type": "Organization", name: "MasteryMind" },
                        educationalLevel: "Key Stage 3",
                        isAccessibleForFree: true,
                    }),
                }}
            />

            {/* Hero */}
            <section className="bg-gradient-to-b from-primary/5 to-background py-14 md:py-20">
                <div className="container mx-auto max-w-3xl px-4 text-center">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                        <Sparkles className="h-4 w-4" />
                        Years 7 – 9
                    </div>
                    <h1 className="mb-5 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                        KS3 Revision Made{" "}
                        <span className="text-primary">Simple & Effective</span>
                    </h1>
                    <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
                        Build the skills and knowledge that will carry you through to GCSE and
                        beyond. Adaptive quizzes, study guides, and smart scheduling — all free to
                        start.
                    </p>
                    <Link
                        href="/auth?mode=signup"
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-lg font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        Start Revising Free
                        <ArrowRight className="h-5 w-5" />
                    </Link>
                    <p className="mt-4 text-sm text-muted-foreground">
                        No credit card required • 10+ KS3 subjects
                    </p>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-12 md:py-16">
                <div className="container mx-auto px-4">
                    <h2 className="mb-10 text-center text-3xl font-bold md:text-4xl">
                        Why Start Revising in KS3?
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
                    <h2 className="mb-3 text-3xl font-bold">KS3 Subjects Available</h2>
                    <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
                        Content aligned to the national curriculum for Years 7, 8 and 9.
                    </p>
                    <div className="mx-auto flex max-w-2xl flex-wrap justify-center gap-3">
                        {KS3_SUBJECTS.map((s) => (
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

            {/* CTA */}
            <section className="py-14 md:py-20">
                <div className="container mx-auto max-w-3xl px-4 text-center">
                    <GraduationCap className="mx-auto mb-6 h-14 w-14 text-primary" />
                    <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                        Get a Head Start on Your GCSEs
                    </h2>
                    <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground">
                        The earlier you start revising, the easier your GCSEs will be. MasteryMind
                        makes it simple, effective, and even enjoyable.
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
                            href="/subjects"
                            className="inline-block rounded-xl border border-border px-8 py-3 font-medium transition-colors hover:bg-muted"
                        >
                            Browse Subjects
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
