"use client";

import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { UserProfileProvider } from "@/contexts/user-profile-context";
import { SubscriptionProvider } from "@/contexts/subscription-context";
import { ErrorTelemetryProvider } from "@/components/error-telemetry-provider";
import { useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 15 * 60 * 1000,
                        gcTime: 30 * 60 * 1000,
                        refetchOnWindowFocus: false,
                        retry: 1,
                        retryDelay: 1000,
                    },
                },
            })
    );

    return (
        <ErrorTelemetryProvider>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                <QueryClientProvider client={queryClient}>
                    <AuthProvider>
                        <UserProfileProvider>
                            <SubscriptionProvider>
                                {children}
                            </SubscriptionProvider>
                        </UserProfileProvider>
                        <Toaster richColors position="top-center" />
                    </AuthProvider>
                </QueryClientProvider>
            </ThemeProvider>
        </ErrorTelemetryProvider>
    );
}


