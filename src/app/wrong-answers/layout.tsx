import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wrong Answers Practice",
  description: "Review and practise your incorrect answers, grouped by concept. Turn mistakes into mastery with targeted revision.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
