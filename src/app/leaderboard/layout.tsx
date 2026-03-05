import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "See how you rank against other students. Weekly XP leaderboard for GCSE and A-Level revision on MasteryMind.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
