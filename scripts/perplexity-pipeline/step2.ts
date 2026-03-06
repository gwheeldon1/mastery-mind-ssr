/**
 * Step 2: Assessment Structure
 *
 * For each specification, query Perplexity for papers, AOs, marks,
 * and marking approach. Step 1 output is injected as context.
 */

import { queryPerplexityJSON } from './perplexity.js';
import { loadCheckpoint, appendCheckpoint } from './checkpoint.js';
import { loadSpecs } from './supabase.js';
import type { AssessmentResult, SkeletonResult, SpecInput } from './types.js';

function isRealSpecCode(code: string): boolean {
    return /^[A-Za-z0-9]{2,10}$/.test(code);
}

function buildPrompt(spec: SpecInput, skeleton: SkeletonResult): string {
    const topicList = skeleton.topics
        .map(t => `${t.topic_number}. ${t.topic_name} (${t.subtopics.length} subtopics)`)
        .join('\n');

    const specRef = spec.spec_code && isRealSpecCode(spec.spec_code)
        ? `(spec code: ${spec.spec_code})`
        : '';

    return `Search the official ${spec.board} website for the ${spec.level} ${spec.subject} specification ${specRef}.

This specification covers these topics:
${topicList}

Provide the EXACT assessment structure. Return ONLY raw JSON, no markdown:
{
  "papers": [
    {
      "paper_number": "1",
      "paper_title": "Paper 1",
      "duration_minutes": 105,
      "total_marks": 100,
      "weighting_percent": 50,
      "question_types": ["multiple choice", "short answer", "extended response"],
      "topics_assessed": ["1", "2", "3"],
      "tiers": ["Foundation", "Higher"]
    }
  ],
  "assessment_objectives": [
    {
      "ao_code": "AO1",
      "description": "Demonstrate knowledge and understanding",
      "weighting_percent": 40
    }
  ],
  "marking_approach": "point_based",
  "has_coursework": false,
  "has_practical_endorsement": true
}

Rules:
- marking_approach: exactly "point_based", "levels_based", or "hybrid"
- AO weightings must sum to approximately 100
- Use EXACT paper titles from the specification
- topics_assessed should reference topic numbers from the topic list above
- If you cannot find the exact assessment structure, say so`;
}

type RawAssessment = Omit<AssessmentResult, 'spec_id' | 'extracted_at'>;

function validate(result: unknown): { valid: boolean; issues: string[]; data: RawAssessment | null } {
    const issues: string[] = [];

    // Check it's actually an object with papers
    if (!result || typeof result !== 'object' || Array.isArray(result)) {
        return { valid: false, issues: ['Response is not a JSON object'], data: null };
    }

    const r = result as Record<string, unknown>;

    if (!Array.isArray(r.papers) || r.papers.length === 0) {
        return { valid: false, issues: ['No papers array found'], data: null };
    }

    if (!Array.isArray(r.assessment_objectives) || r.assessment_objectives.length === 0) {
        issues.push('No AOs');
    } else {
        const sum = (r.assessment_objectives as Array<{ weighting_percent?: number }>)
            .reduce((s, ao) => s + (ao.weighting_percent || 0), 0);
        if (sum < 90 || sum > 110) issues.push(`AO weightings sum to ${sum} (expected ~100)`);
    }

    const validApproaches = ['point_based', 'levels_based', 'hybrid'];
    if (!validApproaches.includes(r.marking_approach as string)) {
        issues.push(`Invalid marking_approach: "${r.marking_approach}"`);
    }

    return { valid: issues.length === 0, issues, data: result as RawAssessment };
}

export async function runStep2(specIds?: string[]): Promise<void> {
    const allSpecs = await loadSpecs();
    const step1 = loadCheckpoint<SkeletonResult>('step1');
    const checkpoint = loadCheckpoint<AssessmentResult>('step2');

    const specs = (specIds ? allSpecs.filter(s => specIds.includes(s.id)) : allSpecs)
        .filter(s => step1[s.id]); // only run on specs with Step 1 data

    console.log(`\n=== Step 2: Assessment Structure ===`);
    console.log(`Specs with Step 1 data: ${specs.length}, already done: ${Object.keys(checkpoint).length}\n`);

    let done = 0, skipped = 0, failed = 0;

    for (const spec of specs) {
        if (checkpoint[spec.id]) { skipped++; continue; }

        const label = `${spec.board} ${spec.level} ${spec.subject}`;
        process.stdout.write(`[${done + skipped + failed + 1}/${specs.length}] ${label}... `);

        try {
            const prompt = buildPrompt(spec, step1[spec.id]);
            const raw = await queryPerplexityJSON<unknown>(prompt);
            const { valid, issues, data } = validate(raw);

            if (!data) {
                failed++;
                console.log(`❌ Invalid response: ${issues.join(', ')}`);
                continue;
            }

            const result: AssessmentResult = {
                spec_id: spec.id,
                ...data,
                extracted_at: new Date().toISOString(),
            };

            appendCheckpoint('step2', spec.id, result);
            done++;
            console.log(valid
                ? `✅ ${result.papers.length} papers, ${result.assessment_objectives.length} AOs`
                : `⚠️ ${result.papers.length} papers (${issues.join(', ')})`
            );
        } catch (err) {
            failed++;
            console.log(`❌ ${(err as Error).message.slice(0, 80)}`);
        }
    }

    console.log(`\nStep 2 complete: ${done} extracted, ${skipped} skipped, ${failed} failed`);
}

if (process.argv[1]?.endsWith('step2.ts')) {
    const ids = process.argv.slice(2);
    runStep2(ids.length ? ids : undefined).catch(console.error);
}
