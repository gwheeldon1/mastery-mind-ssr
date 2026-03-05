"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Brain, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export function AuthForm() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const { signIn, signUp, signInWithGoogle, user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = searchParams.get("next") || "/dashboard";

    // Show error from auth callback failures (e.g. OAuth or email confirm failure)
    const callbackError = searchParams.get("error");
    useEffect(() => {
        if (callbackError) {
            setError(
                callbackError === "auth_callback_failed"
                    ? "Authentication failed. Please try again."
                    : "An error occurred. Please try again."
            );
        }
    }, [callbackError]);

    // Redirect if already authenticated
    if (user) {
        router.replace(next);
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await signUp(email, password, displayName);
                if (error) {
                    setError(error.message);
                } else {
                    setEmailSent(true);
                }
            } else {
                const { error } = await signIn(email, password);
                if (error) {
                    setError(error.message);
                } else {
                    router.replace(next);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError(null);
        const { error } = await signInWithGoogle();
        if (error) setError(error.message);
    };

    if (emailSent) {
        return (
            <div className="w-full max-w-sm space-y-6 text-center">
                <div className="inline-flex rounded-full bg-success/10 p-4">
                    <Mail className="h-8 w-8 text-success" />
                </div>
                <h1 className="text-2xl font-bold">Check Your Email</h1>
                <p className="text-muted-foreground">
                    We&apos;ve sent a confirmation link to{" "}
                    <span className="font-medium text-foreground">{email}</span>. Click
                    the link to activate your account.
                </p>
                <button
                    onClick={() => setEmailSent(false)}
                    className="text-sm text-primary hover:underline"
                >
                    Use a different email
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-sm space-y-8">
            {/* Header */}
            <div className="text-center">
                <Link href="/" className="inline-flex items-center gap-2">
                    <Brain className="h-8 w-8 text-primary" />
                    <span className="font-display text-2xl font-bold">MasteryMind</span>
                </Link>
                <p className="mt-2 text-muted-foreground">
                    {isSignUp
                        ? "Create your account to start revising"
                        : "Sign in to continue your revision"}
                </p>
            </div>

            {/* Google OAuth */}
            <button
                onClick={handleGoogleSignIn}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-card py-3 text-sm font-medium transition-colors hover:bg-muted"
            >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        fill="#4285F4"
                    />
                    <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                    />
                    <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                    />
                    <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                    />
                </svg>
                Continue with Google
            </button>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Or continue with email
                    </span>
                </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                    <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Display name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
                        />
                    </div>
                )}

                <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
                    />
                </div>

                <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-10 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                        {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                </div>

                {error && (
                    <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                    {loading
                        ? "Please wait..."
                        : isSignUp
                            ? "Create Account"
                            : "Sign In"}
                </button>
            </form>

            {/* Toggle Sign In / Sign Up */}
            <p className="text-center text-sm text-muted-foreground">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                    onClick={() => {
                        setIsSignUp(!isSignUp);
                        setError(null);
                    }}
                    className="font-medium text-primary hover:underline"
                >
                    {isSignUp ? "Sign in" : "Sign up"}
                </button>
            </p>
        </div>
    );
}
