"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [status, setStatus] = useState<"verifying" | "success" | "error">(
        "verifying"
    );
    const [errorMessage, setErrorMessage] = useState("");
    const [verificationType, setVerificationType] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setErrorMessage("No verification token provided.");
            return;
        }

        const supabase = createClient();

        (async () => {
            try {
                const { data, error } = await supabase.functions.invoke(
                    "verify-email-token",
                    { body: { token } }
                );

                if (error) throw new Error(error.message);

                if (data.success) {
                    setStatus("success");
                    setVerificationType(data.verificationType);
                    setTimeout(() => {
                        router.push(
                            data.verificationType === "school_signup"
                                ? "/school-signup"
                                : "/dashboard"
                        );
                    }, 3000);
                } else {
                    setStatus("error");
                    setErrorMessage(data.error || "Verification failed");
                }
            } catch (err) {
                setStatus("error");
                setErrorMessage(
                    err instanceof Error ? err.message : "An unexpected error occurred"
                );
            }
        })();
    }, [token, router]);

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Navbar />

            <main className="flex flex-1 items-center justify-center p-4">
                <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-lg">
                    <div className="text-center">
                        {status === "verifying" && (
                            <>
                                <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
                                <h1 className="text-xl font-bold">Verifying your email...</h1>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Please wait while we verify your email address.
                                </p>
                            </>
                        )}

                        {status === "success" && (
                            <>
                                <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-500" />
                                <h1 className="text-xl font-bold">Email Verified! 🎉</h1>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Your email has been verified successfully.
                                </p>
                                <p className="mt-4 text-sm text-muted-foreground">
                                    Redirecting you automatically in 3 seconds...
                                </p>
                                <button
                                    onClick={() =>
                                        router.push(
                                            verificationType === "school_signup"
                                                ? "/school-signup"
                                                : "/dashboard"
                                        )
                                    }
                                    className="mt-4 w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                                >
                                    Continue Now
                                </button>
                            </>
                        )}

                        {status === "error" && (
                            <>
                                <XCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
                                <h1 className="text-xl font-bold">Verification Failed</h1>
                                <p className="mt-2 text-sm text-destructive">{errorMessage}</p>
                                <div className="mt-6 space-y-3">
                                    <Link
                                        href="/"
                                        className="block w-full rounded-lg border border-border py-2.5 text-center text-sm font-medium transition-colors hover:bg-muted"
                                    >
                                        <Mail className="mr-2 inline h-4 w-4" />
                                        Go to Homepage
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }
        >
            <VerifyEmailContent />
        </Suspense>
    );
}
