"use client";

/**
 * Global error boundary that catches unhandled errors and promise rejections,
 * then logs them to the Supabase error_telemetry table.
 *
 * Mount this once in the Providers component.
 */

import { useEffect } from "react";
import { logError, logFatal } from "@/lib/telemetry";

export function ErrorTelemetryProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    useEffect(() => {
        function handleError(event: ErrorEvent) {
            logFatal(event.error instanceof Error ? event.error : event.message, {
                source: "window.onerror",
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
            });
        }

        function handleRejection(event: PromiseRejectionEvent) {
            const reason = event.reason;
            logError(
                reason instanceof Error ? reason : String(reason),
                { source: "unhandledrejection" }
            );
        }

        window.addEventListener("error", handleError);
        window.addEventListener("unhandledrejection", handleRejection);

        return () => {
            window.removeEventListener("error", handleError);
            window.removeEventListener("unhandledrejection", handleRejection);
        };
    }, []);

    return <>{children}</>;
}
