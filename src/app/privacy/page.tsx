import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Brain, Sparkles } from "lucide-react";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description:
        "Learn how MasteryMind protects your data. Our privacy policy explains how we collect, use, and safeguard your personal information. GDPR compliant.",
};

const SECTIONS = [
    {
        title: "1. Introduction",
        content:
            'MasteryMind ("we", "our", "us") is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information when you use our educational platform.',
    },
    {
        title: "2. Information We Collect",
        content:
            "We collect the following types of information:",
        lists: [
            {
                heading: "Account Information",
                items: ["Email address", "Display name", "Year group", "Learning preferences"],
            },
            {
                heading: "Learning Data",
                items: [
                    "Quiz responses and scores",
                    "Study progress and mastery levels",
                    "Subjects studied and exam boards",
                    "Time spent on activities",
                ],
            },
            {
                heading: "Technical Data",
                items: ["Device information", "Browser type", "IP address", "Usage patterns"],
            },
        ],
    },
    {
        title: "3. How We Use Your Information",
        content: "We use your information to:",
        items: [
            "Provide personalized learning experiences",
            "Track your progress and adapt difficulty",
            "Generate performance insights and recommendations",
            "Improve our service and content",
            "Communicate important updates",
            "Ensure platform security",
        ],
    },
    {
        title: "4. Data Protection for Students",
        content:
            "We take extra care to protect student data. We comply with UK GDPR and the Data Protection Act 2018. We implement age-appropriate privacy protections and limit data collection to what is necessary for educational purposes.",
    },
    {
        title: "5. Data Sharing",
        content: "We do not sell your personal information. We may share data with:",
        items: [
            "Service providers who help operate our platform (hosting, analytics)",
            "AI providers for generating educational content (anonymized where possible)",
            "Legal authorities if required by law",
        ],
    },
    {
        title: "6. Leaderboards and Social Features",
        content:
            "If you participate in leaderboards, your display name and XP scores may be visible to other users. Your detailed learning data remains private. You can choose not to participate in public features.",
    },
    {
        title: "7. Data Retention",
        content:
            "We retain your data for as long as your account is active. Learning progress data is kept to provide continuous educational value. You can request deletion of your account and associated data at any time.",
    },
    {
        title: "8. Your Rights",
        content: "Under UK GDPR, you have the right to:",
        items: [
            "Access your personal data",
            "Correct inaccurate data",
            "Request deletion of your data",
            "Object to certain processing",
            "Data portability",
            "Withdraw consent",
        ],
    },
    {
        title: "9. Security",
        content:
            "We implement appropriate technical and organizational measures to protect your data, including encryption, secure authentication, and access controls. However, no system is completely secure, and we cannot guarantee absolute security.",
    },
    {
        title: "10. Cookies",
        content:
            "We use essential cookies to maintain your session and remember your preferences. We may use analytics cookies to understand how the service is used. You can control cookies through your browser settings.",
    },
    {
        title: "11. Third-Party Links",
        content:
            "Our service may contain links to external websites. We are not responsible for the privacy practices of these sites. We encourage you to review their privacy policies.",
    },
    {
        title: "12. Changes to This Policy",
        content:
            "We may update this privacy policy from time to time. We will notify you of significant changes via email or through the service. The date at the top indicates when the policy was last updated.",
    },
    {
        title: "13. Contact Us",
        content:
            "If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us at privacy@masterymind.com.",
    },
    {
        title: "14. Supervisory Authority",
        content:
            "You have the right to lodge a complaint with the Information Commissioner's Office (ICO) if you believe your data protection rights have been violated: ico.org.uk",
    },
];

export default function PrivacyPage() {
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

                <h1 className="mb-6 text-3xl font-bold">Privacy Policy</h1>
                <p className="mb-6 text-muted-foreground">Last updated: January 2025</p>

                <div className="space-y-6">
                    {SECTIONS.map((section) => (
                        <section key={section.title}>
                            <h2 className="mb-3 text-xl font-semibold">{section.title}</h2>
                            <p className="text-muted-foreground">{section.content}</p>
                            {"lists" in section &&
                                section.lists?.map((list) => (
                                    <div key={list.heading} className="mt-4">
                                        <h3 className="mb-2 text-lg font-medium">{list.heading}</h3>
                                        <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                                            {list.items.map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
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
