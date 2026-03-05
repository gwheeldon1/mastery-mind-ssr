import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quiz",
  description: "AI-generated quiz questions adapted to your level. Practice GCSE and A-Level topics with instant feedback and explanations.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
