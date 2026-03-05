"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
    Building2,
    Check,
    Users,
    GraduationCap,
    Shield,
    Zap,
    BarChart3,
    Clock,
    HeadphonesIcon,
    Sparkles,
    Crown,
    ArrowRight,
    UserCheck,
} from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

const BENEFITS = [
    { icon: Users, title: "Unlimited Teachers", description: "All staff get full access at no extra cost. Only pay for student licenses." },
    { icon: GraduationCap, title: "Domain Auto-Licensing", description: "Students with your school email automatically receive their license on signup." },
    { icon: Shield, title: "Secure & GDPR Compliant", description: "Data protection built-in. Student data stays safe and private." },
    { icon: Zap, title: "AI-Powered Learning", description: "Personalised practice with spaced repetition and instant AI feedback." },
    { icon: BarChart3, title: "Progress Analytics", description: "Track student progress across subjects with detailed insights." },
    { icon: Clock, title: "Save Teacher Time", description: "Automated grading and feedback means less marking, more teaching." },
];

const TIERS = [
    {
        id: "pro" as const,
        name: "Pro",
        pricePerSeat: 6.99,
        originalPrice: 9.99,
        description: "Exam-style practice for your students",
        features: ["Everything in Free tier", "Exam-style questions with AI grading", "Blurt knowledge elicitation", "Detailed mark schemes", "Spaced repetition scheduling", "Unlimited teacher accounts"],
        icon: Sparkles,
    },
    {
        id: "premium" as const,
        name: "Premium",
        pricePerSeat: 10.49,
        originalPrice: 14.99,
        description: "Full access including coursework support",
        features: ["Everything in Pro tier", "Past paper import & practice", "NEA Coach for coursework", "Personalised AI guidance", "Priority support", "Unlimited teacher accounts"],
        icon: Crown,
        highlighted: true,
    },
];

const TESTIMONIALS = [
    { quote: "MasteryMind has transformed how our students prepare for exams. The AI feedback is incredibly detailed.", author: "Dr. Sarah Mitchell", role: "Head of Science, Manchester Academy" },
    { quote: "The domain auto-licensing made rollout effortless. Students just sign up with their school email.", author: "James Thompson", role: "IT Director, St. Mary's College" },
];

const FAQ = [
    { q: "Do teachers need their own licenses?", a: "No! All teacher accounts are completely free. You only pay for student licenses." },
    { q: "How does domain auto-licensing work?", a: "When a student signs up with an email from your school domain (e.g., @yourschool.edu), they automatically receive the school's subscription tier. No manual assignment needed." },
    { q: "Can we add more students later?", a: "Yes! You can adjust your student count at any time through the school admin dashboard. Billing adjusts automatically." },
];

