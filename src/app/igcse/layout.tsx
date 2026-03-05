import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "iGCSE Revision — Cambridge & Edexcel International GCSE | MasteryMind",
    description:
        "AI-powered revision aligned to Cambridge International and Edexcel iGCSE specifications. Adaptive quizzes, study guides, and exam-style practice.",
    openGraph: {
        title: "iGCSE Revision That Actually Works | MasteryMind",
        description:
            "Practise smarter, score higher — from anywhere in the world. Cambridge & Edexcel iGCSE.",
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
