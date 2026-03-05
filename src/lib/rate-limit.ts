/**
 * Simple client-side rate limiter for expensive API calls (AI tutor, edge functions).
 * Uses a sliding window per endpoint key.
 */

const windowMs = 60_000; // 1 minute
const callTimestamps = new Map<string, number[]>();

/**
 * Returns true if the call should be allowed, false if rate limited.
 * @param key - Unique identifier for the rate limit bucket (e.g. "ai-tutor", "socratic")
 * @param maxPerMinute - Maximum calls allowed per minute (default: 10)
 */
export function checkRateLimit(key: string, maxPerMinute = 10): boolean {
    const now = Date.now();
    const timestamps = callTimestamps.get(key) || [];

    // Remove timestamps outside the window
    const recent = timestamps.filter((t) => now - t < windowMs);

    if (recent.length >= maxPerMinute) {
        callTimestamps.set(key, recent);
        return false;
    }

    recent.push(now);
    callTimestamps.set(key, recent);
    return true;
}

/**
 * Returns the number of seconds until the next call is allowed.
 */
export function getRateLimitRetryAfter(key: string, maxPerMinute = 10): number {
    const now = Date.now();
    const timestamps = callTimestamps.get(key) || [];
    const recent = timestamps.filter((t) => now - t < windowMs);

    if (recent.length < maxPerMinute) return 0;

    const oldestInWindow = Math.min(...recent);
    return Math.ceil((oldestInWindow + windowMs - now) / 1000);
}
