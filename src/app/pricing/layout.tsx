import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Pricing | MasteryMind",
    description:
        "Free quiz practice, Pro exam-style questions with AI grading, and Premium NEA coursework support. Plans for GCSE and A-Level students.",
    openGraph: {
        title: "Choose Your Plan | MasteryMind",
        description:
            "Start free, upgrade when you're ready. AI-powered revision tools for every exam board.",
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
