"use client";

/**
 * Global error boundary — catches any unhandled runtime errors in the app.
 * Shows a recovery UI instead of a blank screen.
 */

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Unhandled error:", error);
    }, [error]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-md space-y-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-xl font-bold">Something went wrong</h1>
                    <p className="text-sm text-muted-foreground">
                        An unexpected error occurred. This has been logged and we&apos;ll look
                        into it.
                    </p>
                    {error.digest && (
                        <p className="font-mono text-xs text-muted-foreground/60">
                            Error ID: {error.digest}
                        </p>
                    )}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <button
                        onClick={reset}
                        className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Try Again
                    </button>
                    <a
                        href="/dashboard"
                        className="flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-2.5 text-sm font-medium hover:bg-muted"
                    >
                        <Home className="h-4 w-4" />
                        Dashboard
                    </a>
                </div>
            </div>
        </div>
    );
}
