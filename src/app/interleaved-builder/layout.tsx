import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interleaved Practice",
  description: "Build interleaved practice quizzes across multiple topics and subjects for better long-term retention.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
