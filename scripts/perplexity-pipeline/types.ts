/**
 * Types for the multi-step Perplexity spec pipeline.
 */

// ─── Subject Buckets ───────────────────────────────────────────────

export type SubjectBucket =
    | 'STEM'
    | 'TEXT_BASED'
    | 'THEMATIC'
    | 'MFL'
    | 'ENGLISH_LANGUAGE'
    | 'CREATIVE_ARTS'
    | 'OTHER';

// ─── Step 1: Skeleton ──────────────────────────────────────────────

export interface Subtopic {
    subtopic_number: string;
    subtopic_name: string;
}

export interface Topic {
    topic_number: string;
    topic_name: string;
    subtopics: Subtopic[];
}

export interface SkeletonResult {
    spec_id: string;
    board: string;
    level: string;
    subject: string;
    spec_code: string;
    topics: Topic[];
    extracted_at: string;
}

// ─── Step 2: Assessment ────────────────────────────────────────────

export interface Paper {
    paper_number: string;
    paper_title: string;
    duration_minutes: number;
    total_marks: number;
    weighting_percent: number;
    question_types: string[];
    topics_assessed: string[];
    tiers?: string[];
}

export interface AssessmentObjective {
    ao_code: string;
    description: string;
    weighting_percent: number;
}

export interface AssessmentResult {
    spec_id: string;
    papers: Paper[];
    assessment_objectives: AssessmentObjective[];
    marking_approach: 'point_based' | 'levels_based' | 'hybrid';
    has_coursework: boolean;
    has_practical_endorsement: boolean;
    extracted_at: string;
}

// ─── Step 3: Content (bucket-specific) ─────────────────────────────

export interface STEMContent {
    topic_synopsis: string;
    key_concepts: string[];
    learning_objectives: string[];
    tier_differentiation: { foundation: string; higher: string };
    synoptic_links: string[];
    misconceptions: string[];
    required_practicals: string[];
}

export interface TextBasedContent {
    topic_synopsis: string;
    key_themes: Array<{ theme: string; description: string; key_moments: string[] }>;
    character_analysis: Array<{ character: string; role: string; arc: string }>;
    key_quotes: Array<{ quote: string; speaker: string; reference: string; analysis: string }>;
    contextual_scope: { historical: string; social: string; biographical: string };
}

export interface ThematicContent {
    topic_synopsis: string;
    key_themes: Array<{ theme: string; description: string }>;
    named_examples: Array<{ example: string; context: string; significance: string }>;
    key_terminology: Array<{ term: string; definition: string }>;
    debates: Array<{ debate: string; positions: string[] }>;
}

export interface MFLContent {
    topic_synopsis: string;
    vocabulary_sets: { foundation: string[]; higher: string[] };
    grammar_focus: Array<{ structure: string; usage: string; examples: string[] }>;
    cultural_knowledge: string[];
}

export interface EnglishLanguageContent {
    topic_synopsis: string;
    reading_skills: string[];
    writing_skills: string[];
    model_approaches: Array<{ question_type: string; approach: string; key_phrases: string[] }>;
}

export interface CreativeArtsContent {
    topic_synopsis: string;
    key_concepts: string[];
    skill_requirements: Array<{ skill: string; description: string }>;
    practical_components: string[];
}

export type ContentResult = {
    spec_id: string;
    topic_number: string;
    topic_name: string;
    bucket: SubjectBucket;
    content: Record<string, unknown>;
    extracted_at: string;
};

// ─── Step 4: Exam Strategy ─────────────────────────────────────────

export interface ExamStrategy {
    marking_points: string[];
    common_mistakes: string[];
    exam_tips: string[];
    likely_command_words: string[];
    command_word_ao_map: Record<string, string>;
    ao_emphasis: Record<string, number>;
    discriminator_features: {
        grade_boundary_low: string;
        grade_boundary_high: string;
    };
    feedback_prompts: string[];
}

export type ExamResult = {
    spec_id: string;
    topic_number: string;
    topic_name: string;
    strategy: ExamStrategy;
    extracted_at: string;
};

// ─── Pipeline State ────────────────────────────────────────────────

export interface SpecInput {
    id: string;
    board: string;
    level: string;
    subject: string;
    spec_code: string;
    subject_id: string;
}

export interface PipelineState {
    step1: Record<string, SkeletonResult>;     // keyed by spec_id
    step2: Record<string, AssessmentResult>;   // keyed by spec_id
    step3: Record<string, ContentResult[]>;    // keyed by spec_id
    step4: Record<string, ExamResult[]>;       // keyed by spec_id
}
