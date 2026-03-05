/**
 * Subject detail / specification loading skeleton.
 */
export default function SubjectLoading() {
    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-5xl px-4 py-8">
                <div className="mb-6 h-10 w-64 animate-pulse rounded-lg bg-muted" />
                <div className="mb-4 flex gap-2">
                    <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
                    <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
                </div>
                <div className="mb-8 h-4 w-3/4 animate-pulse rounded bg-muted" />
                {/* Topic list */}
                <div className="space-y-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
                    ))}
                </div>
            </div>
        </div>
    );
}
