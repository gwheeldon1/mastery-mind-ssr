/**
 * Generic list-page loading skeleton — used by leaderboard, stats, profile.
 */
export default function LeaderboardLoading() {
    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-4xl px-4 py-8">
                <div className="mb-6 h-10 w-48 animate-pulse rounded-lg bg-muted" />
                <div className="mb-8 h-4 w-64 animate-pulse rounded bg-muted" />
                <div className="space-y-3">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 rounded-xl border bg-card p-4">
                            <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                            <div className="flex-1">
                                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                                <div className="mt-1 h-3 w-20 animate-pulse rounded bg-muted" />
                            </div>
                            <div className="h-6 w-16 animate-pulse rounded bg-muted" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
