import { Brain } from "lucide-react";

/**
 * Global loading UI — shown during route transitions while the new page loads.
 * Prevents users seeing a blank screen between navigations.
 */
export default function Loading() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <Brain className="h-12 w-12 animate-pulse text-primary" />
                <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
        </div>
    );
}
