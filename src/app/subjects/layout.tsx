import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Subjects",
  description: "Explore GCSE, iGCSE and A-Level subjects. Adaptive quizzes, study guides, and revision resources for every exam board including AQA, Edexcel, OCR and Cambridge.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
