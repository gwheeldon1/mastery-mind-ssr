import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Brain, Sparkles } from "lucide-react";

export const metadata: Metadata = {
    title: "Terms and Conditions",
    description:
        "Read MasteryMind's terms and conditions. Understand your rights and responsibilities when using our AI-powered GCSE and A-Level revision platform.",
};

const SECTIONS = [
    {
        title: "1. Acceptance of Terms",
        content:
            "By accessing and using MasteryMind, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our service.",
    },
    {
        title: "2. Description of Service",
        content:
            "MasteryMind is an educational platform designed to help students prepare for UK GCSE and A-Level examinations. Our service includes adaptive quizzes, exam practice, revision tools, and AI-powered study assistance.",
    },
    {
        title: "3. User Accounts",
        content: "To use MasteryMind, you must create an account. You agree to:",
        items: [
            "Provide accurate and complete information",
            "Maintain the security of your account credentials",
            "Notify us immediately of any unauthorized use",
            "Be responsible for all activities under your account",
        ],
    },
    {
        title: "4. Age Requirements",
        content:
            "MasteryMind is designed for students aged 13 and above. If you are under 13, you must have parental or guardian consent to use our service. If you are under 18, you confirm that you have obtained consent from a parent or guardian.",
    },
    {
        title: "5. Acceptable Use",
        content: "You agree not to:",
        items: [
            "Share your account with others",
            "Attempt to access other users' accounts or data",
            "Use the service for any unlawful purpose",
            "Interfere with or disrupt the service",
            "Copy, modify, or distribute our content without permission",
            "Use automated systems to access the service",
        ],
    },
    {
        title: "6. AI-Generated Content Disclaimer",
        content:
            "MasteryMind uses artificial intelligence to generate educational content, including questions, explanations, feedback, and study materials. By using our service, you acknowledge and accept that:",
        items: [
            "AI may produce errors: AI systems can generate inaccurate, incomplete, or misleading information.",
            "Not a replacement for teachers: AI-generated content is supplementary and should never replace qualified teachers, official textbooks, or exam board materials.",
            "Verify important information: Always cross-reference AI-generated content with official curriculum materials.",
            "No guarantee of accuracy: We do not warrant that AI-generated content is accurate, complete, current, or suitable for any particular purpose.",
            "Exam preparation at your own risk: We cannot guarantee that AI-generated questions reflect actual exam content or marking criteria.",
        ],
    },
    {
        title: "7. Educational Content",
        content:
            "MasteryMind content is provided for educational purposes only. We do not guarantee exam results, grades, or academic outcomes. Content should be used alongside official curriculum materials, exam board specifications, and teacher guidance.",
    },
    {
        title: "8. NEA Coach Disclaimer",
        content:
            "Our NEA Coach feature is designed to support coursework development while respecting JCQ guidelines. However, you are solely responsible for ensuring your final submission meets all exam board requirements. MasteryMind does not guarantee compliance and is not liable for any coursework penalties.",
    },
    {
        title: "9. Intellectual Property",
        content:
            "All content, features, and functionality of MasteryMind are owned by us and protected by copyright, trademark, and other intellectual property laws. Your use of the service does not grant you ownership of any content or materials.",
    },
    {
        title: "10. Subscription and Payments",
        content:
            "Some features require a paid subscription. Payment terms, refund policies, and subscription details are provided at the point of purchase. Subscriptions automatically renew unless cancelled.",
    },
    {
        title: "11. Limitation of Liability",
        content: "To the fullest extent permitted by law:",
        items: [
            'MasteryMind is provided "as is" and "as available" without warranties of any kind.',
            "We do not warrant that the service will be uninterrupted, error-free, or free from harmful components.",
            "We expressly disclaim all warranties regarding AI-generated content.",
            "We are not liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from your use of the service.",
            "Our total liability is limited to the amount you paid for the service in the 12 months preceding the claim.",
        ],
    },
    {
        title: "12. Indemnification",
        content:
            "You agree to indemnify and hold harmless MasteryMind, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the service, your violation of these terms, or your reliance on AI-generated content.",
    },
    {
        title: "13. Changes to Terms",
        content:
            "We may update these terms from time to time. We will notify you of significant changes via email or through the service. Continued use after changes constitutes acceptance of the new terms.",
    },
    {
        title: "14. Termination",
        content:
            "We may suspend or terminate your account if you violate these terms. You may also delete your account at any time through your profile settings.",
    },
    {
        title: "15. Governing Law",
        content:
            "These terms are governed by the laws of England and Wales. Any disputes will be resolved in the courts of England and Wales.",
    },
    {
        title: "16. Contact Us",
        content:
            "If you have questions about these Terms and Conditions, please contact us at support@masterymind.com.",
    },
];

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-3xl px-4 py-8">
                <div className="mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-muted"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Link>
                </div>

                <div className="mb-6 flex items-center gap-2">
                    <div className="relative">
                        <Brain className="h-8 w-8 text-primary" />
                        <Sparkles className="absolute -right-1 -top-1 h-4 w-4 text-warning" />
                    </div>
                    <span className="font-display text-xl font-bold">MasteryMind</span>
                </div>

                <h1 className="mb-6 text-3xl font-bold">Terms and Conditions</h1>
                <p className="mb-6 text-muted-foreground">Last updated: January 2025</p>

                <div className="space-y-6">
                    {SECTIONS.map((section) => (
                        <section key={section.title}>
                            <h2 className="mb-3 text-xl font-semibold">{section.title}</h2>
                            <p className="text-muted-foreground">{section.content}</p>
                            {"items" in section && section.items && (
                                <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
                                    {section.items.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
}
