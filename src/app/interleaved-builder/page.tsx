"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useUserProfile } from "@/contexts/user-profile-context";
import { createClient } from "@/lib/supabase/client";
import {
    ArrowLeft,
    Shuffle,
    Target,
    X,
    ChevronDown,
    Check,
    Zap,
    Loader2,
} from "lucide-react";

interface Subject {
    id: string;
    name: string;
    color: string;
    icon: string | null;
}

interface Topic {
    id: string;
    topic: string;
    subtopic: string | null;
    subject_id: string;
    mastery_percentage: number;
}

function getMasteryColor(m: number) {
    if (m >= 80) return "text-green-500 bg-green-500/10";
    if (m >= 50) return "text-yellow-500 bg-yellow-500/10";
    return "text-red-500 bg-red-500/10";
}

export default function InterleavedBuilderPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { profile, isPrimaryMode } = useUserProfile();
    const supabase = createClient();

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
    const [questionCount, setQuestionCount] = useState(10);
    const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(
        new Set()
    );

    useEffect(() => {
        if (!authLoading && !user) router.replace("/auth");
    }, [authLoading, user, router]);

    useEffect(() => {
        if (user && profile?.year_group) fetchData();
    }, [user, profile?.year_group]);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);

        const { data: userSubjectsData } = await supabase
            .from("user_subjects")
            .select("subject_id, exam_board")
            .eq("user_id", user.id);

        if (!userSubjectsData?.length) {
            setSubjects([]);
            setTopics([]);
            setLoading(false);
            return;
        }

        const userSubjectIds = userSubjectsData.map((us) => us.subject_id);

        const { data: subjectsData } = await supabase
            .from("subjects")
            .select("id, name, color, icon")
            .in("id", userSubjectIds)
            .order("name");

        setSubjects(subjectsData || []);

        // Fetch curriculum topics for each subject
        let allTopics: Topic[] = [];
        for (const us of userSubjectsData) {
            let query = supabase
                .from("spec_topics")
                .select(
                    "id, topic_name, specification_versions!inner(subject_id, exam_board)"
                )
                .eq("specification_versions.subject_id", us.subject_id);

            if (us.exam_board) {
                query = query.eq("specification_versions.exam_board", us.exam_board);
            }

            const { data } = await query;
            if (data) {
                const mapped = (data as any[]).map((d: any) => ({
                    id: d.id,
                    topic: d.topic_name,
                    subtopic: null,
                    subject_id: d.specification_versions?.subject_id,
                    mastery_percentage: 0,
                }));
                allTopics = [...allTopics, ...mapped];
            }
        }

        // Fetch progress
        const { data: progressData } = await supabase
            .from("user_curriculum_progress")
            .select("spec_topic_id, curriculum_content_id, mastery_percentage")
            .eq("user_id", user.id);

        const progressMap = new Map<string, number>();
        progressData?.forEach((p) => {
            const key = p.spec_topic_id || p.curriculum_content_id;
            if (key) progressMap.set(key, p.mastery_percentage);
        });

        setTopics(
            allTopics.map((t) => ({
                ...t,
                mastery_percentage: progressMap.get(t.id) || 0,
            }))
        );
        setLoading(false);
    };

    const topicsBySubject = useMemo(() => {
        const map = new Map<string, Topic[]>();
        for (const t of topics) {
            const arr = map.get(t.subject_id) ?? [];
            arr.push(t);
            map.set(t.subject_id, arr);
        }
        return map;
    }, [topics]);

    const toggleTopic = (topicId: string) => {
        setSelectedTopics((prev) => {
            const next = new Set(prev);
            if (next.has(topicId)) next.delete(topicId);
            else next.add(topicId);
            return next;
        });
    };

    const selectAllFromSubject = (subjectId: string) => {
        const subjectTopics = topicsBySubject.get(subjectId) ?? [];
        setSelectedTopics((prev) => {
            const next = new Set(prev);
            const allSelected = subjectTopics.every((t) => next.has(t.id));
            if (allSelected) subjectTopics.forEach((t) => next.delete(t.id));
            else subjectTopics.forEach((t) => next.add(t.id));
            return next;
        });
    };

    const addWeakAreas = () => {
        const weakTopics = topics.filter((t) => t.mastery_percentage < 60);
        setSelectedTopics((prev) => {
            const next = new Set(prev);
            weakTopics.forEach((t) => next.add(t.id));
            return next;
        });
    };

    const toggleSubjectExpand = (subjectId: string) => {
        setExpandedSubjects((prev) => {
            const next = new Set(prev);
            if (next.has(subjectId)) next.delete(subjectId);
            else next.add(subjectId);
            return next;
        });
    };

    const startQuiz = () => {
        const params = new URLSearchParams({
            mode: "interleaved",
            topics: Array.from(selectedTopics).join(","),
            count: questionCount.toString(),
            name: "Interleaved Practice",
        });
        router.push(`/quiz/interleaved?${params.toString()}`);
    };

    if (authLoading || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex min-h-[100dvh] flex-col bg-background">
            {/* Header */}
            <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
                <Link
                    href="/dashboard"
                    className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="min-w-0 flex-1">
                    <h1 className="flex items-center gap-2 truncate text-lg font-semibold">
                        <Shuffle className="h-5 w-5 shrink-0 text-primary" />
                        {isPrimaryMode ? "Mix It Up! 🎲" : "Interleaved Practice"}
                    </h1>
                    <p className="truncate text-xs text-muted-foreground">
                        {isPrimaryMode
                            ? "Choose topics from different subjects!"
                            : "Select topics across subjects for spaced, interleaved learning."}
                    </p>
                </div>
                {selectedTopics.size > 0 && (
                    <span className="shrink-0 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
                        {selectedTopics.size}
                    </span>
                )}
            </header>

            {/* Content */}
            <main className="flex-1 space-y-4 overflow-y-auto p-4">
                {/* Quick actions */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={addWeakAreas}
                        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
                    >
                        <Target className="h-4 w-4 text-red-500" />
                        Add Weak Areas
                    </button>
                    <button
                        onClick={() => setSelectedTopics(new Set())}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                    >
                        <X className="h-4 w-4" />
                        Clear
                    </button>
                </div>

                {subjects.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border py-12 text-center">
                        <Shuffle className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                        <p className="font-medium">No subjects yet</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Add subjects in your profile to get started.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {subjects.map((subject) => {
                            const subjectTopics = topicsBySubject.get(subject.id) ?? [];
                            if (subjectTopics.length === 0) return null;

                            const isExpanded = expandedSubjects.has(subject.id);
                            const selectedCount = subjectTopics.filter((t) =>
                                selectedTopics.has(t.id)
                            ).length;
                            const allSelected = selectedCount === subjectTopics.length;

                            return (
                                <div
                                    key={subject.id}
                                    className={`overflow-hidden rounded-xl border bg-card ${selectedCount > 0
                                            ? "border-primary/30 bg-primary/5"
                                            : "border-border"
                                        }`}
                                >
                                    {/* Subject header */}
                                    <button
                                        type="button"
                                        onClick={() => toggleSubjectExpand(subject.id)}
                                        className={`flex w-full items-center gap-3 p-4 text-left ${isExpanded ? "border-b border-border" : ""
                                            }`}
                                    >
                                        <div
                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                                            style={{
                                                backgroundColor: `${subject.color}20`,
                                            }}
                                        >
                                            <div
                                                className="h-5 w-5 rounded-full"
                                                style={{ backgroundColor: subject.color }}
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-semibold">{subject.name}</p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {subjectTopics.length} topics
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                            {selectedCount > 0 && (
                                                <span
                                                    className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
                                                    style={{ backgroundColor: subject.color }}
                                                >
                                                    {selectedCount}
                                                </span>
                                            )}
                                            <ChevronDown
                                                className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""
                                                    }`}
                                            />
                                        </div>
                                    </button>

                                    {/* Expanded topics */}
                                    {isExpanded && (
                                        <div className="bg-muted/30">
                                            <div className="border-b border-border/50 px-4 py-2">
                                                <button
                                                    onClick={() => selectAllFromSubject(subject.id)}
                                                    className={`rounded-lg px-3 py-1.5 text-sm ${allSelected
                                                            ? "bg-muted font-medium"
                                                            : "border border-border"
                                                        }`}
                                                >
                                                    {allSelected ? "Deselect All" : "Select All"}
                                                </button>
                                            </div>
                                            <div className="space-y-1 p-2">
                                                {subjectTopics.map((topic) => {
                                                    const isSelected = selectedTopics.has(topic.id);
                                                    const mastery = topic.mastery_percentage;

                                                    return (
                                                        <button
                                                            key={topic.id}
                                                            type="button"
                                                            onClick={() => toggleTopic(topic.id)}
                                                            className={`flex w-full items-center gap-3 rounded-lg p-3 text-left ${isSelected
                                                                    ? "bg-primary/10 ring-1 ring-primary/30"
                                                                    : "bg-background"
                                                                }`}
                                                        >
                                                            <span
                                                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${isSelected
                                                                        ? "border-primary bg-primary"
                                                                        : "border-border bg-background"
                                                                    }`}
                                                            >
                                                                {isSelected && (
                                                                    <Check className="h-3.5 w-3.5 text-primary-foreground" />
                                                                )}
                                                            </span>
                                                            <p
                                                                className={`flex-1 truncate text-sm font-medium ${isSelected ? "text-primary" : ""
                                                                    }`}
                                                            >
                                                                {topic.subtopic || topic.topic}
                                                            </p>
                                                            {mastery > 0 && (
                                                                <span
                                                                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${getMasteryColor(mastery)}`}
                                                                >
                                                                    {mastery}%
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Question count slider */}
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-primary" />
                            <span className="text-sm font-semibold">Questions</span>
                        </div>
                        <span className="rounded-full bg-muted px-3 py-1 text-sm font-bold">
                            {questionCount}
                        </span>
                    </div>
                    <input
                        type="range"
                        min={5}
                        max={30}
                        step={5}
                        value={questionCount}
                        onChange={(e) => setQuestionCount(Number(e.target.value))}
                        className="w-full accent-primary"
                    />
                    <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                        <span>Quick (5)</span>
                        <span>Standard (15)</span>
                        <span>Deep (30)</span>
                    </div>
                </div>
            </main>

            {/* Sticky footer */}
            <footer className="sticky bottom-0 z-20 flex flex-col gap-2 border-t border-border bg-background px-4 py-4 sm:flex-row">
                <Link
                    href="/dashboard"
                    className="flex flex-1 items-center justify-center rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-muted"
                >
                    Cancel
                </Link>
                <button
                    onClick={startQuiz}
                    disabled={selectedTopics.size < 2}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                    <Shuffle className="h-4 w-4" />
                    {isPrimaryMode ? "Start Mixed Quiz!" : "Start Quiz"}
                    {selectedTopics.size >= 2 && (
                        <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                            {selectedTopics.size}
                        </span>
                    )}
                </button>
            </footer>
        </div>
    );
}
