"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brain, ChevronDown, Menu, X, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";

const FEATURES = [
    {
        name: "Smart Quizzes",
        href: "/features/quizzes",
        description: "Adaptive spaced repetition",
    },
    {
        name: "Exam Mode",
        href: "/features/exam-mode",
        description: "Real exam-style practice",
    },
    {
        name: "Blurt",
        href: "/features/blurt",
        description: "Knowledge elicitation",
    },
    {
        name: "NEA Coach",
        href: "/features/nea-coach",
        description: "Coursework support",
    },
    {
        name: "Past Papers",
        href: "/features/past-papers",
        description: "Import & practice",
    },
];

export function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [featuresOpen, setFeaturesOpen] = useState(false);
    const [resourcesOpen, setResourcesOpen] = useState(false);
    const { user, signOut } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.push("/");
    };

    const close = () => {
        setMobileMenuOpen(false);
        setFeaturesOpen(false);
        setResourcesOpen(false);
    };

    return (
        <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
                Skip to content
            </a>
            <nav aria-label="Main navigation">
                <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2" onClick={close}>
                        <Brain className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
                        <span className="font-display text-lg font-bold sm:text-xl">
                            MasteryMind
                        </span>
                    </Link>

                    {/* Desktop */}
                    <div className="hidden items-center gap-4 lg:flex">
                        {/* Features dropdown */}
                        <div className="group relative">
                            <button aria-haspopup="true" aria-expanded="false" className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted">
                                Features <ChevronDown className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <div className="invisible absolute left-0 top-full z-50 w-56 rounded-lg border border-border bg-card p-1 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
                                {FEATURES.map((f) => (
                                    <Link
                                        key={f.href}
                                        href={f.href}
                                        className="block rounded-md px-3 py-2 transition-colors hover:bg-primary hover:text-primary-foreground"
                                    >
                                        <span className="text-sm font-medium">{f.name}</span>
                                        <span className="block text-xs opacity-70">
                                            {f.description}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <Link
                            href="/subjects"
                            className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                        >
                            Subjects
                        </Link>
                        <Link
                            href="/pricing"
                            className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                        >
                            Pricing
                        </Link>

                        {/* Resources dropdown */}
                        <div className="group relative">
                            <button aria-haspopup="true" aria-expanded="false" className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted">
                                Resources <ChevronDown className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <div className="invisible absolute left-0 top-full z-50 w-56 rounded-lg border border-border bg-card p-1 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
                                <a
                                    href="https://blog.masterymind.co.uk"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block rounded-md px-3 py-2 transition-colors hover:bg-primary hover:text-primary-foreground"
                                >
                                    <span className="text-sm font-medium">Blog</span>
                                    <span className="block text-xs opacity-70">
                                        Articles and revision tips
                                    </span>
                                </a>
                                <Link
                                    href="/study-guides"
                                    className="block rounded-md px-3 py-2 transition-colors hover:bg-primary hover:text-primary-foreground"
                                >
                                    <span className="text-sm font-medium">Study Guides</span>
                                    <span className="block text-xs opacity-70">
                                        In-depth topic guides
                                    </span>
                                </Link>
                            </div>
                        </div>

                        <ThemeToggle />

                        {user ? (
                            <>
                                <Link
                                    href="/dashboard"
                                    className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                                >
                                    Dashboard
                                </Link>
                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                                >
                                    <LogOut className="h-4 w-4" aria-hidden="true" />
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/auth"
                                    className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/auth"
                                    className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                                >
                                    Get Started Free
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile toggle */}
                    <div className="flex items-center gap-2 lg:hidden">
                        <ThemeToggle />
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-muted"
                            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                        >
                            {mobileMenuOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                <div
                    className={`overflow-hidden border-t border-border/40 bg-background transition-all duration-300 lg:hidden ${mobileMenuOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"
                        }`}
                >
                    <div className="mx-auto max-w-6xl space-y-1 px-4 py-3">
                        {/* Features accordion */}
                        <div>
                            <button
                                onClick={() => setFeaturesOpen(!featuresOpen)}
                                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                            >
                                Features
                                <ChevronDown
                                    className={`h-4 w-4 transition-transform ${featuresOpen ? "rotate-180" : ""
                                        }`}
                                />
                            </button>
                            {featuresOpen && (
                                <div className="mt-1 space-y-1 pl-4">
                                    {FEATURES.map((f) => (
                                        <Link
                                            key={f.href}
                                            href={f.href}
                                            onClick={close}
                                            className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
                                        >
                                            <span className="font-medium">{f.name}</span>
                                            <span className="block text-xs text-muted-foreground">
                                                {f.description}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Link
                            href="/subjects"
                            onClick={close}
                            className="block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                        >
                            Subjects
                        </Link>
                        <Link
                            href="/pricing"
                            onClick={close}
                            className="block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                        >
                            Pricing
                        </Link>

                        {/* Resources accordion */}
                        <div>
                            <button
                                onClick={() => setResourcesOpen(!resourcesOpen)}
                                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                            >
                                Resources
                                <ChevronDown
                                    className={`h-4 w-4 transition-transform ${resourcesOpen ? "rotate-180" : ""
                                        }`}
                                />
                            </button>
                            {resourcesOpen && (
                                <div className="mt-1 space-y-1 pl-4">
                                    <a
                                        href="https://blog.masterymind.co.uk"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={close}
                                        className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
                                    >
                                        Blog
                                    </a>
                                    <Link
                                        href="/study-guides"
                                        onClick={close}
                                        className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
                                    >
                                        Study Guides
                                    </Link>
                                </div>
                            )}
                        </div>

                        {user ? (
                            <>
                                <Link
                                    href="/dashboard"
                                    onClick={close}
                                    className="block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                                >
                                    Dashboard
                                </Link>
                                <button
                                    onClick={() => {
                                        handleSignOut();
                                        close();
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/auth"
                                    onClick={close}
                                    className="block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/auth"
                                    onClick={close}
                                    className="mt-2 block rounded-lg bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                                >
                                    Get Started Free
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>
        </header >
    );
}
