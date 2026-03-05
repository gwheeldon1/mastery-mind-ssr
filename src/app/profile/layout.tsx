import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your MasteryMind profile — display name, year group, subjects, and account settings.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
