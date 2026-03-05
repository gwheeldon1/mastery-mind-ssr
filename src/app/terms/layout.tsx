import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms and Conditions | MasteryMind",
    description:
        "Terms of service for using MasteryMind's educational platform. Covers accounts, subscriptions, AI content, and intellectual property.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
