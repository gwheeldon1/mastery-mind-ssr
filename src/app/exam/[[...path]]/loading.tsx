/**
 * Exam loading skeleton.
 */
export default function ExamLoading() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
            <div className="w-full max-w-3xl space-y-6">
                {/* Header bar */}
                <div className="flex items-center justify-between">
                    <div className="h-6 w-40 animate-pulse rounded bg-muted" />
                    <div className="h-8 w-24 animate-pulse rounded-lg bg-muted" />
                </div>
                {/* Question panel */}
                <div className="rounded-2xl border bg-card p-8 shadow-sm">
                    <div className="mb-4 h-5 w-24 animate-pulse rounded bg-muted" />
                    <div className="mb-6 space-y-2">
                        <div className="h-4 w-full animate-pulse rounded bg-muted" />
                        <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
                        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                    </div>
                    {/* Answer area */}
                    <div className="h-32 animate-pulse rounded-xl bg-muted" />
                </div>
            </div>
        </div>
    );
}
