"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AIQuestion, UserContext } from "@/types/quiz";

const DEFAULT_QUESTION_COUNT = 5;

interface UseAdaptiveQuizReturn {
    generateQuestions: (
        context: UserContext,
        count?: number
    ) => Promise<AIQuestion[]>;
    isGenerating: boolean;
    error: string | null;
}

export function useAdaptiveQuiz(): UseAdaptiveQuizReturn {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    const generateQuestions = useCallback(
        async (
            userContext: UserContext,
            questionCount: number = DEFAULT_QUESTION_COUNT
        ): Promise<AIQuestion[]> => {
            setIsGenerating(true);
            setError(null);

            try {
                // Sanitize input
                const sanitizedContext: UserContext = {
                    ...userContext,
                    topicTitle: (userContext.topicTitle || "").slice(0, 200),
                    customNotes: userContext.customNotes?.slice(0, 5000),
                    customPrompt: userContext.customPrompt?.slice(0, 500),
                };

                const { data, error: fnError } = await supabase.functions.invoke(
                    "generate-quiz",
                    {
                        body: { userContext: sanitizedContext, questionCount },
                    }
                );

                if (fnError) throw new Error(fnError.message);
                if (data?.error) throw new Error(data.error);

                const questionsWithIds: AIQuestion[] = data.questions.map(
                    (q: any, idx: number) => ({
                        ...q,
                        id: q.id || `ai-${Date.now()}-${idx}`,
                        distractor_explanations: q.distractor_explanations?.map(
                            (de: any) => ({
                                answer: de.answer,
                                whyWrong: de.why_wrong || de.whyWrong,
                            })
                        ),
                        mermaid_diagram: q.diagram || q.mermaid_diagram || undefined,
                    })
                );

                return questionsWithIds;
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : "Failed to generate questions";
                setError(message);
                throw err;
            } finally {
                setIsGenerating(false);
            }
        },
        [supabase]
    );

    return { generateQuestions, isGenerating, error };
}
