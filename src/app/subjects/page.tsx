"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BookOpen, GraduationCap, Loader2, ArrowRight, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

const SUBJECT_DESCRIPTIONS: Record<string, string> = {
    Mathematics: "Master algebra, geometry, statistics, and calculus with curriculum-aligned practice.",
    "Further Mathematics": "Advanced topics including complex numbers, matrices, and differential equations.",
    Biology: "Explore living organisms from cells to ecosystems, with practical skills fully covered.",
    Chemistry: "Understand atomic structure, bonding, reactions, and organic chemistry.",
    Physics: "Study forces, energy, waves, and electricity with mathematical problem-solving.",
    "Combined Science": "Comprehensive Biology, Chemistry, and Physics in an integrated course.",
    "Computer Science": "Programming, algorithms, data structures, and computer systems theory.",
    "English Language": "Analytical and creative writing skills with language analysis.",
    "English Literature": "Analyse set texts including Shakespeare, prose, poetry, and drama.",
    History: "Historical periods, source analysis, and essay writing across time periods.",
    Geography: "Physical and human geography including fieldwork skills.",
    Psychology: "Human behaviour, cognitive processes, and research methods.",
    Economics: "Micro and macroeconomics, market structures, and economic policy.",
    "Business Studies": "Business concepts, management, marketing, and financial decision-making.",
    "Religious Studies": "Religious beliefs, practices, ethics, and philosophical arguments.",
    Sociology: "Society, social structures, culture, and sociological research methods.",
};

interface LevelData {
    levelName: string;
    slug: string | null;
    examBoards: string[];
}

interface GroupedSubject {
    name: string;
    icon: string | null;
    color: string | null;
    description: string;
    levels: LevelData[];
}

const COLOR_MAP: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-l-blue-500",
    lime: "bg-lime-500/10 text-lime-600 dark:text-lime-400 border-l-lime-500",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-l-orange-500",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-l-purple-500",
    indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-l-indigo-500",
    cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-l-cyan-500",
    teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-l-teal-500",
    pink: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-l-pink-500",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-l-rose-500",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-l-amber-500",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-l-emerald-500",
    green: "bg-green-500/10 text-green-600 dark:text-green-400 border-l-green-500",
    red: "bg-red-500/10 text-red-600 dark:text-red-400 border-l-red-500",
};

