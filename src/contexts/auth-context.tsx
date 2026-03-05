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
import type { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signUp: (
        email: string,
        password: string,
        displayName?: string
    ) => Promise<{ error: Error | null }>;
    signIn: (
        email: string,
        password: string
    ) => Promise<{ error: Error | null }>;
    signInWithGoogle: () => Promise<{ error: Error | null }>;
    signInWithApple: () => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const VISIBILITY_REFRESH_THROTTLE = 30_000;

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const mountedRef = useRef(true);
    const isIntentionalSignOut = useRef(false);
    const lastVisibilityRefresh = useRef(0);
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;

    const refreshOnVisibility = useCallback(async () => {
        if (document.visibilityState !== "visible") return;
        const now = Date.now();
        if (now - lastVisibilityRefresh.current < VISIBILITY_REFRESH_THROTTLE)
            return;
        lastVisibilityRefresh.current = now;
        try {
            await supabase.auth.refreshSession();
        } catch {
            // Visibility refresh is best-effort
        }
    }, [supabase]);

    useEffect(() => {
        mountedRef.current = true;
        isIntentionalSignOut.current = false;

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
            if (!mountedRef.current) return;

            if (event === "SIGNED_OUT" && !isIntentionalSignOut.current) {
                try {
                    const { data } = await supabase.auth.refreshSession();
                    if (data.session && mountedRef.current) {
                        setSession(data.session);
                        setUser(data.session.user);
                        return;
                    }
                } catch {
                    // Recovery failed, fall through
                }
            }

            setSession(nextSession);
            setUser(nextSession?.user ?? null);
            setLoading(false);
        });

        const initializeAuth = async () => {
            try {
                const {
                    data: { session: initialSession },
                } = await supabase.auth.getSession();
                if (!mountedRef.current) return;
                setSession(initialSession);
                setUser(initialSession?.user ?? null);
            } catch (e) {
                console.error("Auth initialization failed:", e);
            } finally {
                if (mountedRef.current) setLoading(false);
            }
        };

        initializeAuth();
        document.addEventListener("visibilitychange", refreshOnVisibility);

        return () => {
            mountedRef.current = false;
            subscription.unsubscribe();
            document.removeEventListener("visibilitychange", refreshOnVisibility);
        };
    }, [supabase, refreshOnVisibility]);

    const getRedirectUrl = (path: string) => {
        if (typeof window === "undefined") return path;
        return `${window.location.origin}${path}`;
    };

    const signUp = async (
        email: string,
        password: string,
        displayName?: string
    ) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: getRedirectUrl("/auth/callback"),
                data: { display_name: displayName || email.split("@")[0] },
            },
        });
        return { error: error as Error | null };
    };

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error: error as Error | null };
    };

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: getRedirectUrl("/auth/callback") },
        });
        return { error: error as Error | null };
    };

    const signInWithApple = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "apple",
            options: { redirectTo: getRedirectUrl("/auth/callback") },
        });
        return { error: error as Error | null };
    };

    const signOut = async () => {
        isIntentionalSignOut.current = true;
        await supabase.auth.signOut();
    };

    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: getRedirectUrl("/reset-password"),
        });
        return { error: error as Error | null };
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                loading,
                signUp,
                signIn,
                signInWithGoogle,
                signInWithApple,
                signOut,
                resetPassword,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
