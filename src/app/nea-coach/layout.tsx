import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NEA Coach",
  description: "AI-powered NEA coaching for Computer Science. Get structured guidance through Analysis, Design, Development, and Evaluation.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
