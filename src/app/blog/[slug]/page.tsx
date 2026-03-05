"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Loader2, Calendar, Tag } from "lucide-react";
import Image from "next/image";

export default function BlogPostPage() {
    const params = useParams();
    const slug = params.slug as string;
    const supabase = createClient();

    const { data: post, isLoading } = useQuery({
        queryKey: ["blog-post", slug],
        queryFn: async () => {
            const { data } = await supabase
                .from("blog_posts")
                .select("*")
                .eq("slug", slug)
                .eq("published", true)
                .single();
            return data;
        },
    });

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="flex min-h-screen flex-col bg-background">
                <div className="border-b border-border p-4">
                    <Link href="/blog" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" /> All Posts
                    </Link>
                </div>
                <div className="flex flex-1 items-center justify-center p-4">
                    <div className="max-w-md space-y-4 text-center">
                        <BookOpen className="mx-auto h-16 w-16 text-primary/30" />
                        <h1 className="text-2xl font-bold">Post Not Found</h1>
                        <p className="text-muted-foreground">
                            This blog post doesn&apos;t exist or hasn&apos;t been published yet.
                        </p>
                        <Link href="/blog" className="inline-block rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90">
                            Browse Posts
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <div className="border-b border-border p-4">
                <div className="mx-auto max-w-3xl">
                    <Link href="/blog" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" /> All Posts
                    </Link>
                </div>
            </div>

            <article className="mx-auto w-full max-w-3xl px-4 py-8">
                {post.banner_image && (
                    <div className="relative mb-8 aspect-video overflow-hidden rounded-xl">
                        <Image
                            src={post.banner_image}
                            alt={post.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                )}

                <header className="mb-8 space-y-4">
                    <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
                        {post.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        {post.created_at && (
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {new Date(post.created_at).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                })}
                            </span>
                        )}
                        {post.qualification_level && (
                            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2; py-0.5 text-xs font-medium text-primary">
                                <Tag className="h-3 w-3" />
                                {post.qualification_level}
                            </span>
                        )}
                        {post.exam_board && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                                {post.exam_board}
                            </span>
                        )}
                    </div>
                </header>

                <div
                    className="prose prose-lg dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: post.content || "" }}
                />
            </article>
        </div>
    );
}
