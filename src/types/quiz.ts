/**
 * Domain types for Quiz functionality
 */

// ============= Core Quiz Types =============

export interface DistractorExplanation {
    answer: string;
    whyWrong: string;
}

export interface MermaidDiagram {
    diagram_type: string;
    mermaid_code: string;
    description?: string;
}

export interface AIQuestion {
    id: string;
    question_text: string;
    correct_answer: string;
    distractors: string[];
    distractor_explanations?: DistractorExplanation[];
    explanation?: string;
    difficulty_tier: DifficultyTier;
    concept_tag?: string;
    teaching_approach?: string;
    question_bank_id?: string;
    fromBank?: boolean;
    mermaid_diagram?: MermaidDiagram;
}

export interface AIQuestionWithMetadata extends AIQuestion {
    subjectName?: string;
    subjectColor?: string;
    subject_id?: string;
    curriculumId?: string;
    curriculum_content_id?: string;
    examBoard?: string;
}

export type DifficultyTier = 1 | 2 | 3 | 4 | 5;
export type ConfidenceRating = 1 | 2 | 3 | 4 | 5;

// ============= Problem Area Tracking =============

export interface ProblemArea {
    concept: string;
    attempts: number;
    lastApproach: string;
    avgResponseTimeMs?: number;
}

// ============= Performance Tracking =============

export interface RecentPerformance {
    correctCount: number;
    wrongCount: number;
    struggledConcepts: string[];
}

// ============= User Context for AI Generation =============

export interface UserContext {
    yearGroup: string;
    learningStyle: string;
    topicTitle: string;
    customNotes?: string;
    customPrompt?: string;
    sourceUrl?: string;
    subjectId?: string;
    curriculumContentId?: string;
    userId?: string;
    examBoard?: string;
    specificationVersionId?: string;
    masteryScore: number;
    recentPerformance?: RecentPerformance;
    currentDifficulty: DifficultyTier;
    previousQuestions?: string[];
    servedQuestionIds?: string[];
    problemAreas?: ProblemArea[];
    recommendedApproach?: string;
    identifiedGaps?: string[];
    isBlurtGapQuiz?: boolean;
}

// ============= Type Guards =============

export function clampDifficulty(value: number): DifficultyTier {
    return Math.max(1, Math.min(5, Math.round(value))) as DifficultyTier;
}
