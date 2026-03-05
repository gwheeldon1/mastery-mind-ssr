import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "Study tips, revision strategies, exam techniques, and MasteryMind product updates. Expert guidance for GCSE and A-Level students.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
