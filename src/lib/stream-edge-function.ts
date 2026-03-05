/**
 * Shared utility for streaming from Supabase edge functions via Next.js API routes.
 * Proxies the request server-side (keeps service role key off the client)
 * and streams the response back using ReadableStream.
 */

import { createClient } from "@/lib/supabase/server";

/**
 * Calls a Supabase edge function and returns a streaming Response.
 * The edge function must return `{ response: string }` — we stream
 * the response field word-by-word with ~30ms delay for natural reading.
 */
export async function streamEdgeFunction(
    functionName: string,
    body: Record<string, unknown>
): Promise<Response> {
    const supabase = await createClient();

    const { data, error } = await supabase.functions.invoke(functionName, {
        body,
    });

    if (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }

    const text = data?.response || "";

    // Stream the response word-by-word
    const encoder = new TextEncoder();
    const words = text.split(/(\s+)/); // preserve whitespace
    const stream = new ReadableStream({
        async start(controller) {
            for (const word of words) {
                controller.enqueue(encoder.encode(word));
                // ~30ms delay per word for natural reading feel
                await new Promise((r) => setTimeout(r, 30));
            }
            controller.close();
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Transfer-Encoding": "chunked",
            "Cache-Control": "no-cache",
        },
    });
}
