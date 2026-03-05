import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscription",
  description: "Manage your MasteryMind subscription. Upgrade to Pro or Premium for full access to all revision features.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
