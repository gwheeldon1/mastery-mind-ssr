/**
 * Type definitions for the Stats page.
 */

export interface WeakArea {
    curriculum_content_id: string;
    subject_id: string;
    subject_name: string;
    topic: string;
    subtopic: string | null;
    quiz_mastery: number;
    blurt_coverage: number;
    exam_score: number;
    combined_score: number;
    times_practiced: number;
    last_practiced_at: string | null;
    gaps: string[];
    error_types: string[];
}

export interface Subject {
    id: string;
    name: string;
    color: string | null;
}

export interface TopicStats {
    id: string;
    title: string;
    mastery_score: number;
    subject_id: string | null;
    total_attempts: number;
    correct_count: number;
    wrong_count: number;
    accuracy: number;
    quiz_mastery: number;
    blurt_coverage: number;
    combined_coverage: number;
}

export interface SubjectStats {
    subject: Subject;
    topics: TopicStats[];
    averageMastery: number;
    combinedCoverage: number;
    totalCorrect: number;
    totalWrong: number;
}

export interface OverallStats {
    totalQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
    overallAccuracy: number;
    averageMastery: number;
    topicsStudied: number;
    streakDays: number;
    examSessions: number;
    examTotalMarks: number;
    examTotalScore: number;
}

export interface BlurtSession {
    id: string;
    topic_title: string;
    coverage_percentage: number;
    created_at: string;
    gaps_identified: string[];
}

export interface ExamSessionStats {
    id: string;
    total_score: number;
    total_marks: number;
    created_at: string;
    is_graded: boolean;
}
