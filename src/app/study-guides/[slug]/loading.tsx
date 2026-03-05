/**
 * Study guide detail loading skeleton.
 */
export default function StudyGuideLoading() {
    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-5xl px-4 py-8">
                {/* Breadcrumb */}
                <div className="mb-6 flex gap-2">
                    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-4 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                </div>
                {/* Title area */}
                <div className="mb-8">
                    <div className="h-10 w-3/4 animate-pulse rounded-lg bg-muted" />
                    <div className="mt-3 flex gap-2">
                        <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
                        <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
                        <div className="h-6 w-28 animate-pulse rounded-full bg-muted" />
                    </div>
                    <div className="mt-4 h-16 w-full animate-pulse rounded-lg bg-muted" />
                </div>
                {/* Stats row */}
                <div className="mb-8 grid grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
                    ))}
                </div>
                {/* Content area + sidebar */}
                <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
                    <div className="space-y-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-4 animate-pulse rounded bg-muted" style={{ width: `${85 - i * 5}%` }} />
                        ))}
                    </div>
                    <div className="h-64 animate-pulse rounded-xl bg-muted" />
                </div>
            </div>
        </div>
    );
}
