/**
 * Simple request deduplication utility.
 * If a request with the same key is already in-flight, returns the existing promise.
 */

const inflight = new Map<string, { promise: Promise<unknown>; expiresAt: number }>();

export async function deduplicateRequest<T>(
    fn: () => Promise<T>,
    key: string,
    ttlMs = 5000
): Promise<T> {
    const existing = inflight.get(key);
    if (existing && Date.now() < existing.expiresAt) {
        return existing.promise as Promise<T>;
    }

    const promise = fn().finally(() => {
        // Clean up after TTL
        setTimeout(() => inflight.delete(key), ttlMs);
    });

    inflight.set(key, { promise, expiresAt: Date.now() + ttlMs });
    return promise;
}

export function clearRequestCache(keys?: string[]): void {
    if (keys) {
        keys.forEach((k) => inflight.delete(k));
    } else {
        inflight.clear();
    }
}
