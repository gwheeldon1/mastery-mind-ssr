/**
 * Step 1: Skeleton Extraction
 *
 * For each specification, query Perplexity sonar-pro for the exact
 * topic/subtopic structure from the official spec.
 */

import { queryPerplexityJSON } from './perplexity.js';
import { loadCheckpoint, appendCheckpoint } from './checkpoint.js';
import { loadSpecs } from './supabase.js';
import type { SkeletonResult, Topic, SpecInput } from './types.js';

function isRealSpecCode(code: string): boolean {
    // Real spec codes are short alphanumeric (e.g. '8461', '7182', 'J277')
    // Slugs contain hyphens and are long (e.g. 'Pearson-GCSE-English-Literature')
    return /^[A-Za-z0-9]{2,10}$/.test(code);
}

function buildPrompt(spec: SpecInput): string {
    const specRef = spec.spec_code && isRealSpecCode(spec.spec_code)
        ? `(spec code: ${spec.spec_code})`
        : '';

    return `Search the official ${spec.board} website for the ${spec.level} ${spec.subject} specification ${specRef}.

Return the EXACT topic and subtopic structure as it appears in the specification document. 
CRITICAL: You must extract the MAXIMUM LEVEL OF GRANULARITY available in the specification.

Rules:
- Use the EXACT names and numbers from the specification.
- Include all alphanumeric subject content references if they exist (e.g., for Maths include "N1", "A1", "G1", etc.).
- If a subtopic has nested sub-points (e.g., 4.1.1 has 4.1.1.2), you MUST include those lowest-level items. Do not stop at the top level.
- For option-based subjects (History, RS), list ALL available options.
- For Combined Science, list topics for ALL three sciences.
- Do not paraphrase. Do not invent topics.
- If a topic has no subtopics but you know it contains specific numbered points, extract those points as subtopics.

Return ONLY a raw JSON array, no markdown:
[
  {
    "topic_number": "1",
    "topic_name": "Number",
    "subtopics": [
      {"subtopic_number": "N1", "subtopic_name": "Order positive and negative integers"},
      {"subtopic_number": "N2", "subtopic_name": "Apply the four operations"}
    ]
  },
  {
    "topic_number": "4.1",
    "topic_name": "Cell Biology",
    "subtopics": [
      {"subtopic_number": "4.1.1.1", "subtopic_name": "Eukaryotes and prokaryotes"},
      {"subtopic_number": "4.1.1.2", "subtopic_name": "Animal and plant cells"}
    ]
  }
]`;
}

function validateResult(topics: Topic[]): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!Array.isArray(topics) || topics.length === 0) {
        issues.push('No topics returned');
        return { valid: false, issues };
    }

    if (topics.length > 100) {
        issues.push(`Suspiciously high topic count: ${topics.length}`);
    }

    if (topics.length < 2) {
        issues.push(`Very few topics: ${topics.length}`);
    }

    for (const t of topics) {
        if (!t.topic_name || t.topic_name.length < 3) {
            issues.push(`Empty or very short topic name: "${t.topic_name}"`);
        }
        if (!Array.isArray(t.subtopics)) {
            issues.push(`Missing subtopics array for "${t.topic_name}"`);
        }
    }

    return { valid: issues.length === 0, issues };
}

export async function runStep1(specIds?: string[]): Promise<void> {
    const allSpecs = await loadSpecs();
    const checkpoint = loadCheckpoint<SkeletonResult>('step1');

    const specs = specIds
        ? allSpecs.filter(s => specIds.includes(s.id))
        : allSpecs;

    console.log(`\n=== Step 1: Skeleton Extraction ===`);
    console.log(`Total specs: ${specs.length}, already done: ${Object.keys(checkpoint).length}\n`);

    let done = 0;
    let skipped = 0;
    let failed = 0;

    for (const spec of specs) {
        if (checkpoint[spec.id]) {
            skipped++;
            continue;
        }

        const label = `${spec.board} ${spec.level} ${spec.subject}`;
        process.stdout.write(`[${done + skipped + failed + 1}/${specs.length}] ${label}... `);

        try {
            const prompt = buildPrompt(spec);
            const topics = await queryPerplexityJSON<Topic[]>(prompt);
            const { valid, issues } = validateResult(topics);

            const result: SkeletonResult = {
                spec_id: spec.id,
                board: spec.board,
                level: spec.level,
                subject: spec.subject,
                spec_code: spec.spec_code,
                topics,
                extracted_at: new Date().toISOString(),
            };

            appendCheckpoint('step1', spec.id, result);
            done++;

            if (valid) {
                console.log(`✅ ${topics.length} topics`);
            } else {
                console.log(`⚠️ ${topics.length} topics (${issues.join(', ')})`);
            }
        } catch (err) {
            failed++;
            console.log(`❌ ${(err as Error).message.slice(0, 80)}`);
        }
    }

    console.log(`\nStep 1 complete: ${done} extracted, ${skipped} skipped, ${failed} failed`);
}

// CLI entry point
if (process.argv[1]?.endsWith('step1.ts')) {
    const ids = process.argv.slice(2);
    runStep1(ids.length ? ids : undefined).catch(console.error);
}
