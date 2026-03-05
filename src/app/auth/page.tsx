import { Suspense } from "react";
import { AuthForm } from "./auth-form";
import { Brain } from "lucide-react";

export default function AuthPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <Suspense
                fallback={
                    <div className="w-full max-w-sm space-y-8 text-center">
                        <div className="inline-flex items-center gap-2">
                            <Brain className="h-8 w-8 text-primary" />
                            <span className="font-display text-2xl font-bold">
                                MasteryMind
                            </span>
                        </div>
                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto" />
                    </div>
                }
            >
                <AuthForm />
            </Suspense>
        </div>
    );
}
