/**
 * Step 4: Exam Strategy (Bucket-Specific)
 *
 * For each topic, query Perplexity for exam-specific advice.
 * Full context from Steps 1 + 2 + 3 is injected.
 */

import { queryPerplexityJSON } from './perplexity.js';
import { loadCheckpoint, appendCheckpoint } from './checkpoint.js';
import { loadSpecs } from './supabase.js';
import { detectSubjectBucket } from './bucket.js';
import type { ExamResult, ExamStrategy, SkeletonResult, AssessmentResult, ContentResult, Topic, SpecInput } from './types.js';

// ─── Prompt Builder ────────────────────────────────────────────────

function buildPrompt(
    spec: SpecInput,
    skeleton: SkeletonResult,
    assessment: AssessmentResult,
    topic: Topic,
    topicContent: Record<string, unknown> | undefined,
): string {
    const papers = assessment.papers
        .map(p => `${p.paper_title} (${p.total_marks} marks, ${p.weighting_percent}%)`)
        .join(', ');

    const aos = assessment.assessment_objectives
        .map(ao => `${ao.ao_code}: ${ao.description} (${ao.weighting_percent}%)`)
        .join('; ');

    const subtopics = topic.subtopics
        .map(st => `${st.subtopic_number}. ${st.subtopic_name}`)
        .join(', ');

    const contentCtx = topicContent
        ? `\nCONTENT (from previous enrichment step):\n${JSON.stringify(topicContent, null, 2)}`
        : '';

    return `You are an expert examiner for ${spec.board} ${spec.level} ${spec.subject}.

TOPIC: ${topic.topic_number}. ${topic.topic_name}
SUBTOPICS: ${subtopics || '(none)'}
PAPERS: ${papers}
ASSESSMENT OBJECTIVES: ${aos}
MARKING APPROACH: ${assessment.marking_approach}
${contentCtx}

Search for recent ${spec.board} examiner reports and mark schemes for ${spec.subject}.
Based on the specification content and real exam materials, provide exam strategy.

Return ONLY raw JSON, no markdown:
{
  "marking_points": [
    "Award 1 mark for... / Credit responses that... (use examiner language, at least 4)"
  ],
  "common_mistakes": [
    "From examiner reports: students often... (at least 3)"
  ],
  "exam_tips": [
    "For ${spec.board} specifically... (at least 3)"
  ],
  "likely_command_words": ["State", "Explain", "Evaluate", "Compare", "Describe"],
  "command_word_ao_map": {
    "State": "AO1",
    "Explain": "AO2"
  },
  "ao_emphasis": {"AO1": 30, "AO2": 40, "AO3": 30},
  "discriminator_features": {
    "grade_boundary_low": "What differentiates pass from fail",
    "grade_boundary_high": "What distinguishes top performance"
  },
  "feedback_prompts": [
    "Constructive feedback phrase a teacher would use (at least 4)"
  ]
}

Rules:
- marking_points MUST use examiner language: "Award", "Credit", "Candidates should"
- common_mistakes should cite real patterns, not generic advice
- ao_emphasis must sum to approximately 100
- command_word_ao_map must have an entry for EVERY word in likely_command_words
- Do NOT invent examiner report quotes`;
}

function validate(result: ExamStrategy): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!result.marking_points?.length || result.marking_points.length < 3) {
        issues.push(`Only ${result.marking_points?.length || 0} marking_points (need 4+)`);
    }
    if (!result.common_mistakes?.length || result.common_mistakes.length < 2) {
        issues.push(`Only ${result.common_mistakes?.length || 0} common_mistakes (need 3+)`);
    }
    if (!result.likely_command_words?.length) {
        issues.push('No command words');
    }
    if (result.ao_emphasis) {
        const sum = Object.values(result.ao_emphasis).reduce((s, v) => s + v, 0);
        if (sum < 90 || sum > 110) issues.push(`AO emphasis sums to ${sum}`);
    }
    // Check all command words are mapped
    const mapped = Object.keys(result.command_word_ao_map || {});
    const unmapped = (result.likely_command_words || []).filter(w => !mapped.includes(w));
    if (unmapped.length) issues.push(`Unmapped command words: ${unmapped.join(', ')}`);

    return { valid: issues.length === 0, issues };
}

// ─── Runner ────────────────────────────────────────────────────────

export async function runStep4(specIds?: string[]): Promise<void> {
    const allSpecs = await loadSpecs();
    const step1 = loadCheckpoint<SkeletonResult>('step1');
    const step2 = loadCheckpoint<AssessmentResult>('step2');
    const step3 = loadCheckpoint<ContentResult[]>('step3');
    const checkpoint = loadCheckpoint<ExamResult[]>('step4');

    const specs = (specIds ? allSpecs.filter(s => specIds.includes(s.id)) : allSpecs)
        .filter(s => step1[s.id] && step2[s.id]);

    console.log(`\n=== Step 4: Exam Strategy ===`);
    console.log(`Specs ready: ${specs.length}, already done: ${Object.keys(checkpoint).length}\n`);

    let done = 0, skipped = 0, failed = 0;

    for (const spec of specs) {
        if (checkpoint[spec.id]) { skipped++; continue; }

        const skeleton = step1[spec.id];
        const assessment = step2[spec.id];
        const contentResults = step3[spec.id] || [];
        const label = `${spec.board} ${spec.level} ${spec.subject}`;

        // Build a lookup for Step 3 content by topic number
        const contentByTopic: Record<string, Record<string, unknown>> = {};
        for (const cr of contentResults) {
            contentByTopic[cr.topic_number] = cr.content as Record<string, unknown>;
        }

        console.log(`\n🎯 ${label} — ${skeleton.topics.length} topics`);

        const results: ExamResult[] = [];

        for (const topic of skeleton.topics) {
            process.stdout.write(`  ${topic.topic_number}. ${topic.topic_name}... `);

            try {
                const prompt = buildPrompt(spec, skeleton, assessment, topic, contentByTopic[topic.topic_number]);
                const strategy = await queryPerplexityJSON<ExamStrategy>(prompt);
                const { valid, issues } = validate(strategy);

                results.push({
                    spec_id: spec.id,
                    topic_number: topic.topic_number,
                    topic_name: topic.topic_name,
                    strategy,
                    extracted_at: new Date().toISOString(),
                });

                done++;
                console.log(valid ? '✅' : `⚠️ (${issues.join(', ')})`);
            } catch (err) {
                failed++;
                console.log(`❌ ${(err as Error).message.slice(0, 60)}`);
            }
        }

        appendCheckpoint('step4', spec.id, results);
    }

    console.log(`\nStep 4 complete: ${done} topics enriched, ${skipped} specs skipped, ${failed} topics failed`);
}

if (process.argv[1]?.endsWith('step4.ts')) {
    const ids = process.argv.slice(2);
    runStep4(ids.length ? ids : undefined).catch(console.error);
}
