/**
 * Streaming Socratic Tutor API route.
 * Proxies the socratic-tutor edge function (question-specific mode)
 * server-side and streams the response.
 */

import { streamEdgeFunction } from "@/lib/stream-edge-function";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    const body = await request.json();

    return streamEdgeFunction("socratic-tutor", {
        questionText: body.questionText,
        correctAnswer: body.correctAnswer,
        explanation: body.explanation,
        conceptTag: body.conceptTag,
        subject: body.subject,
        topic: body.topic,
        studentMessage: body.studentMessage,
        conversationHistory: body.conversationHistory,
        hintCount: body.hintCount,
        yearGroup: body.yearGroup,
    });
}