export default function SchoolsPage() {
    const [selectedTier, setSelectedTier] = useState<"pro" | "premium">("premium");
    const [studentCount, setStudentCount] = useState(100);

    const pricing = useMemo(() => {
        const tier = TIERS.find((t) => t.id === selectedTier)!;
        const monthlyTotal = tier.pricePerSeat * studentCount;
        const yearlyTotal = monthlyTotal * 12;
        const savings = (tier.originalPrice - tier.pricePerSeat) * studentCount * 12;
        return {
            monthlyTotal: monthlyTotal.toFixed(2),
            yearlyTotal: yearlyTotal.toFixed(2),
            savings: savings.toFixed(2),
            pricePerSeat: tier.pricePerSeat.toFixed(2),
        };
    }, [selectedTier, studentCount]);

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Navbar />

            {/* Hero */}
            <section className="relative overflow-hidden py-16 md:py-24">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
                <div className="relative mx-auto max-w-3xl px-4 text-center">
                    <span className="mb-4 inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                        <Building2 className="h-3 w-3" /> For Schools
                    </span>
                    <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                        Empower Your School with <span className="text-primary">AI-Powered Learning</span>
                    </h1>
                    <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
                        Get 30% off with school pricing. Unlimited teacher accounts included. Only pay for student licenses with a 7-day free trial.
                    </p>
                    <div className="flex flex-col justify-center gap-4 sm:flex-row">
                        <Link href="/auth" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                            Start 7-Day Free Trial <ArrowRight className="h-4 w-4" />
                        </Link>
                        <a href="mailto:schools@masterymind.app" className="inline-flex items-center justify-center rounded-lg border border-border px-6 py-3 font-medium transition-colors hover:bg-muted">
                            Contact Sales
                        </a>
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section className="bg-muted/30 py-16">
                <div className="mx-auto max-w-6xl px-4">
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-3xl font-bold">Why Schools Choose MasteryMind</h2>
                        <p className="mx-auto max-w-2xl text-muted-foreground">Join hundreds of schools using AI to accelerate student learning and reduce teacher workload</p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {BENEFITS.map((b) => (
                            <div key={b.title} className="rounded-xl border border-border/50 bg-card p-6">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                    <b.icon className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="mb-2 text-lg font-semibold">{b.title}</h3>
                                <p className="text-sm text-muted-foreground">{b.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Calculator */}
            <section className="py-16 md:py-24">
                <div className="mx-auto max-w-4xl px-4">
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-3xl font-bold">Simple, Transparent Pricing</h2>
                        <p className="mx-auto max-w-2xl text-muted-foreground">30% off individual pricing. Unlimited teachers included. Only pay for students.</p>
                    </div>

                    {/* Tier Selection */}
                    <div className="mb-10 grid gap-6 md:grid-cols-2">
                        {TIERS.map((tier) => (
                            <button
                                key={tier.id}
                                onClick={() => setSelectedTier(tier.id)}
                                className={`relative rounded-xl border bg-card p-6 text-left transition-all hover:shadow-lg ${selectedTier === tier.id ? "ring-2 ring-primary" : "border-border"} ${tier.highlighted ? "border-primary" : ""}`}
                            >
                                {tier.highlighted && <span className="absolute -top-3 left-4 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">Most Popular</span>}
                                <span className="absolute -top-3 right-4 rounded-full bg-destructive px-2.5 py-0.5 text-xs font-medium text-destructive-foreground">30% off</span>
                                <div className="mb-2 flex items-center gap-2">
                                    <tier.icon className="h-5 w-5 text-primary" />
                                    <span className="text-lg font-semibold">{tier.name}</span>
                                </div>
                                <p className="mb-4 text-sm text-muted-foreground">{tier.description}</p>
                                <div className="mb-1 flex items-baseline gap-2">
                                    <span className="text-4xl font-bold">£{tier.pricePerSeat.toFixed(2)}</span>
                                    <span className="text-sm text-muted-foreground line-through">£{tier.originalPrice.toFixed(2)}</span>
                                </div>
                                <span className="text-sm text-muted-foreground">per student/month</span>
                                <ul className="mt-4 space-y-2">
                                    {tier.features.map((f) => (
                                        <li key={f} className="flex items-start gap-2 text-sm">
                                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </button>
                        ))}
                    </div>

                    {/* Student Count Slider */}
                    <div className="mb-8 rounded-xl border border-border bg-card p-6">
                        <div className="mb-2 flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            <h3 className="font-semibold">How many students?</h3>
                        </div>
                        <p className="mb-6 text-sm text-muted-foreground">Drag the slider to see your pricing. Teachers are always free.</p>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">10 students</span>
                                <span className="text-2xl font-bold">{studentCount} students</span>
                                <span className="text-sm text-muted-foreground">500+ students</span>
                            </div>
                            <input
                                type="range"
                                min={10}
                                max={500}
                                step={10}
                                value={studentCount}
                                onChange={(e) => setStudentCount(Number(e.target.value))}
                                className="w-full accent-primary"
                            />
                        </div>
                        <div className="mt-6 grid gap-4 md:grid-cols-3">
                            <div className="rounded-lg bg-muted p-4 text-center">
                                <p className="mb-1 text-sm text-muted-foreground">Monthly</p>
                                <p className="text-2xl font-bold">£{pricing.monthlyTotal}</p>
                            </div>
                            <div className="rounded-lg border border-primary/20 bg-primary/10 p-4 text-center">
                                <p className="mb-1 text-sm text-muted-foreground">Yearly</p>
                                <p className="text-2xl font-bold text-primary">£{pricing.yearlyTotal}</p>
                            </div>
                            <div className="rounded-lg bg-muted p-4 text-center">
                                <p className="mb-1 text-sm text-muted-foreground">You Save</p>
                                <p className="text-2xl font-bold text-primary">£{pricing.savings}</p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <UserCheck className="h-4 w-4" />
                            Unlimited teacher accounts included at no extra cost
                        </div>
                    </div>

                    <div className="space-y-4 text-center">
                        <Link href="/auth" className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                            Start Your 7-Day Free Trial <ArrowRight className="h-4 w-4" />
                        </Link>
                        <p className="text-sm text-muted-foreground">No credit card required to start. Cancel anytime.</p>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="bg-muted/30 py-16">
                <div className="mx-auto max-w-4xl px-4">
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-3xl font-bold">Get Started in Minutes</h2>
                        <p className="text-muted-foreground">Simple setup with automatic student enrollment</p>
                    </div>
                    <div className="grid gap-8 md:grid-cols-3">
                        {[
                            { step: "1", title: "Create School Account", desc: "Sign up as a school admin and enter your institution details" },
                            { step: "2", title: "Add Your Domains", desc: "Enter your school email domains for automatic student licensing" },
                            { step: "3", title: "Students Sign Up", desc: "Students using your school email automatically get their license" },
                        ].map((s) => (
                            <div key={s.step} className="text-center">
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                                    {s.step}
                                </div>
                                <h3 className="mb-2 font-semibold">{s.title}</h3>
                                <p className="text-sm text-muted-foreground">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-16">
                <div className="mx-auto max-w-4xl px-4">
                    <h2 className="mb-8 text-center text-3xl font-bold">Trusted by Educators</h2>
                    <div className="grid gap-8 md:grid-cols-2">
                        {TESTIMONIALS.map((t) => (
                            <div key={t.author} className="rounded-xl border bg-muted/50 p-6">
                                <p className="mb-4 text-lg italic">&ldquo;{t.quote}&rdquo;</p>
                                <p className="font-semibold">{t.author}</p>
                                <p className="text-sm text-muted-foreground">{t.role}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="bg-muted/30 py-16">
                <div className="mx-auto max-w-3xl px-4">
                    <h2 className="mb-8 text-center text-3xl font-bold">Common Questions</h2>
                    <div className="space-y-4">
                        {FAQ.map((item) => (
                            <div key={item.q} className="rounded-xl border border-border bg-card p-6">
                                <h3 className="mb-2 text-lg font-semibold">{item.q}</h3>
                                <p className="text-muted-foreground">{item.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-16 md:py-24">
                <div className="mx-auto max-w-3xl px-4">
                    <div className="rounded-2xl bg-primary p-8 text-center text-primary-foreground">
                        <h2 className="mb-4 text-3xl font-bold">Ready to Transform Learning?</h2>
                        <p className="mx-auto mb-6 max-w-lg opacity-80">Join schools across the UK using MasteryMind to boost student outcomes with AI-powered revision.</p>
                        <div className="flex flex-col justify-center gap-4 sm:flex-row">
                            <Link href="/auth" className="inline-flex items-center justify-center gap-2 rounded-lg bg-background px-6 py-3 font-medium text-foreground transition-colors hover:bg-background/90">
                                Start 7-Day Free Trial <ArrowRight className="h-4 w-4" />
                            </Link>
                            <a href="mailto:schools@masterymind.app" className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary-foreground/20 px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10">
                                <HeadphonesIcon className="h-4 w-4" /> Talk to Sales
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
