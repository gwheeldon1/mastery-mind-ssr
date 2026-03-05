/**
 * Streaming Blurt Analysis API route.
 * Proxies the blurt-analyse edge function server-side and streams
 * the AI feedback response.
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    const body = await request.json();
    const supabase = await createClient();

    const { data, error } = await supabase.functions.invoke("blurt-analyse", {
        body: {
            topicName: body.topicName,
            studentResponse: body.studentResponse,
            learningObjectives: body.learningObjectives,
            subject: body.subject,
            yearGroup: body.yearGroup,
        },
    });

    if (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }

    // Blurt returns structured analysis (JSON), not plain text.
    // Return as JSON but with the AI feedback streamed.
    return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
    });
}
