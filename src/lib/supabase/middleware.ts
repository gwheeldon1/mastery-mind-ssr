import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_PREFIXES = [
    "/dashboard",
    "/quiz",
    "/blurt",
    "/stats",
    "/leaderboard",
    "/exam",
    "/profile",
    "/nea-coach",
    "/subscription",
    "/onboarding",
    "/quick-start",
    "/interleaved-builder",
    "/wrong-answers",
    "/podcast",
    "/admin",
    "/school-admin",
    "/teacher",
];

// Routes that should redirect authenticated users away (e.g. login page)
const AUTH_ROUTES = ["/auth"];

function isProtectedRoute(pathname: string) {
    return PROTECTED_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
}

function isAuthRoute(pathname: string) {
    return AUTH_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
    );
}

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh the session — required for Server Components
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Redirect unauthenticated users from protected routes
    if (!user && isProtectedRoute(request.nextUrl.pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = "/auth";
        url.searchParams.set("next", request.nextUrl.pathname);
        return NextResponse.redirect(url);
    }

    // Redirect authenticated users away from auth pages (no login form for logged-in users)
    if (
        user &&
        isAuthRoute(request.nextUrl.pathname) &&
        !request.nextUrl.pathname.startsWith("/auth/callback")
    ) {
        const next = request.nextUrl.searchParams.get("next") || "/dashboard";
        const url = request.nextUrl.clone();
        url.pathname = next;
        url.searchParams.delete("next");
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}