export default function SubjectsPage() {
    const supabase = createClient();

    const { data: subjects = [], isLoading } = useQuery({
        queryKey: ["subjects-list"],
        queryFn: async () => {
            const { data, error } = await supabase.rpc("get_subjects_with_levels");
            if (error) throw error;

            const grouped = new Map<string, GroupedSubject>();

            (data || []).forEach(
                (row: {
                    subject_name: string;
                    icon: string | null;
                    color: string | null;
                    slug: string | null;
                    description: string | null;
                    qualification_level: string;
                    exam_boards: string[];
                }) => {
                    if (!grouped.has(row.subject_name)) {
                        grouped.set(row.subject_name, {
                            name: row.subject_name,
                            icon: row.icon,
                            color: row.color,
                            description:
                                row.description ||
                                SUBJECT_DESCRIPTIONS[row.subject_name] ||
                                `Comprehensive curriculum coverage for ${row.subject_name}.`,
                            levels: [],
                        });
                    }

                    const group = grouped.get(row.subject_name)!;
                    let levelEntry = group.levels.find(
                        (l) => l.levelName === row.qualification_level
                    );
                    if (!levelEntry) {
                        levelEntry = {
                            levelName: row.qualification_level,
                            slug: row.slug,
                            examBoards: [],
                        };
                        group.levels.push(levelEntry);
                    }

                    (row.exam_boards || []).forEach((board: string) => {
                        if (!levelEntry!.examBoards.includes(board)) {
                            levelEntry!.examBoards.push(board);
                        }
                    });

                    if (row.icon && !group.icon) group.icon = row.icon;
                    if (row.color && !group.color) group.color = row.color;
                }
            );

            const levelOrder: Record<string, number> = {
                GCSE: 0,
                iGCSE: 1,
                "A-Level": 2,
            };
            grouped.forEach((g) => {
                g.levels.sort(
                    (a, b) =>
                        (levelOrder[a.levelName] ?? 3) - (levelOrder[b.levelName] ?? 3)
                );
                g.levels.forEach((l) => l.examBoards.sort());
            });

            return Array.from(grouped.values()).sort((a, b) =>
                a.name.localeCompare(b.name)
            );
        },
    });

    const getClasses = (color: string | null) =>
        COLOR_MAP[color || ""] || "bg-primary/10 text-primary border-l-primary";

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Navbar />

            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
                {/* Hero */}
                <div className="mb-8 text-center sm:mb-12">
                    <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 sm:mb-4 sm:h-16 sm:w-16">
                        <GraduationCap className="h-6 w-6 text-primary sm:h-8 sm:w-8" />
                    </div>
                    <h1 className="mb-3 text-2xl font-bold sm:text-3xl md:text-4xl">
                        {isLoading ? "Loading..." : `${subjects.length} Subjects Available`}
                    </h1>
                    <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
                        Full curriculum support from KS2 through A-Level, aligned to all
                        major UK exam boards including AQA, Edexcel, OCR, and WJEC/Eduqas.
                    </p>
                </div>

                {/* Loading */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                        {subjects.map((subject) => {
                            const classes = getClasses(subject.color);
                            return (
                                <div
                                    key={subject.name}
                                    className={`group flex h-full flex-col overflow-hidden rounded-xl border border-border border-l-4 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${classes.split(" ").find((c) => c.startsWith("border-l-")) ||
                                        "border-l-primary"
                                        }`}
                                >
                                    {/* Header */}
                                    <Link
                                        href={`/subjects/${subject.levels[0]?.slug || ""}`}
                                        className="block p-4 pb-3"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div
                                                className={`rounded-xl p-3 transition-transform duration-300 group-hover:scale-110 ${classes.split(" ").slice(0, 2).join(" ")
                                                    }`}
                                            >
                                                <BookOpen className="h-6 w-6" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h2 className="flex items-center gap-1.5 text-lg font-semibold transition-colors group-hover:text-primary">
                                                    {subject.name}
                                                    <ArrowRight className="h-4 w-4 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                                                </h2>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {subject.levels.map((l) => l.levelName).join(" & ")}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>

                                    <div className="flex flex-1 flex-col px-4 pb-4 pt-0">
                                        <p className="mb-5 line-clamp-2 text-sm text-muted-foreground">
                                            {subject.description}
                                        </p>

                                        {/* Board chips per level */}
                                        <div className="mb-5 flex-1 space-y-4">
                                            {subject.levels.map((lvl) => (
                                                <div
                                                    key={lvl.levelName}
                                                    className="rounded-lg bg-muted/40 p-3"
                                                >
                                                    <p className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                                        {lvl.levelName}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {lvl.examBoards.map((board) => (
                                                            <Link
                                                                key={board}
                                                                href={`/subjects/${lvl.slug}/${board.toLowerCase()}/${lvl.levelName.toLowerCase()}`}
                                                            >
                                                                <span className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-foreground/80 transition-all duration-200 hover:scale-105 hover:border-primary hover:bg-primary/10 hover:text-primary hover:shadow-sm">
                                                                    {board}
                                                                    <ChevronRight className="h-3 w-3 opacity-40" />
                                                                </span>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* CTA */}
                                        {subject.levels[0]?.slug && (
                                            <Link
                                                href={`/subjects/${subject.levels[0].slug}`}
                                                className="mt-auto block w-full rounded-lg border border-border py-2 text-center text-sm font-medium transition-all duration-200 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"
                                            >
                                                Explore Subject
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Bottom CTA */}
                {!isLoading && (
                    <div className="mt-12 text-center sm:mt-16">
                        <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
                            <Link
                                href="/auth"
                                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                            >
                                Get Started Free
                            </Link>
                            <Link
                                href="/pricing"
                                className="inline-flex items-center justify-center rounded-lg border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-muted"
                            >
                                View Pricing
                            </Link>
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
