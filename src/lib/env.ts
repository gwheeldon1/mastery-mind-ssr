/**
 * Environment variable validation — fail fast at build/startup if required vars are missing.
 * Import this in the root layout or instrumentation file.
 */

const requiredVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

const missing = requiredVars.filter((key) => !process.env[key]);

if (missing.length > 0) {
    throw new Error(
        `❌ Missing required environment variables:\n${missing.map((v) => `  - ${v}`).join("\n")}\n\nAdd them to .env.local or your deployment environment.`
    );
}

export const env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
} as const;
