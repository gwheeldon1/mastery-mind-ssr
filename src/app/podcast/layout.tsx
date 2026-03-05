import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Revision Podcasts",
  description: "Listen to AI-generated revision podcasts for GCSE and A-Level topics. Learn while on the go with audio study guides.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
