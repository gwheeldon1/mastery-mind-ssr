/**
 * Quiz loading skeleton.
 */
export default function QuizLoading() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
            <div className="w-full max-w-2xl space-y-6">
                {/* Progress bar */}
                <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
                {/* Question card */}
                <div className="rounded-2xl border bg-card p-8 shadow-sm">
                    <div className="mb-6 h-6 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="mb-8 h-4 w-1/2 animate-pulse rounded bg-muted" />
                    {/* Answer options */}
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
