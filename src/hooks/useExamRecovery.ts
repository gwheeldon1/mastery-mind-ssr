"use client";

/**
 * useExamRecovery — Auto-saves exam answers to sessionStorage.
 * Recovers typed answers on page reload. Clears on submit.
 */

import { useCallback, useEffect, useRef } from "react";

const STORAGE_KEY = "exam_draft";

interface ExamDraft {
    responses: Record<string, string>;
    currentIdx: number;
    elapsed: number;
    timestamp: number;
}

/**
 * Persist exam state to sessionStorage every time it changes.
 * Returns recovered draft (if any) and save/clear functions.
 */
export function useExamRecovery() {
    const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const save = useCallback(
        (responses: Record<string, string>, currentIdx: number, elapsed: number) => {
            // Debounce saves to avoid thrashing
            if (saveTimeout.current) clearTimeout(saveTimeout.current);
            saveTimeout.current = setTimeout(() => {
                try {
                    const draft: ExamDraft = {
                        responses,
                        currentIdx,
                        elapsed,
                        timestamp: Date.now(),
                    };
                    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
                } catch {
                    // sessionStorage full or unavailable — ignore
                }
            }, 500);
        },
        []
    );

    const recover = useCallback((): ExamDraft | null => {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const draft: ExamDraft = JSON.parse(raw);
            // Only recover if draft is less than 2 hours old
            if (Date.now() - draft.timestamp > 2 * 60 * 60 * 1000) {
                sessionStorage.removeItem(STORAGE_KEY);
                return null;
            }
            return draft;
        } catch {
            return null;
        }
    }, []);

    const clear = useCallback(() => {
        try {
            sessionStorage.removeItem(STORAGE_KEY);
        } catch {
            // ignore
        }
    }, []);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeout.current) clearTimeout(saveTimeout.current);
        };
    }, []);

    return { save, recover, clear };
}
