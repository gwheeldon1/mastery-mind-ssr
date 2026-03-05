import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Statistics",
  description: "Your revision statistics — mastery progress, question accuracy, study streaks, and performance trends over time.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
