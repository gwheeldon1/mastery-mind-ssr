import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blurt Challenge",
  description: "Test your recall with the Blurt Challenge. Speak or type everything you know about a topic, and AI analyses your coverage.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
