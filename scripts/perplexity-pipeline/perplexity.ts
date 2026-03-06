/**
 * Perplexity API client with rate limiting and retry logic.
 */

import 'dotenv/config';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const MODEL = 'sonar-pro';
const MAX_RETRIES = 3;
const RATE_LIMIT_DELAY_MS = 3200; // ~18 req/min, safe margin under 20/min

let lastCallTime = 0;

async function rateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - lastCallTime;
    if (elapsed < RATE_LIMIT_DELAY_MS) {
        await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY_MS - elapsed));
    }
    lastCallTime = Date.now();
}

export async function queryPerplexity(prompt: string, retries = MAX_RETRIES): Promise<string> {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) throw new Error('PERPLEXITY_API_KEY not set');

    await rateLimit();

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const res = await fetch(PERPLEXITY_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: MODEL,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.1,
                    max_tokens: 4096,
                }),
            });

            if (res.status === 429) {
                const wait = Math.min(60000, 5000 * Math.pow(2, attempt));
                console.warn(`  Rate limited, waiting ${wait / 1000}s...`);
                await new Promise(r => setTimeout(r, wait));
                continue;
            }

            if (!res.ok) {
                const body = await res.text();
                throw new Error(`Perplexity API ${res.status}: ${body}`);
            }

            const data = await res.json() as {
                choices: Array<{ message: { content: string } }>;
            };
            return data.choices[0].message.content;
        } catch (err) {
            if (attempt === retries) throw err;
            const wait = 2000 * attempt;
            console.warn(`  Attempt ${attempt} failed, retrying in ${wait / 1000}s...`);
            await new Promise(r => setTimeout(r, wait));
        }
    }

    throw new Error('Exhausted retries');
}

/**
 * Extract a balanced JSON object or array from a string.
 * Finds the first `[` or `{`, then counts nesting to find the matching close.
 */
function extractJSON(text: string): string | null {
    // Find first [ or {
    const startIdx = text.search(/[\[{]/);
    if (startIdx === -1) return null;

    const openChar = text[startIdx];
    const closeChar = openChar === '[' ? ']' : '}';
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = startIdx; i < text.length; i++) {
        const ch = text[i];

        if (escaped) { escaped = false; continue; }
        if (ch === '\\') { escaped = true; continue; }

        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;

        if (ch === openChar || ch === '{' || ch === '[') depth++;
        if (ch === closeChar || ch === '}' || ch === ']') {
            depth--;
            if (depth === 0) {
                return text.slice(startIdx, i + 1);
            }
        }
    }
    return null;
}

/**
 * Query Perplexity and parse the response as JSON.
 * Handles markdown code fences and trailing text after JSON.
 */
export async function queryPerplexityJSON<T>(prompt: string): Promise<T> {
    const raw = await queryPerplexity(prompt);

    // Strip markdown code fences (various formats)
    let cleaned = raw.trim();
    // Remove opening fence: ```json, ```JSON, ``` etc.
    cleaned = cleaned.replace(/^```\w*\s*\n?/, '');
    // Remove closing fence
    cleaned = cleaned.replace(/\n?```\s*$/, '');

    // Try direct parse first
    try {
        return JSON.parse(cleaned) as T;
    } catch {
        // Extract balanced JSON from the response
        const json = extractJSON(cleaned);
        if (json) {
            try {
                return JSON.parse(json) as T;
            } catch {
                // fall through
            }
        }
        throw new Error(`Failed to parse JSON from Perplexity response:\n${raw.slice(0, 500)}`);
    }
}
