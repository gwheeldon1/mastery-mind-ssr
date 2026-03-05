import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles the Supabase auth callback for OAuth sign-in and email confirmation links.
 * Supabase redirects here with a `code` query parameter which we exchange for a session.
 */
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/dashboard";

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // If code exchange fails, redirect to auth page with error
    return NextResponse.redirect(`${origin}/auth?error=auth_callback_failed`);
}
