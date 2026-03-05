"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { useEffect } from "react";

/**
 * Quiz-specific error boundary.
 * If question generation or answer grading fails, this catches it
 * and lets the user retry or escape to the dashboard.
 */
export default function QuizError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[Quiz Error]", error);
    }, [error]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-md space-y-5 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
                    <AlertTriangle className="h-7 w-7 text-red-500" />
                </div>
                <h1 className="text-xl font-bold">Quiz failed to load</h1>
                <p className="text-sm text-muted-foreground">
                    There was a problem generating your questions. This is usually
                    temporary — please try again.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <button
                        onClick={reset}
                        className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Retry
                    </button>
                    <Link
                        href="/dashboard"
                        className="flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-2.5 text-sm font-medium hover:bg-muted"
                    >
                        <Home className="h-4 w-4" />
                        Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
