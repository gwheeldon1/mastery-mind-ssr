import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy | MasteryMind",
    description:
        "How MasteryMind collects, uses, and protects your personal data. UK GDPR compliant. Student data protection details.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
