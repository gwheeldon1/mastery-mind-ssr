import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your MasteryMind dashboard — track progress, streaks, mastery stats, and start revising across all your subjects.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
