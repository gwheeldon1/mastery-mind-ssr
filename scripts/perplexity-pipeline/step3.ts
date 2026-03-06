/**
 * Step 3: Content Enrichment (Bucket-Specific)
 *
 * For each topic, query Perplexity for conceptual content.
 * Steps 1 + 2 output is injected as context.
 * Prompt varies by subject bucket.
 */

import { queryPerplexityJSON } from './perplexity.js';
import { loadCheckpoint, appendCheckpoint } from './checkpoint.js';
import { loadSpecs } from './supabase.js';
import { detectSubjectBucket } from './bucket.js';
import type { ContentResult, SkeletonResult, AssessmentResult, Topic, SubjectBucket, SpecInput } from './types.js';

// ─── Bucket-Specific Field Blocks ──────────────────────────────────

const BUCKET_FIELDS: Record<SubjectBucket, string> = {
    STEM: `{
  "topic_synopsis": "2-3 sentences, specific to this board's treatment. Min 100 chars.",
  "key_concepts": ["Specific concept from this topic"],
  "learning_objectives": ["Students should be able to..."],
  "tier_differentiation": {"foundation": "What Foundation covers", "higher": "What Higher adds"},
  "synoptic_links": ["Related topic - connection"],
  "misconceptions": ["Common misconception - why it's wrong"],
  "required_practicals": ["RP title and brief description, or empty array if none"]
}`,

    TEXT_BASED: `{
  "topic_synopsis": "Overview of this text/topic and its literary significance. Min 150 chars.",
  "key_themes": [{"theme": "Theme name", "description": "How it develops", "key_moments": ["Act/Chapter"]}],
  "character_analysis": [{"character": "Name", "role": "protagonist/antagonist", "arc": "How they change"}],
  "key_quotes": [{"quote": "The exact quote", "speaker": "Who", "reference": "Act 1 Scene 5", "analysis": "Why it matters"}],
  "contextual_scope": {"historical": "Period and events", "social": "Social conditions", "biographical": "Author context"}
}`,

    THEMATIC: `{
  "topic_synopsis": "What this topic covers, its scope, and significance. Min 100 chars.",
  "key_themes": [{"theme": "Theme or concept", "description": "How it's examined"}],
  "named_examples": [{"example": "Specific case study/event/person", "context": "Brief context", "significance": "Why it matters"}],
  "key_terminology": [{"term": "Technical term", "definition": "What it means in this context"}],
  "debates": [{"debate": "Key interpretive debate", "positions": ["View A", "View B"]}]
}`,

    MFL: `{
  "topic_synopsis": "Communicative scope. What students must understand and produce. Min 100 chars.",
  "vocabulary_sets": {"foundation": ["10+ core words/phrases"], "higher": ["10+ advanced words/phrases"]},
  "grammar_focus": [{"structure": "Grammar point", "usage": "When to use it", "examples": ["Example in target language"]}],
  "cultural_knowledge": ["Specific cultural fact relevant to this topic"]
}`,

    ENGLISH_LANGUAGE: `{
  "topic_synopsis": "What this skill area covers and how it's assessed. Min 100 chars.",
  "reading_skills": ["Specific reading skill assessed"],
  "writing_skills": ["Specific writing skill assessed"],
  "model_approaches": [{"question_type": "e.g. Language analysis Q3", "approach": "Step-by-step method", "key_phrases": ["Useful phrases"]}]
}`,

    CREATIVE_ARTS: `{
  "topic_synopsis": "What this topic covers and its practical/theoretical components. Min 100 chars.",
  "key_concepts": ["Core concept"],
  "skill_requirements": [{"skill": "Skill name", "description": "What students must demonstrate"}],
  "practical_components": ["What students produce/perform"]
}`,

    OTHER: `{
  "topic_synopsis": "What this topic covers. Min 100 chars.",
  "key_concepts": ["Core concept"],
  "learning_objectives": ["Students should be able to..."]
}`,
};

