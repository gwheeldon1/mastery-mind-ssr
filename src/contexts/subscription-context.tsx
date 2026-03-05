"use client";

/**
 * SubscriptionContext — Centralized subscription state.
 * Checks Stripe subscription via edge function, internal trial from profile,
 * and premium overrides (school licenses, admin flags).
 */

import {
    createContext,
    useContext,
    type ReactNode,
    useState,
    useEffect,
    useCallback,
    useMemo,
    useRef,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";

export type SubscriptionTier = "free" | "pro" | "premium";

export interface SubscriptionStatus {
    subscribed: boolean;
    tier: SubscriptionTier;
    productId: string | null;
    subscriptionEnd: string | null;
    trialEnd: string | null;
    isTrialing: boolean;
    internalTrialActive: boolean;
    internalTrialEnd: string | null;
    internalTrialExpired: boolean;
}

export const FEATURE_ACCESS: Record<string, SubscriptionTier[]> = {
    quiz: ["free", "pro", "premium"],
    "exam-questions": ["pro", "premium"],
    blurt: ["pro", "premium"],
    podcasts: ["pro", "premium"],
    "suggested-guides": ["pro", "premium"],
    "past-paper-import": ["premium"],
    "nea-coach": ["premium"],
    "ai-tutor": ["premium"],
};

const TRIAL_DAYS = 7;

function calculateTrialStatus(trialStartedAt: string | null) {
    if (!trialStartedAt) {
        return {
            internalTrialActive: false,
            internalTrialEnd: null,
            internalTrialExpired: false,
        };
    }
    const trialStart = new Date(trialStartedAt);
    const trialEnd = new Date(
        trialStart.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000
    );
    const now = new Date();
    return {
        internalTrialActive: now < trialEnd,
        internalTrialEnd: trialEnd.toISOString(),
        internalTrialExpired: now >= trialEnd,
    };
}

interface SubscriptionContextType extends SubscriptionStatus {
    premiumOverride: boolean;
    loading: boolean;
    error: string | null;
    hasAccess: (feature: keyof typeof FEATURE_ACCESS) => boolean;
    getRequiredTier: (
        feature: keyof typeof FEATURE_ACCESS
    ) => SubscriptionTier | null;
    checkSubscription: () => Promise<void>;
    createCheckout: (tier: "pro" | "premium") => Promise<string | null>;
    openCustomerPortal: () => Promise<string | null>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
    undefined
);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
    const { user, session } = useAuth();
    const supabase = createClient();

    const [stripeStatus, setStripeStatus] = useState({
        subscribed: false,
        tier: "free" as SubscriptionTier,
        productId: null as string | null,
        subscriptionEnd: null as string | null,
        trialEnd: null as string | null,
        isTrialing: false,
    });

    const [internalTrial, setInternalTrial] = useState({
        internalTrialActive: false,
        internalTrialEnd: null as string | null,
        internalTrialExpired: false,
    });

    const [premiumOverride, setPremiumOverride] = useState(false);
    const [schoolLicenseTier, setSchoolLicenseTier] =
        useState<SubscriptionTier | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const checkingRef = useRef(false);
    const lastUserIdRef = useRef<string | undefined>(undefined);

    const fetchProfileStatus = useCallback(async () => {
        if (!user) {
            setInternalTrial({
                internalTrialActive: false,
                internalTrialEnd: null,
                internalTrialExpired: false,
            });
            setPremiumOverride(false);
            setSchoolLicenseTier(null);
            return;
        }

        try {
            const { data } = await supabase
                .from("profiles")
                .select("trial_started_at, premium_override, school_license_tier")
                .eq("id", user.id)
                .maybeSingle();

            if (data) {
                setInternalTrial(calculateTrialStatus(data.trial_started_at));
                setPremiumOverride(data.premium_override ?? false);
                setSchoolLicenseTier(
                    (data.school_license_tier as SubscriptionTier | null) ?? null
                );
            }
        } catch (err) {
            console.error("Error fetching profile status:", err);
        }
    }, [user, supabase]);

    const checkSubscription = useCallback(async () => {
        if (checkingRef.current) return;
        if (!user || !session) {
            setStripeStatus({
                subscribed: false,
                tier: "free",
                productId: null,
                subscriptionEnd: null,
                trialEnd: null,
                isTrialing: false,
            });
            setLoading(false);
            return;
        }

        try {
            checkingRef.current = true;
            setLoading(true);
            setError(null);

            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData.session) {
                setStripeStatus({
                    subscribed: false,
                    tier: "free",
                    productId: null,
                    subscriptionEnd: null,
                    trialEnd: null,
                    isTrialing: false,
                });
                return;
            }

            const [stripeResult] = await Promise.all([
                supabase.functions.invoke("check-subscription"),
                fetchProfileStatus(),
            ]);

            const { data, error: fnError } = stripeResult;
            if (fnError) {
                setError(fnError.message);
                return;
            }
            if (data?.error) {
                setError(data.error);
                return;
            }

            setStripeStatus({
                subscribed: data?.subscribed ?? false,
                tier: data?.tier ?? "free",
                productId: data?.product_id ?? null,
                subscriptionEnd: data?.subscription_end ?? null,
                trialEnd: data?.trial_end ?? null,
                isTrialing: data?.is_trialing ?? false,
            });
        } catch (err) {
            console.error("Failed to check subscription:", err);
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            checkingRef.current = false;
            setLoading(false);
        }
    }, [user, session, fetchProfileStatus, supabase]);

    // Reset on user change
    useEffect(() => {
        if (user?.id !== lastUserIdRef.current) {
            lastUserIdRef.current = user?.id;
            if (!user) {
                setStripeStatus({
                    subscribed: false,
                    tier: "free",
                    productId: null,
                    subscriptionEnd: null,
                    trialEnd: null,
                    isTrialing: false,
                });
                setInternalTrial({
                    internalTrialActive: false,
                    internalTrialEnd: null,
                    internalTrialExpired: false,
                });
                setPremiumOverride(false);
                setSchoolLicenseTier(null);
                setLoading(false);
            }
        }
    }, [user?.id]);

    // Check on mount
    useEffect(() => {
        if (user?.id && session?.access_token) checkSubscription();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, session?.access_token]);

    // Poll every 5 minutes
    useEffect(() => {
        if (!user) return;
        const interval = setInterval(() => {
            if (!checkingRef.current) checkSubscription();
        }, 300_000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    const effectiveTier = useMemo((): SubscriptionTier => {
        if (schoolLicenseTier) return schoolLicenseTier;
        if (premiumOverride) return "premium";
        if (stripeStatus.subscribed) return stripeStatus.tier;
        if (internalTrial.internalTrialActive) return "premium";
        return "free";
    }, [
        schoolLicenseTier,
        premiumOverride,
        stripeStatus.subscribed,
        stripeStatus.tier,
        internalTrial.internalTrialActive,
    ]);

    const hasAccess = useCallback(
        (feature: keyof typeof FEATURE_ACCESS): boolean => {
            const allowedTiers = FEATURE_ACCESS[feature];
            if (!allowedTiers) return false;
            return allowedTiers.includes(effectiveTier);
        },
        [effectiveTier]
    );

    const getRequiredTier = useCallback(
        (feature: keyof typeof FEATURE_ACCESS): SubscriptionTier | null => {
            const allowedTiers = FEATURE_ACCESS[feature];
            if (!allowedTiers?.length) return null;
            if (allowedTiers.includes("free")) return "free";
            if (allowedTiers.includes("pro")) return "pro";
            return "premium";
        },
        []
    );

    const createCheckout = useCallback(
        async (tier: "pro" | "premium"): Promise<string | null> => {
            try {
                const { data, error: fnError } = await supabase.functions.invoke(
                    "create-checkout",
                    { body: { tier } }
                );
                if (fnError) throw fnError;
                if (data.error) throw new Error(data.error);
                return data.url;
            } catch (err) {
                console.error("Checkout creation failed:", err);
                setError(
                    err instanceof Error ? err.message : "Failed to create checkout"
                );
                return null;
            }
        },
        [supabase]
    );

    const openCustomerPortal = useCallback(async (): Promise<string | null> => {
        try {
            const { data, error: fnError } =
                await supabase.functions.invoke("customer-portal");
            if (fnError) throw fnError;
            if (data.error) throw new Error(data.error);
            return data.url;
        } catch (err) {
            console.error("Customer portal failed:", err);
            setError(err instanceof Error ? err.message : "Failed to open portal");
            return null;
        }
    }, [supabase]);

    const value = useMemo<SubscriptionContextType>(
        () => ({
            subscribed: stripeStatus.subscribed,
            tier: effectiveTier,
            productId: stripeStatus.productId,
            subscriptionEnd: stripeStatus.subscriptionEnd,
            trialEnd: stripeStatus.trialEnd,
            isTrialing: stripeStatus.isTrialing,
            internalTrialActive: internalTrial.internalTrialActive,
            internalTrialEnd: internalTrial.internalTrialEnd,
            internalTrialExpired: internalTrial.internalTrialExpired,
            premiumOverride,
            loading,
            error,
            hasAccess,
            getRequiredTier,
            checkSubscription,
            createCheckout,
            openCustomerPortal,
        }),
        [
            stripeStatus,
            effectiveTier,
            internalTrial,
            premiumOverride,
            loading,
            error,
            hasAccess,
            getRequiredTier,
            checkSubscription,
            createCheckout,
            openCustomerPortal,
        ]
    );

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscription() {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error(
            "useSubscription must be used within a SubscriptionProvider"
        );
    }
    return context;
}

export function useFeatureAccess(feature: keyof typeof FEATURE_ACCESS) {
    const { hasAccess, getRequiredTier, loading, tier, createCheckout } =
        useSubscription();
    return {
        hasAccess: hasAccess(feature),
        requiredTier: getRequiredTier(feature),
        currentTier: tier,
        loading,
        createCheckout,
    };
}
