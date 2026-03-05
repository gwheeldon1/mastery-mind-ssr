"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Brain, Sparkles, Lock, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sessionChecked, setSessionChecked] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const checkSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session) {
                setError(
                    "Invalid or expired reset link. Please request a new password reset."
                );
            }
            setSessionChecked(true);
        };

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event) => {
            if (event === "PASSWORD_RECOVERY") {
                setError(null);
                setSessionChecked(true);
            }
        });

        checkSession();
        return () => subscription.unsubscribe();
    }, [supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) {
                toast.error(error.message);
            } else {
                setSuccess(true);
                toast.success("Password updated successfully!");
                setTimeout(() => router.replace("/dashboard"), 2000);
            }
        } catch {
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-6">
                {/* Logo */}
                <div className="space-y-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <div className="relative">
                            <Brain className="h-10 w-10 text-primary sm:h-12 sm:w-12" />
                            <Sparkles className="absolute -right-1 -top-1 h-4 w-4 text-warning sm:h-5 sm:w-5" />
                        </div>
                    </div>
                    <h1 className="font-display text-2xl font-bold sm:text-3xl">
                        MasteryMind
                    </h1>
                </div>

                <div className="rounded-xl border-0 bg-card p-6 shadow-lg">
                    <div className="mb-4 space-y-1">
                        <h2 className="font-display text-xl font-bold sm:text-2xl">
                            {success ? "Password Updated!" : "Set New Password"}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {success
                                ? "Your password has been changed. Redirecting you..."
                                : "Enter your new password below"}
                        </p>
                    </div>

                    {!sessionChecked ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : error ? (
                        <div className="space-y-4">
                            <div className="flex flex-col items-center gap-3 py-4 text-center">
                                <AlertCircle className="h-12 w-12 text-destructive" />
                                <p className="text-sm text-muted-foreground">{error}</p>
                            </div>
                            <button
                                onClick={() => router.push("/auth")}
                                className="h-12 w-full rounded-lg bg-primary text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                            >
                                Request New Reset Link
                            </button>
                        </div>
                    ) : success ? (
                        <div className="flex flex-col items-center gap-3 py-4">
                            <CheckCircle className="h-12 w-12 text-green-500" />
                            <p className="text-sm text-muted-foreground">
                                Redirecting to dashboard...
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="password"
                                    placeholder="New password (min 6 characters)"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    autoFocus
                                    className="h-12 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-base outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="password"
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="h-12 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-base outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || password.length < 6}
                                className="h-12 w-full rounded-lg bg-primary text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Updating...
                                    </span>
                                ) : (
                                    "Update Password"
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