// ─── Prompt Builder ────────────────────────────────────────────────

function buildPrompt(
    spec: SpecInput,
    skeleton: SkeletonResult,
    assessment: AssessmentResult,
    topic: Topic,
    bucket: SubjectBucket,
): string {
    const topicList = skeleton.topics
        .map(t => `${t.topic_number}. ${t.topic_name}`)
        .join(', ');

    const subtopicList = topic.subtopics
        .map(st => `${st.subtopic_number}. ${st.subtopic_name}`)
        .join('\n  ');

    const papers = assessment.papers
        .map(p => `${p.paper_title} (${p.duration_minutes}min, ${p.total_marks} marks, ${p.weighting_percent}%)`)
        .join('\n  ');

    const aos = assessment.assessment_objectives
        .map(ao => `${ao.ao_code}: ${ao.description} (${ao.weighting_percent}%)`)
        .join('\n  ');

    return `You are enriching a topic from the ${spec.board} ${spec.level} ${spec.subject} specification.

SPECIFICATION STRUCTURE:
  Topics: ${topicList}
  Papers:
  ${papers}
  Assessment Objectives:
  ${aos}
  Marking approach: ${assessment.marking_approach}

THIS TOPIC:
  ${topic.topic_number}: ${topic.topic_name}
  Subtopics:
  ${subtopicList || '(none listed)'}

Search official ${spec.board} resources for this specific topic. Provide the following. Return ONLY raw JSON, no markdown:

${BUCKET_FIELDS[bucket]}

Rules:
- Be specific to ${spec.board}'s treatment, not generic
- Use specification terminology where possible
- Do NOT invent content that isn't in the real specification`;
}

// ─── Runner ────────────────────────────────────────────────────────

export async function runStep3(specIds?: string[]): Promise<void> {
    const allSpecs = await loadSpecs();
    const step1 = loadCheckpoint<SkeletonResult>('step1');
    const step2 = loadCheckpoint<AssessmentResult>('step2');
    const checkpoint = loadCheckpoint<ContentResult[]>('step3');

    const specs = (specIds ? allSpecs.filter(s => specIds.includes(s.id)) : allSpecs)
        .filter(s => step1[s.id] && step2[s.id]);

    console.log(`\n=== Step 3: Content Enrichment ===`);
    console.log(`Specs ready: ${specs.length}, already done: ${Object.keys(checkpoint).length}\n`);

    let done = 0, skipped = 0, failed = 0;

    for (const spec of specs) {
        if (checkpoint[spec.id]) { skipped++; continue; }

        const skeleton = step1[spec.id];
        const assessment = step2[spec.id];
        const bucket = detectSubjectBucket(spec.subject);
        const label = `${spec.board} ${spec.level} ${spec.subject} [${bucket}]`;

        console.log(`\n📚 ${label} — ${skeleton.topics.length} topics`);

        const results: ContentResult[] = [];

        for (const topic of skeleton.topics) {
            process.stdout.write(`  ${topic.topic_number}. ${topic.topic_name}... `);

            try {
                const prompt = buildPrompt(spec, skeleton, assessment, topic, bucket);
                const content = await queryPerplexityJSON<Record<string, unknown>>(prompt);

                results.push({
                    spec_id: spec.id,
                    topic_number: topic.topic_number,
                    topic_name: topic.topic_name,
                    bucket,
                    content,
                    extracted_at: new Date().toISOString(),
                });

                done++;
                console.log('✅');
            } catch (err) {
                failed++;
                console.log(`❌ ${(err as Error).message.slice(0, 60)}`);
            }
        }

        // Save all topics for this spec at once
        appendCheckpoint('step3', spec.id, results);
    }

    console.log(`\nStep 3 complete: ${done} topics enriched, ${skipped} specs skipped, ${failed} topics failed`);
}

if (process.argv[1]?.endsWith('step3.ts')) {
    const ids = process.argv.slice(2);
    runStep3(ids.length ? ids : undefined).catch(console.error);
}
