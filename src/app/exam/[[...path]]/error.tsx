"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { useEffect } from "react";

export default function ExamError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[Exam Error]", error);
    }, [error]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-md space-y-5 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
                    <AlertTriangle className="h-7 w-7 text-red-500" />
                </div>
                <h1 className="text-xl font-bold">Exam session error</h1>
                <p className="text-sm text-muted-foreground">
                    Something went wrong with the exam. Your answers may not have been
                    saved.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <button
                        onClick={reset}
                        className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
                    >
                        <RotateCcw className="h-4 w-4" /> Try Again
                    </button>
                    <Link
                        href="/dashboard"
                        className="flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-2.5 text-sm font-medium hover:bg-muted"
                    >
                        <Home className="h-4 w-4" /> Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
