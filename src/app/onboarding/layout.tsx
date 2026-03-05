import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Started",
  description: "Set up your MasteryMind account — choose your subjects, year group, and exam board to personalise your revision.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
