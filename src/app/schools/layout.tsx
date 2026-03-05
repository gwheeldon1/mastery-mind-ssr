import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Schools",
  description: "MasteryMind for Schools — AI-powered revision tools for your students. Track progress, set assignments, and boost grades across every subject and exam board.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
