"use client";

/**
 * Centralized hook for dashboard data fetching.
 * Uses get_user_dashboard_stats RPC for fast single-query loading
 * with fallback to parallel queries if RPC fails.
 */

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { deduplicateRequest, clearRequestCache } from "@/lib/request-batcher";

export interface CoverageData {
    quiz: number;
    blurt: number;
    exam: number;
}

export interface DashboardData {
    coverageMap: Record<string, CoverageData>;
    examAggregates: Record<string, { totalScore: number; maxMarks: number }>;
    overallMastery: number;
    topicsCount: number;
    weeklyXp?: number;
    currentStreak?: number;
    questionsCorrect?: number;
}

// Simple in-memory cache with TTL
interface CacheEntry {
    data: DashboardData;
    timestamp: number;
}

const CACHE_TTL_MS = 10_000;
const cache = new Map<string, CacheEntry>();

function getCached(userId: string): DashboardData | null {
    const entry = cache.get(userId);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        cache.delete(userId);
        return null;
    }
    return entry.data;
}

function setCache(userId: string, data: DashboardData): void {
    cache.set(userId, { data, timestamp: Date.now() });
}

export function clearDashboardCache(): void {
    cache.clear();
    clearRequestCache(["dashboard-stats"]);
}

export function useDashboardData(userId: string | undefined) {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fetchingRef = useRef(false);
    const lastFetchRef = useRef<number>(0);
    const initialFetchDoneRef = useRef(false);
    const lastUserIdRef = useRef<string | undefined>(undefined);
    const dataRef = useRef<DashboardData | null>(null);

    useEffect(() => {
        dataRef.current = data;
    }, [data]);

    // Reset when userId changes
    useEffect(() => {
        if (userId !== lastUserIdRef.current) {
            setData(null);
            setError(null);
            initialFetchDoneRef.current = false;
            fetchingRef.current = false;
            lastFetchRef.current = 0;
            if (lastUserIdRef.current) cache.delete(lastUserIdRef.current);
            lastUserIdRef.current = userId;
        }
    }, [userId]);

    const fetchData = useCallback(
        async (force = false): Promise<DashboardData | null> => {
            if (!userId) return null;
            if (fetchingRef.current) return dataRef.current;

            if (!force) {
                const cached = getCached(userId);
                if (cached) {
                    setData(cached);
                    dataRef.current = cached;
                    return cached;
                }
            }

            const now = Date.now();
            if (!force && now - lastFetchRef.current < 2000) return dataRef.current;
            lastFetchRef.current = now;

            fetchingRef.current = true;
            setLoading(true);
            setError(null);

            const supabase = createClient();

            try {
                const result = await deduplicateRequest(
                    async () => {
                        const { data: rpcData, error: rpcError } = await supabase.rpc(
                            "get_user_dashboard_stats",
                            { p_user_id: userId }
                        );
                        if (rpcError) throw rpcError;
                        return rpcData as Record<string, unknown> | null;
                    },
                    `dashboard-stats-${userId}`,
                    5000
                );

                const transformedData: DashboardData = {
                    coverageMap: {},
                    examAggregates: {},
                    overallMastery: (result as any)?.overallMastery || 0,
                    topicsCount: (result as any)?.topicsCount || 0,
                    weeklyXp: (result as any)?.weeklyXp || 0,
                    currentStreak: (result as any)?.currentStreak || 0,
                    questionsCorrect: (result as any)?.questionsCorrect || 0,
                };

                const coverageMapData = (result as any)?.coverageMap;
                if (coverageMapData && typeof coverageMapData === "object") {
                    Object.entries(coverageMapData).forEach(
                        ([id, coverage]: [string, any]) => {
                            transformedData.coverageMap[id] = {
                                quiz: coverage?.quiz || 0,
                                blurt: coverage?.blurt || 0,
                                exam: coverage?.exam || 0,
                            };
                        }
                    );
                }

                const examAggData = (result as any)?.examAggregates;
                if (examAggData && typeof examAggData === "object") {
                    Object.entries(examAggData).forEach(([id, agg]: [string, any]) => {
                        transformedData.examAggregates[id] = {
                            totalScore: agg?.totalScore || 0,
                            maxMarks: agg?.maxMarks || 0,
                        };
                    });
                }

                setData(transformedData);
                setCache(userId, transformedData);
                return transformedData;
            } catch (err) {
                console.error("Dashboard data fetch error:", err);
                setError(
                    err instanceof Error ? err.message : "Failed to load dashboard data"
                );
                return null;
            } finally {
                fetchingRef.current = false;
                setLoading(false);
            }
        },
        [userId]
    );

    const invalidateCache = useCallback(() => {
        if (userId) {
            cache.delete(userId);
            clearRequestCache([`dashboard-stats-${userId}`]);
        }
    }, [userId]);

    // Auto-fetch when userId becomes available
    useEffect(() => {
        if (userId && !initialFetchDoneRef.current) {
            initialFetchDoneRef.current = true;
            fetchData();
        }
    }, [userId, fetchData]);

    return useMemo(
        () => ({ data, loading, error, fetchData, invalidateCache }),
        [data, loading, error, fetchData, invalidateCache]
    );
}
