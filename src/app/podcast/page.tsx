"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useSubscription } from "@/contexts/subscription-context";
import { createClient } from "@/lib/supabase/client";
import {
    Headphones,
    Play,
    Pause,
    Search,
    Clock,
    Loader2,
    ArrowLeft,
    SkipForward,
    SkipBack,
} from "lucide-react";

interface PodcastGuide {
    id: string;
    slug: string;
    topic_name: string;
    exam_board: string;
    qualification_level: string;
    summary: string | null;
    podcast_url: string | null;
    estimated_read_time_mins: number | null;
    subject_name: string | null;
    subject_color: string | null;
}

function formatTime(seconds: number): string {
    if (!seconds || !isFinite(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PodcastPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { hasAccess, loading: subLoading } = useSubscription();
    const supabase = createClient();

    const [guides, setGuides] = useState<PodcastGuide[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Player state
    const [currentTrack, setCurrentTrack] = useState<PodcastGuide | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (!authLoading && !user) router.replace("/auth");
    }, [authLoading, user, router]);

    // Fetch podcast guides
    useEffect(() => {
        async function fetchGuides() {
            setLoading(true);
            try {
                const { data } = await supabase
                    .from("study_guides")
                    .select(
                        `id, slug, topic_name, exam_board, qualification_level,
             summary, podcast_url, estimated_read_time_mins,
             subject_id, subjects:subject_id (name, color)`
                    )
                    .in("status", ["published", "review"])
                    .not("podcast_url", "is", null)
                    .order("topic_name");

                setGuides(
                    (data || []).map((d: any) => ({
                        id: d.id,
                        slug: d.slug,
                        topic_name: d.topic_name,
                        exam_board: d.exam_board,
                        qualification_level: d.qualification_level,
                        summary: d.summary,
                        podcast_url: d.podcast_url,
                        estimated_read_time_mins: d.estimated_read_time_mins,
                        subject_name: d.subjects?.name || null,
                        subject_color: d.subjects?.color || null,
                    }))
                );
            } catch (err) {
                console.error("Error fetching podcasts:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchGuides();
    }, [supabase]);

    const filteredGuides = useMemo(() => {
        if (!searchQuery.trim()) return guides;
        const q = searchQuery.toLowerCase();
        return guides.filter(
            (g) =>
                g.topic_name.toLowerCase().includes(q) ||
                g.exam_board.toLowerCase().includes(q) ||
                g.subject_name?.toLowerCase().includes(q) ||
                g.summary?.toLowerCase().includes(q)
        );
    }, [guides, searchQuery]);

    // Audio playback
    const playTrack = useCallback(
        (guide: PodcastGuide) => {
            if (!guide.podcast_url) return;

            if (currentTrack?.id === guide.id) {
                // Toggle play/pause
                if (isPlaying) {
                    audioRef.current?.pause();
                    setIsPlaying(false);
                } else {
                    audioRef.current?.play();
                    setIsPlaying(true);
                }
                return;
            }

            // New track
            if (audioRef.current) {
                audioRef.current.pause();
            }

            const audio = new Audio(guide.podcast_url);
            audioRef.current = audio;
            setCurrentTrack(guide);
            setCurrentTime(0);
            setDuration(0);

            audio.addEventListener("loadedmetadata", () =>
                setDuration(audio.duration)
            );
            audio.addEventListener("timeupdate", () =>
                setCurrentTime(audio.currentTime)
            );
            audio.addEventListener("ended", () => {
                setIsPlaying(false);
                // Auto-play next
                const idx = filteredGuides.findIndex((g) => g.id === guide.id);
                if (idx >= 0 && idx < filteredGuides.length - 1) {
                    playTrack(filteredGuides[idx + 1]);
                }
            });

            audio.play();
            setIsPlaying(true);
        },
        [currentTrack, isPlaying, filteredGuides]
    );

    // Cleanup
    useEffect(() => {
        return () => {
            audioRef.current?.pause();
        };
    }, []);

    // Subscription gate
    if (!subLoading && !hasAccess("podcasts")) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <div className="w-full max-w-md">
                    <Link
                        href="/dashboard"
                        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Link>
                    <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-purple-500/10 p-6 text-center">
                        <Headphones className="mx-auto mb-3 h-12 w-12 text-purple-400" />
                        <h2 className="mb-2 text-lg font-semibold">
                            Podcasts require Pro
                        </h2>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Upgrade to Pro or Premium to listen to AI-generated revision
                            podcasts.
                        </p>
                        <Link
                            href="/subscription"
                            className="inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
                        >
                            View Plans
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="min-h-screen bg-background pb-32">
            {/* Header */}
            <div className="border-b bg-gradient-to-b from-purple-500/10 to-background">
                <div className="container px-4 py-8">
                    <Link
                        href="/dashboard"
                        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" /> Dashboard
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-purple-500/10 p-3">
                            <Headphones className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Podcast Library</h1>
                            <p className="text-sm text-muted-foreground">
                                {guides.length} episodes · Revision on the go
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container space-y-4 px-4 py-6">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        placeholder="Search episodes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>

                {/* Episode list */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filteredGuides.length === 0 ? (
                    <div className="py-12 text-center">
                        <Headphones className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">
                            {searchQuery
                                ? "No matching episodes"
                                : "No podcast episodes available yet"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                            {filteredGuides.length} episode
                            {filteredGuides.length !== 1 ? "s" : ""}
                        </p>
                        {filteredGuides.map((g) => {
                            const isCurrent = currentTrack?.id === g.id;

                            return (
                                <button
                                    key={g.id}
                                    type="button"
                                    onClick={() => playTrack(g)}
                                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all hover:shadow-sm ${isCurrent
                                            ? "border-purple-500/30 bg-purple-500/5"
                                            : "border-border bg-card"
                                        }`}
                                >
                                    {/* Play button */}
                                    <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${isCurrent && isPlaying
                                                ? "bg-purple-500 text-white"
                                                : "bg-purple-500/10 text-purple-500"
                                            }`}
                                    >
                                        {isCurrent && isPlaying ? (
                                            <Pause className="h-4 w-4" />
                                        ) : (
                                            <Play className="ml-0.5 h-4 w-4" />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold">
                                            {g.topic_name}
                                        </p>
                                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                            {g.subject_name && (
                                                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                                                    {g.subject_name}
                                                </span>
                                            )}
                                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                                                {g.exam_board}
                                            </span>
                                            {g.estimated_read_time_mins && (
                                                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                                    <Clock className="h-2.5 w-2.5" />
                                                    {g.estimated_read_time_mins}m
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Sticky player */}
            {currentTrack && (
                <div className="fixed inset-x-0 bottom-0 z-30 border-t border-purple-500/20 bg-background/95 backdrop-blur">
                    <div className="container px-4 py-3">
                        {/* Progress */}
                        <div
                            className="mb-2 h-1.5 cursor-pointer rounded-full bg-muted"
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const pct = (e.clientX - rect.left) / rect.width;
                                if (audioRef.current) audioRef.current.currentTime = pct * duration;
                            }}
                        >
                            <div
                                className="h-full rounded-full bg-purple-500 transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold">
                                    {currentTrack.topic_name}
                                </p>
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        const idx = filteredGuides.findIndex(
                                            (g) => g.id === currentTrack.id
                                        );
                                        if (idx > 0) playTrack(filteredGuides[idx - 1]);
                                    }}
                                    className="rounded-full p-2 hover:bg-muted"
                                >
                                    <SkipBack className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => playTrack(currentTrack)}
                                    className={`rounded-full p-3 ${isPlaying
                                            ? "bg-purple-500 text-white"
                                            : "bg-purple-500/10 text-purple-500"
                                        }`}
                                >
                                    {isPlaying ? (
                                        <Pause className="h-5 w-5" />
                                    ) : (
                                        <Play className="ml-0.5 h-5 w-5" />
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        const idx = filteredGuides.findIndex(
                                            (g) => g.id === currentTrack.id
                                        );
                                        if (idx >= 0 && idx < filteredGuides.length - 1)
                                            playTrack(filteredGuides[idx + 1]);
                                    }}
                                    className="rounded-full p-2 hover:bg-muted"
                                >
                                    <SkipForward className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
