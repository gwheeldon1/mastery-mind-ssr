/**
 * Dashboard loading skeleton — shows while Supabase data fetches.
 */
export default function DashboardLoading() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header skeleton */}
            <div className="border-b bg-card px-6 py-4">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
                    <div className="flex gap-3">
                        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                    </div>
                </div>
            </div>
            <div className="mx-auto max-w-7xl p-6">
                {/* Welcome row */}
                <div className="mb-6">
                    <div className="h-8 w-64 animate-pulse rounded-lg bg-muted" />
                    <div className="mt-2 h-4 w-96 animate-pulse rounded bg-muted" />
                </div>
                {/* Stats cards */}
                <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
                    ))}
                </div>
                {/* Subject cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
                    ))}
                </div>
            </div>
        </div>
    );
}
