// Server-side proxy for the generate-quiz edge function.
// Keeps Supabase function URL off the client.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const supabase = await createClient();

        const { data, error } = await supabase.functions.invoke("generate-quiz", {
            body,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 502 });
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error("Quiz generation error:", err);
        return NextResponse.json(
            { error: "Failed to generate questions" },
            { status: 500 }
        );
    }
}
