// Health check endpoint for Cloud Run.
// Returns 200 with basic status info.
// Cloud Run pings this to know the container is alive.

import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json(
        {
            status: "healthy",
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || "unknown",
        },
        { status: 200 }
    );
}
