import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Email",
  description: "Verify your MasteryMind account email address to enable all features.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
