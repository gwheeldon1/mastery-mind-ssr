/**
 * Profile page loading skeleton.
 */
export default function ProfileLoading() {
    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-3xl px-4 py-8">
                {/* Avatar + name */}
                <div className="mb-8 flex items-center gap-4">
                    <div className="h-20 w-20 animate-pulse rounded-full bg-muted" />
                    <div>
                        <div className="h-7 w-48 animate-pulse rounded-lg bg-muted" />
                        <div className="mt-2 h-4 w-32 animate-pulse rounded bg-muted" />
                    </div>
                </div>
                {/* Settings sections */}
                <div className="space-y-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="rounded-xl border bg-card p-6">
                            <div className="mb-4 h-5 w-32 animate-pulse rounded bg-muted" />
                            <div className="space-y-3">
                                <div className="h-10 animate-pulse rounded-lg bg-muted" />
                                <div className="h-10 animate-pulse rounded-lg bg-muted" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
