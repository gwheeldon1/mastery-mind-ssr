"use client";

/**
 * Dashboard Context - Shared state between Dashboard and SubjectProgressList.
 * Prevents duplicate API calls for the same data.
 */

import {
    createContext,
    useContext,
    type ReactNode,
    useMemo,
    useCallback,
} from "react";
import {
    useDashboardData,
    type DashboardData,
    type CoverageData,
} from "@/hooks/useDashboardData";
import { useAuth } from "@/contexts/auth-context";

interface DashboardContextType {
    data: DashboardData | null;
    loading: boolean;
    error: string | null;
    coverageMap: Record<string, CoverageData>;
    overallMastery: number;
    topicsCount: number;
    refreshData: (force?: boolean) => Promise<DashboardData | null>;
    invalidateCache: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
    undefined
);

export function DashboardProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { data, loading, error, fetchData, invalidateCache } =
        useDashboardData(user?.id);

    const value = useMemo<DashboardContextType>(
        () => ({
            data,
            loading,
            error,
            coverageMap: data?.coverageMap ?? {},
            overallMastery: data?.overallMastery ?? 0,
            topicsCount: data?.topicsCount ?? 0,
            refreshData: fetchData,
            invalidateCache,
        }),
        [data, loading, error, fetchData, invalidateCache]
    );

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboardContext() {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error(
            "useDashboardContext must be used within a DashboardProvider"
        );
    }
    return context;
}

/**
 * Hook for components that need dashboard data but may not be within the provider.
 * Falls back to fetching directly if no provider is present.
 */
export function useDashboardDataSafe() {
    const { user } = useAuth();
    const directHook = useDashboardData(user?.id);
    const context = useContext(DashboardContext);

    if (context !== undefined) return context;

    return {
        data: directHook.data,
        loading: directHook.loading,
        error: directHook.error,
        coverageMap: directHook.data?.coverageMap ?? {},
        overallMastery: directHook.data?.overallMastery ?? 0,
        topicsCount: directHook.data?.topicsCount ?? 0,
        refreshData: directHook.fetchData,
        invalidateCache: directHook.invalidateCache,
    };
}
