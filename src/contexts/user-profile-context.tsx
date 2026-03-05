"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useRef,
    useCallback,
    type ReactNode,
} from "react";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Profile } from "@/types/profile";

interface UserProfileContextType {
    profile: Profile | null;
    loading: boolean;
    isPrimaryMode: boolean;
    refreshProfile: () => Promise<void>;
    updateProfile: (
        updates: Partial<Profile>
    ) => Promise<{ error: Error | null }>;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(
    undefined
);

export function UserProfileProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const prevUserIdRef = useRef<string | null>(null);

    const fetchProfileWithRetry = useCallback(
        async (userId: string, retryCount = 0): Promise<Profile | null> => {
            const supabase = createClient();
            try {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", userId)
                    .maybeSingle();
                if (error) throw error;
                return data;
            } catch (err) {
                console.error("Error fetching profile:", err);
                if (retryCount < 3) {
                    await new Promise((r) => setTimeout(r, 1000 * (retryCount + 1)));
                    return fetchProfileWithRetry(userId, retryCount + 1);
                }
                return null;
            }
        },
        []
    );

    const ensureProfileRow = useCallback(
        async (userId: string, email: string) => {
            const supabase = createClient();
            try {
                const { data: existing } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("id", userId)
                    .maybeSingle();

                if (!existing) {
                    const { error: insertError } = await supabase
                        .from("profiles")
                        .insert([{ id: userId, email }]);
                    if (insertError) throw insertError;
                }
            } catch (e) {
                console.error("Failed to ensure profile row:", e);
            }
        },
        []
    );

    const refreshProfile = useCallback(async () => {
        if (!user) {
            setProfile(null);
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            if (user.email) {
                await ensureProfileRow(user.id, user.email);
            }

            const data = await fetchProfileWithRetry(user.id);
            if (data) setProfile(data);
        } catch (error) {
            console.error("Error refreshing profile:", error);
            toast.error("Failed to load user profile");
        } finally {
            setLoading(false);
        }
    }, [user, ensureProfileRow, fetchProfileWithRetry]);

    // Synchronously set loading=true when user changes to prevent race conditions
    useEffect(() => {
        const currentUserId = user?.id ?? null;
        if (currentUserId !== prevUserIdRef.current) {
            prevUserIdRef.current = currentUserId;
            if (currentUserId) {
                setLoading(true);
                setProfile(null);
            }
        }
        refreshProfile();
    }, [refreshProfile, user?.id]);

    const updateProfile = async (
        updates: Partial<Profile>
    ): Promise<{ error: Error | null }> => {
        if (!user) return { error: new Error("No user logged in") };
        const supabase = createClient();
        try {
            const { error } = await supabase
                .from("profiles")
                .update(updates)
                .eq("id", user.id);
            if (error) throw error;
            await refreshProfile();
            toast.success("Profile updated");
            return { error: null };
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Failed to update profile");
            return { error: error as Error };
        }
    };

    const isPrimaryMode = profile?.year_group
        ? ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6"].includes(
            profile.year_group
        )
        : false;

    return (
        <UserProfileContext.Provider
            value={{ profile, loading, isPrimaryMode, refreshProfile, updateProfile }}
        >
            {children}
        </UserProfileContext.Provider>
    );
}

export function useUserProfile() {
    const context = useContext(UserProfileContext);
    if (context === undefined) {
        throw new Error(
            "useUserProfile must be used within a UserProfileProvider"
        );
    }
    return context;
}
