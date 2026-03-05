import Link from "next/link";
import { Search, Home } from "lucide-react";

/**
 * Custom 404 page — shows when a route doesn't exist.
 * Much better UX than Next.js's default "404 | This page could not be found."
 */
export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-md space-y-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold">404</h1>
                    <p className="text-lg font-medium">Page not found</p>
                    <p className="text-sm text-muted-foreground">
                        The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <Link
                        href="/dashboard"
                        className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        <Home className="h-4 w-4" />
                        Dashboard
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-2.5 text-sm font-medium hover:bg-muted"
                    >
                        Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
