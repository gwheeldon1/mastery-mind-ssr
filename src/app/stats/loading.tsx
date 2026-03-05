/**
 * Stats page loading skeleton.
 */
export default function StatsLoading() {
    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-5xl px-4 py-8">
                <div className="mb-6 h-10 w-40 animate-pulse rounded-lg bg-muted" />
                {/* Summary cards */}
                <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
                    ))}
                </div>
                {/* Chart area */}
                <div className="mb-8 h-64 animate-pulse rounded-xl bg-muted" />
                {/* Subject breakdown */}
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
                    ))}
                </div>
            </div>
        </div>
    );
}
