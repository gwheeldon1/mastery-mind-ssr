/**
 * Supabase-based error telemetry.
 * Captures client-side errors and sends them to the error_telemetry table.
 *
 * Usage:
 *   import { logError, logWarning } from "@/lib/telemetry";
 *   logError("Something broke", { component: "QuizPage" });
 */

import { createClient } from "@/lib/supabase/client";

type Severity = "info" | "warning" | "error" | "fatal";

interface TelemetryPayload {
    severity: Severity;
    message: string;
    stack?: string;
    context?: Record<string, unknown>;
    url?: string;
    user_agent?: string;
}

let sessionId: string | null = null;

function getSessionId(): string {
    if (!sessionId) {
        sessionId =
            typeof crypto !== "undefined"
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
    return sessionId;
}

async function send(payload: TelemetryPayload) {
    try {
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        await supabase.from("error_telemetry").insert({
            user_id: user?.id ?? null,
            severity: payload.severity,
            message: payload.message,
            stack: payload.stack ?? null,
            context: payload.context ?? {},
            url: payload.url ?? (typeof window !== "undefined" ? window.location.href : null),
            user_agent:
                payload.user_agent ??
                (typeof navigator !== "undefined" ? navigator.userAgent : null),
            session_id: getSessionId(),
        });
    } catch {
        // Telemetry failures must never break the app
        if (process.env.NODE_ENV === "development") {
            console.warn("[telemetry] Failed to send error:", payload.message);
        }
    }
}

/** Log an error (default severity) */
export function logError(
    messageOrError: string | Error,
    context?: Record<string, unknown>
) {
    const message =
        messageOrError instanceof Error
            ? messageOrError.message
            : messageOrError;
    const stack =
        messageOrError instanceof Error ? messageOrError.stack : undefined;
    send({ severity: "error", message, stack, context });
}

/** Log a warning */
export function logWarning(
    message: string,
    context?: Record<string, unknown>
) {
    send({ severity: "warning", message, context });
}

/** Log a fatal crash */
export function logFatal(
    messageOrError: string | Error,
    context?: Record<string, unknown>
) {
    const message =
        messageOrError instanceof Error
            ? messageOrError.message
            : messageOrError;
    const stack =
        messageOrError instanceof Error ? messageOrError.stack : undefined;
    send({ severity: "fatal", message, stack, context });
}

/** Log an info event (e.g. slow load) */
export function logInfo(
    message: string,
    context?: Record<string, unknown>
) {
    send({ severity: "info", message, context });
}
