/**
 * Streaming AI Tutor API route.
 * Proxies the socratic-tutor edge function server-side and streams
 * the response back to the client word-by-word.
 */

import { streamEdgeFunction } from "@/lib/stream-edge-function";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    const body = await request.json();

    return streamEdgeFunction("socratic-tutor", {
        mode: body.mode || "general",
        subject: body.subject,
        studentMessage: body.studentMessage,
        conversationHistory: body.conversationHistory,
        yearGroup: body.yearGroup,
    });
}
