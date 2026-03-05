"use client";

/**
 * Study Guides listing page — browse, search, and filter all published study guides.
 *
 * Features:
 * - Search by topic name, subject, exam board
 * - Filter by subject, exam board, qualification level
 * - Pagination (30 per page)
 * - SEO-friendly with proper metadata
 */

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import {
    BookOpen,
    Search,
    Clock,
    GraduationCap,
    Loader2,
    ChevronLeft,
    ChevronRight,
    X,
    FileText,
    Brain,
} from "lucide-react";

const GUIDES_PER_PAGE = 30;

interface StudyGuide {
    id: string;
    slug: string;
    topic_name: string;
    exam_board: string;
    qualification_level: string;
    summary: string | null;
    estimated_read_time_mins: number | null;
    subject_name: string | null;
    subject_slug: string | null;
    subject_color: string | null;
    has_worked_examples: boolean;
    has_practice_questions: boolean;
}

interface SubjectOption {
    id: string;
    name: string;
    slug: string;
}

export default function StudyGuidesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    const [guides, setGuides] = useState<StudyGuide[]>([]);
    const [subjects, setSubjects] = useState<SubjectOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(
        searchParams.get("q") || ""
    );

    // Filters from URL
    const selectedSubject = searchParams.get("subject") || "all";
    const selectedBoard = searchParams.get("board") || "all";
    const selectedLevel = searchParams.get("level") || "all";
    const currentPage = parseInt(searchParams.get("page") || "1", 10);

    // Fetch data
    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const [{ data: subjectData }, { data: guideData }] = await Promise.all([
                    supabase.from("subjects").select("id, name, slug").order("name"),
                    supabase
                        .from("study_guides")
                        .select(
                            `id, slug, topic_name, exam_board, qualification_level,
               summary, estimated_read_time_mins,
               worked_examples, practice_questions,
               subject_id, subjects:subject_id (name, slug, color)`
                        )
                        .in("status", ["published", "review"])
                        .order("topic_name"),
                ]);

                if (subjectData) setSubjects(subjectData);

                setGuides(
                    (guideData || []).map((g: any) => ({
                        id: g.id,
                        slug: g.slug,
                        topic_name: g.topic_name,
                        exam_board: g.exam_board,
                        qualification_level: g.qualification_level,
                        summary: g.summary,
                        estimated_read_time_mins: g.estimated_read_time_mins,
                        subject_name: g.subjects?.name || null,
                        subject_slug: g.subjects?.slug || null,
                        subject_color: g.subjects?.color || null,
                        has_worked_examples: Array.isArray(g.worked_examples) && g.worked_examples.length > 0,
                        has_practice_questions: Array.isArray(g.practice_questions) && g.practice_questions.length > 0,
                    }))
                );
            } catch (err) {
                console.error("Error fetching study guides:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [supabase]);

    // Extract unique filter options from data
    const boards = useMemo(
        () => [...new Set(guides.map((g) => g.exam_board))].sort(),
        [guides]
    );
    const levels = useMemo(
        () => [...new Set(guides.map((g) => g.qualification_level))].sort(),
        [guides]
    );

    // Apply filters
    const filteredGuides = useMemo(() => {
        return guides.filter((g) => {
            if (selectedSubject !== "all" && g.subject_slug !== selectedSubject)
                return false;
            if (selectedBoard !== "all" && g.exam_board !== selectedBoard)
                return false;
            if (selectedLevel !== "all" && g.qualification_level !== selectedLevel)
                return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                if (
                    !g.topic_name.toLowerCase().includes(q) &&
                    !g.exam_board.toLowerCase().includes(q) &&
                    !g.subject_name?.toLowerCase().includes(q) &&
                    !g.summary?.toLowerCase().includes(q)
                )
                    return false;
            }
            return true;
        });
    }, [guides, selectedSubject, selectedBoard, selectedLevel, searchQuery]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredGuides.length / GUIDES_PER_PAGE));
    const paginatedGuides = filteredGuides.slice(
        (currentPage - 1) * GUIDES_PER_PAGE,
        currentPage * GUIDES_PER_PAGE
    );

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "all") {
            params.delete(key);
        } else {
            params.set(key, value);
        }
        params.delete("page");
        router.push(`/study-guides?${params.toString()}`);
    };

    const goToPage = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        if (page <= 1) {
            params.delete("page");
        } else {
            params.set("page", String(page));
        }
        router.push(`/study-guides?${params.toString()}`);
    };

    const hasActiveFilters =
        selectedSubject !== "all" ||
        selectedBoard !== "all" ||
        selectedLevel !== "all" ||
        searchQuery.trim() !== "";

    const clearFilters = () => {
        setSearchQuery("");
        router.push("/study-guides");
    };

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Navbar />

            {/* Hero */}
            <section className="bg-gradient-to-b from-primary/5 via-primary/[0.02] to-background py-10 md:py-14">
                <div className="mx-auto max-w-6xl px-4 text-center">
                    <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                        <BookOpen className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="mb-3 text-3xl font-bold md:text-4xl">Study Guides</h1>
                    <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                        Comprehensive revision guides packed with worked examples, practice
                        questions, and proven exam techniques.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
                            <FileText className="h-3.5 w-3.5" />
                            {guides.length} guides
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
                            <GraduationCap className="h-3.5 w-3.5" />
                            GCSE, iGCSE & A-Level
                        </span>
                    </div>
                </div>
            </section>

            {/* Filters + Search */}
            <section className="border-b bg-muted/30">
                <div className="mx-auto max-w-6xl px-4 py-4">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                placeholder="Search guides..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        {/* Subject filter */}
                        <select
                            value={selectedSubject}
                            onChange={(e) => updateFilter("subject", e.target.value)}
                            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        >
                            <option value="all">All Subjects</option>
                            {subjects.map((s) => (
                                <option key={s.id} value={s.slug}>
                                    {s.name}
                                </option>
                            ))}
                        </select>

                        {/* Board filter */}
                        <select
                            value={selectedBoard}
                            onChange={(e) => updateFilter("board", e.target.value)}
                            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        >
                            <option value="all">All Boards</option>
                            {boards.map((b) => (
                                <option key={b} value={b}>
                                    {b}
                                </option>
                            ))}
                        </select>

                        {/* Level filter */}
                        <select
                            value={selectedLevel}
                            onChange={(e) => updateFilter("level", e.target.value)}
                            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        >
                            <option value="all">All Levels</option>
                            {levels.map((l) => (
                                <option key={l} value={l}>
                                    {l}
                                </option>
                            ))}
                        </select>

                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-muted"
                            >
                                <X className="h-3 w-3" /> Clear
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* Results */}
            <section className="flex-1 py-8">
                <div className="mx-auto max-w-6xl px-4">
                    {loading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredGuides.length === 0 ? (
                        <div className="py-16 text-center">
                            <BookOpen className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                            <p className="mb-1 text-lg font-medium">No guides found</p>
                            <p className="text-sm text-muted-foreground">
                                {hasActiveFilters
                                    ? "Try adjusting your filters or search query"
                                    : "Study guides are being generated and will appear here soon"}
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="mb-4 text-sm text-muted-foreground">
                                Showing {(currentPage - 1) * GUIDES_PER_PAGE + 1}–
                                {Math.min(currentPage * GUIDES_PER_PAGE, filteredGuides.length)}{" "}
                                of {filteredGuides.length} guides
                            </p>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {paginatedGuides.map((g) => (
                                    <Link
                                        key={g.id}
                                        href={`/study-guides/${g.slug}`}
                                        className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                                    >
                                        <h3 className="mb-1 font-semibold leading-snug group-hover:text-primary">
                                            {g.topic_name}
                                        </h3>
                                        <div className="mb-2 flex flex-wrap gap-1.5">
                                            {g.subject_name && (
                                                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                                                    {g.subject_name}
                                                </span>
                                            )}
                                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                                                {g.exam_board}
                                            </span>
                                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                                                {g.qualification_level}
                                            </span>
                                        </div>
                                        {g.summary && (
                                            <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
                                                {g.summary}
                                            </p>
                                        )}
                                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                                            {g.estimated_read_time_mins && (
                                                <span className="flex items-center gap-0.5">
                                                    <Clock className="h-2.5 w-2.5" />
                                                    {g.estimated_read_time_mins} min
                                                </span>
                                            )}
                                            {g.has_worked_examples && (
                                                <span className="flex items-center gap-0.5">
                                                    <Brain className="h-2.5 w-2.5" />
                                                    Examples
                                                </span>
                                            )}
                                            {g.has_practice_questions && (
                                                <span className="flex items-center gap-0.5">
                                                    <FileText className="h-2.5 w-2.5" />
                                                    Questions
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="mt-8 flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => goToPage(currentPage - 1)}
                                        disabled={currentPage <= 1}
                                        className="rounded-lg border border-border p-2 text-sm disabled:opacity-50"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let page: number;
                                        if (totalPages <= 5) {
                                            page = i + 1;
                                        } else if (currentPage <= 3) {
                                            page = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            page = totalPages - 4 + i;
                                        } else {
                                            page = currentPage - 2 + i;
                                        }
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => goToPage(page)}
                                                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${page === currentPage
                                                        ? "bg-primary text-primary-foreground"
                                                        : "border border-border hover:bg-muted"
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    })}
                                    <button
                                        onClick={() => goToPage(currentPage + 1)}
                                        disabled={currentPage >= totalPages}
                                        className="rounded-lg border border-border p-2 text-sm disabled:opacity-50"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
}
