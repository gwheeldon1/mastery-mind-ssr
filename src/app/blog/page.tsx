"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Search, ArrowRight, Loader2 } from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

interface BlogPostPreview {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    banner_image_url: string | null;
    exam_board: string | null;
    qualification_level: string | null;
    published_at: string | null;
}

export default function BlogIndexPage() {
    const supabase = createClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [levelFilter, setLevelFilter] = useState("all");
    const [boardFilter, setBoardFilter] = useState("all");

    const { data: posts, isLoading } = useQuery({
        queryKey: ["blog-posts-index"],
        queryFn: async (): Promise<BlogPostPreview[]> => {
            const { data, error } = await supabase
                .from("blog_posts")
                .select(
                    "id, slug, title, excerpt, banner_image_url, exam_board, qualification_level, published_at"
                )
                .eq("status", "published")
                .order("published_at", { ascending: false })
                .limit(100);

            if (error) throw error;
            return data || [];
        },
    });

    const filteredPosts =
        posts?.filter((post) => {
            const matchesSearch =
                searchQuery === "" ||
                post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesLevel =
                levelFilter === "all" || post.qualification_level === levelFilter;
            const matchesBoard =
                boardFilter === "all" || post.exam_board === boardFilter;
            return matchesSearch && matchesLevel && matchesBoard;
        }) || [];

    const levels = [
        ...new Set(
            posts?.map((p) => p.qualification_level).filter(Boolean) || []
        ),
    ];
    const boards = [
        ...new Set(posts?.map((p) => p.exam_board).filter(Boolean) || []),
    ];

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Navbar />

            {/* Hero */}
            <div className="bg-gradient-to-b from-primary/5 to-background py-12 md:py-16">
                <div className="mx-auto max-w-6xl px-4 text-center">
                    <h1 className="mb-4 text-4xl font-bold md:text-5xl">
                        Study Guides & Revision Notes
                    </h1>
                    <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
                        Free, comprehensive study guides for GCSE, iGCSE and A-Level
                        subjects. Written by experts, designed for success.
                    </p>
                    <div className="relative mx-auto max-w-xl">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search articles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="mx-auto max-w-6xl px-4 py-6">
                <div className="flex flex-wrap gap-4">
                    <select
                        value={levelFilter}
                        onChange={(e) => setLevelFilter(e.target.value)}
                        className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
                    >
                        <option value="all">All Levels</option>
                        {levels.map((level) => (
                            <option key={level} value={level!}>
                                {level}
                            </option>
                        ))}
                    </select>
                    <select
                        value={boardFilter}
                        onChange={(e) => setBoardFilter(e.target.value)}
                        className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
                    >
                        <option value="all">All Boards</option>
                        {boards.map((board) => (
                            <option key={board} value={board!}>
                                {board}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Posts */}
            <main className="mx-auto max-w-6xl flex-1 px-4 py-8">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <div className="py-12 text-center">
                        <p className="text-muted-foreground">
                            No articles found matching your criteria.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredPosts.map((post) => (
                            <div
                                key={post.id}
                                className="group overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg"
                            >
                                {post.banner_image_url && (
                                    <div className="aspect-video overflow-hidden">
                                        <Image
                                            src={post.banner_image_url}
                                            alt={`Illustration for ${post.title}`}
                                            width={640}
                                            height={360}
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    </div>
                                )}
                                <div className="p-5">
                                    <div className="mb-2 flex gap-2">
                                        {post.qualification_level && (
                                            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                                                {post.qualification_level}
                                            </span>
                                        )}
                                        {post.exam_board && (
                                            <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium">
                                                {post.exam_board}
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="mb-2 line-clamp-2 text-lg font-semibold transition-colors group-hover:text-primary">
                                        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                                    </h2>
                                    {post.excerpt && (
                                        <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                                            {post.excerpt}
                                        </p>
                                    )}
                                    <Link
                                        href={`/blog/${post.slug}`}
                                        className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:underline"
                                    >
                                        Read More
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
