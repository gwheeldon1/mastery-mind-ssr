import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "KS3 Revision — Year 7, 8 & 9 Study Tools | MasteryMind",
    description:
        "Build strong foundations for GCSE with adaptive KS3 quizzes and study guides. Spaced repetition, progress tracking, and 10+ subjects.",
    openGraph: {
        title: "KS3 Revision Made Simple & Effective | MasteryMind",
        description:
            "Start revising early. Adaptive quizzes and study guides for Years 7, 8, and 9.",
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
