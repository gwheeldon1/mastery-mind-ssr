import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Exam Practice",
  description: "Timed exam practice with AI grading. Answer exam-style questions and get mark-scheme-aligned feedback.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
