import Link from "next/link";
import { Brain } from "lucide-react";

export function Footer() {
    return (
        <footer className="border-t border-border/40 py-6 sm:py-8">
            <div className="mx-auto max-w-6xl px-4">
                <div className="flex flex-col items-center gap-4 sm:gap-6 md:flex-row md:justify-between">
                    <div className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                        <span className="font-display text-sm font-semibold sm:text-base">
                            MasteryMind
                        </span>
                    </div>
                    <nav aria-label="Footer navigation">
                        <div className="space-y-4">
                            <div>
                                <h3 className="mb-2 text-xs font-semibold">Learn</h3>
                                <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground sm:text-sm md:justify-start">
                                    <li>
                                        <Link
                                            href="/subjects"
                                            className="py-1 transition-colors hover:text-foreground"
                                        >
                                            Subjects
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/study-guides"
                                            className="py-1 transition-colors hover:text-foreground"
                                        >
                                            Study Guides
                                        </Link>
                                    </li>
                                    <li>
                                        <a
                                            href="https://blog.masterymind.co.uk"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="py-1 transition-colors hover:text-foreground"
                                        >
                                            Blog
                                        </a>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="mb-2 text-xs font-semibold">Company</h3>
                                <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground sm:text-sm md:justify-start">
                                    <li>
                                        <Link
                                            href="/pricing"
                                            className="py-1 transition-colors hover:text-foreground"
                                        >
                                            Pricing
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/privacy"
                                            className="py-1 transition-colors hover:text-foreground"
                                        >
                                            Privacy
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/terms"
                                            className="py-1 transition-colors hover:text-foreground"
                                        >
                                            Terms
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </nav>
                    <p className="text-center text-xs text-muted-foreground sm:text-sm">
                        © {new Date().getFullYear()} MasteryMind. Built for UK &
                        international students.
                    </p>
                </div>
            </div>
        </footer>
    );
}
