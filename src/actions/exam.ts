"use server";

/**
 * Exam server actions — move AI calls server-side.
 * Keeps service role key off the client, enables retry logic.
 */

import { createClient } from "@/lib/supabase/server";

interface ExamQuestion {
    id: string;
    question_number: string;
    question_text: string;
    total_marks: number;
    mark_scheme?: string;
}

interface GradedResult {
    questionId: string;
    marksAwarded: number;
    totalMarks: number;
    feedback: string;
}

/**
 * Generate exam questions via the edge function, server-side.
 */
export async function generateExamQuestions(params: {
    subjectName: string;
    examBoard: string;
    paperNumber: string;
    paperYear: string;
    yearGroup: string;
    questionCount?: number;
}): Promise<{ questions: ExamQuestion[]; error?: string }> {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.functions.invoke(
            "generate-exam-questions",
            {
                body: {
                    subjectName: params.subjectName,
                    examBoard: params.examBoard,
                    paperNumber: params.paperNumber,
                    paperYear: params.paperYear,
                    yearGroup: params.yearGroup,
                    questionCount: params.questionCount || 5,
                },
            }
        );

        if (error) return { questions: [], error: error.message };
        if (data?.error) return { questions: [], error: data.error };

        const questions: ExamQuestion[] = (data.questions || []).map(
            (q: any, i: number) => ({
                id: q.id || `exam-${i}`,
                question_number: q.question_number || `${i + 1}`,
                question_text: q.question_text,
                total_marks: q.total_marks || q.marks || 4,
                mark_scheme: q.mark_scheme,
            })
        );

        return { questions };
    } catch (err: any) {
        return { questions: [], error: err.message || "Failed to generate questions" };
    }
}

/**
 * Grade exam answers via the edge function, server-side.
 * Includes automatic retry (once) on transient failures.
 */
export async function gradeExamAnswers(params: {
    answers: {
        questionId: string;
        questionText: string;
        response: string;
        totalMarks: number;
        markScheme?: string;
    }[];
    subjectName: string;
    examBoard: string;
    yearGroup: string;
}): Promise<{ results: GradedResult[]; error?: string }> {
    const supabase = await createClient();

    async function attempt(): Promise<{ results: GradedResult[]; error?: string }> {
        const { data, error } = await supabase.functions.invoke(
            "grade-exam-answers",
            {
                body: {
                    answers: params.answers,
                    subjectName: params.subjectName,
                    examBoard: params.examBoard,
                    yearGroup: params.yearGroup,
                },
            }
        );

        if (error) return { results: [], error: error.message };

        const results: GradedResult[] = (data.results || []).map(
            (r: any, i: number) => ({
                questionId: params.answers[i]?.questionId || `q-${i}`,
                marksAwarded: r.marks_awarded || 0,
                totalMarks: params.answers[i]?.totalMarks || 4,
                feedback: r.feedback || "",
            })
        );

        return { results };
    }

    // First attempt
    const first = await attempt();
    if (!first.error) return first;

    // Retry once on failure
    await new Promise((r) => setTimeout(r, 1000));
    return attempt();
}

/**
 * Save an exam submission to the database, server-side.
 */
export async function saveExamSubmission(params: {
    userId: string;
    subjectName: string;
    examBoard: string;
    paperYear: string;
    totalMarksAvailable: number;
    totalMarksAwarded: number;
    timeSpentSeconds: number;
    questionsData: any;
    gradedResults: any;
}): Promise<{ error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase.from("exam_submissions").insert({
        user_id: params.userId,
        subject_name: params.subjectName,
        exam_board: params.examBoard,
        paper_year: parseInt(params.paperYear) || null,
        total_marks_available: params.totalMarksAvailable,
        total_marks_awarded: params.totalMarksAwarded,
        time_spent_seconds: params.timeSpentSeconds,
        questions_data: params.questionsData,
        graded_results: params.gradedResults,
    });

    return { error: error?.message };
}
