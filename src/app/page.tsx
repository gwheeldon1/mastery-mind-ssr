import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Target,
  Clock,
  Repeat,
  BookOpen,
  PenTool,
} from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

const FEATURES = [
  {
    icon: PenTool,
    title: "Your Exam Board, Your Specification",
    description:
      "Full support for AQA, Edexcel, OCR, and WJEC. Questions use the exact command words, mark allocations, and structures your examiners expect.",
  },
  {
    icon: BookOpen,
    title: "Feedback Like a Real Examiner",
    description:
      "Get detailed feedback on every answer. For essays, we check your structure and analysis. For maths, we verify each step of your working.",
  },
  {
    icon: Target,
    title: "Questions That Match Your Level",
    description:
      "Start where you are, grow from there. Struggling? We simplify. Finding it easy? We challenge you more.",
  },
  {
    icon: Clock,
    title: "Reviews Timed for Maximum Retention",
    description:
      "We schedule reviews at the perfect moment to move knowledge from short-term to long-term memory. Revise smarter, not harder.",
  },
  {
    icon: Repeat,
    title: "Mix Topics for Better Learning",
    description:
      "Practising different topics together helps you spot patterns and think like an examiner. Research shows this boosts retention by 43%.",
  },
  {
    icon: Brain,
    title: "AI That Understands Your Gaps",
    description:
      "Our AI analyses your responses to identify knowledge gaps and automatically generates targeted practice to fill them.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Brain className="h-4 w-4" />
              AI-Powered Revision
            </div>
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight md:text-6xl">
              Ace Your{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                GCSEs & A-Levels
              </span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Adaptive AI quizzes aligned to your exact specification. Spaced
              repetition that actually works. Exam-style practice with real
              examiner feedback.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg"
              >
                Start Revising Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-8 py-3 text-base font-medium transition-colors hover:bg-muted"
              >
                See Features
              </a>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border bg-card py-8">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8 px-4 text-center md:gap-16">
          {[
            { value: "30+", label: "Subjects" },
            { value: "50k+", label: "Questions" },
            { value: "4", label: "Exam Boards" },
            { value: "Free", label: "To Start" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-primary md:text-3xl">
                {s.value}
              </p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Why Students Choose MasteryMind
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Evidence-based learning features that help you truly understand and
              remember.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-card py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Ready to Start Revising?
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Join thousands of students using MasteryMind to master their
            subjects. Free to start, no credit card required.
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg"
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
