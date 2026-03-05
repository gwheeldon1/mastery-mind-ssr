"use server";

/**
 * Quiz server action — fetches exam board for a user's subject.
 * Moves this DB query server-side to avoid client Supabase dependency.
 */

import { createClient } from "@/lib/supabase/server";

/**
 * Get the exam board a user is studying for a given subject.
 */
export async function getUserExamBoard(
    userId: string,
    subjectId: string
): Promise<string | undefined> {
    const supabase = await createClient();

    const { data } = await supabase
        .from("user_subjects")
        .select("exam_board")
        .eq("user_id", userId)
        .eq("subject_id", subjectId)
        .maybeSingle();

    return data?.exam_board || undefined;
}

/**
 * Log a quiz answer to the database, server-side.
 */
export async function logQuizAnswer(params: {
    userId: string;
    questionText: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    conceptTag: string | null;
    curriculumContentId: string | null;
    subjectId: string | null;
    difficultyTier?: number;
}): Promise<void> {
    const supabase = await createClient();

    await supabase.from("quiz_answers").insert({
        user_id: params.userId,
        question_text: params.questionText,
        selected_answer: params.selectedAnswer,
        correct_answer: params.correctAnswer,
        is_correct: params.isCorrect,
        concept_tag: params.conceptTag,
        curriculum_content_id: params.curriculumContentId,
        subject_id: params.subjectId,
        difficulty_tier: params.difficultyTier,
    });
}
