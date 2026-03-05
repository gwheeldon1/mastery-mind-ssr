import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Study Guides",
  description: "Browse comprehensive study guides for GCSE, iGCSE and A-Level subjects. Worked examples, practice questions, key definitions, and exam technique tips.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
