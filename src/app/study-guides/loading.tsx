/**
 * Study guides index loading skeleton.
 */
export default function StudyGuidesLoading() {
    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-7xl px-4 py-8">
                <div className="mb-6 h-10 w-48 animate-pulse rounded-lg bg-muted" />
                <div className="mb-4 h-4 w-80 animate-pulse rounded bg-muted" />
                {/* Search + filters */}
                <div className="mb-8 flex flex-wrap gap-3">
                    <div className="h-10 w-64 animate-pulse rounded-lg bg-muted" />
                    <div className="h-10 w-32 animate-pulse rounded-lg bg-muted" />
                    <div className="h-10 w-32 animate-pulse rounded-lg bg-muted" />
                </div>
                {/* Guide cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />
                    ))}
                </div>
            </div>
        </div>
    );
}
