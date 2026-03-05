"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";

export default function SubjectDetailPage() {
    const params = useParams();
    const slug = params.slug as string;
    const supabase = createClient();

    const { data: subject, isLoading } = useQuery({
        queryKey: ["subject", slug],
        queryFn: async () => {
            const { data } = await supabase
                .from("subjects")
                .select("id, name, icon, color, description")
                .eq("slug", slug)
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

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <div className="border-b border-border p-4">
                <Link href="/subjects" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> All Subjects
                </Link>
            </div>
            <div className="flex flex-1 items-center justify-center p-4">
                <div className="max-w-md space-y-4 text-center">
                    <BookOpen className="mx-auto h-16 w-16 text-primary/30" />
                    <h1 className="text-2xl font-bold">{subject?.name ?? "Subject"}</h1>
                    <p className="text-muted-foreground">
                        {subject?.description ?? "Browse topics, start quizzes, and track your mastery for this subject."}
                    </p>
                    <Link href="/subjects" className="inline-block rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90">
                        Browse Subjects
                    </Link>
                </div>
            </div>
        </div>
    );
}
