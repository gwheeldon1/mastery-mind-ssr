/**
 * Apply pipeline results to the spec_topics table.
 *
 * Reads from checkpoint files and upserts into Supabase.
 * Match key: (specification_version_id, topic_name, subtopic_name)
 */

import { getClient } from './supabase.js';
import { loadCheckpoint } from './checkpoint.js';
import type { SkeletonResult, AssessmentResult, ContentResult, ExamResult } from './types.js';

interface TopicRow {
    specification_version_id: string;
    topic_name: string;
    subtopic_name: string;
    topic_number: string | null;
    subtopic_number: string | null;
    topic_synopsis: string | null;
    marking_points: string[] | null;
    common_mistakes: string[] | null;
    exam_tips: string[] | null;
    likely_command_words: string[] | null;
    subject_specific_data: Record<string, unknown> | null;
    enriched_at: string | null;
}

export async function applyResults(specIds?: string[]): Promise<void> {
    const db = getClient();
    const step1 = loadCheckpoint<SkeletonResult>('step1');
    const step2 = loadCheckpoint<AssessmentResult>('step2');
    const step3 = loadCheckpoint<ContentResult[]>('step3');
    const step4 = loadCheckpoint<ExamResult[]>('step4');

    const ids = specIds || Object.keys(step1);

    console.log(`\n=== Applying results to spec_topics ===`);
    console.log(`Specs to process: ${ids.length}\n`);

    let upserted = 0, failed = 0;

    for (const specId of ids) {
        const skeleton = step1[specId];
        if (!skeleton) continue;

        const assessment = step2[specId];
        const contents = step3[specId] || [];
        const exams = step4[specId] || [];

        // Build lookups by topic number
        const contentByTopic: Record<string, Record<string, unknown>> = {};
        for (const c of contents) {
            contentByTopic[c.topic_number] = c.content as Record<string, unknown>;
        }
        const examByTopic: Record<string, ExamResult['strategy']> = {};
        for (const e of exams) {
            examByTopic[e.topic_number] = e.strategy;
        }

        const label = `${skeleton.board} ${skeleton.level} ${skeleton.subject}`;
        process.stdout.write(`${label}... `);

        // Flatten topics → rows (one row per subtopic, or one per topic if no subtopics)
        const rows: TopicRow[] = [];

        for (const topic of skeleton.topics) {
            const content = contentByTopic[topic.topic_number] || {};
            const exam = examByTopic[topic.topic_number] || {};
            const synopsis = (content as any).topic_synopsis || null;

            if (topic.subtopics.length === 0) {
                // Topic with no subtopics = one row
                rows.push({
                    specification_version_id: specId,
                    topic_name: topic.topic_name,
                    subtopic_name: topic.topic_name,
                    topic_number: topic.topic_number,
                    subtopic_number: null,
                    topic_synopsis: synopsis,
                    marking_points: (exam as any).marking_points || null,
                    common_mistakes: (exam as any).common_mistakes || null,
                    exam_tips: (exam as any).exam_tips || null,
                    likely_command_words: (exam as any).likely_command_words || null,
                    subject_specific_data: {
                        ...content,
                        ...exam,
                        assessment: assessment || null,
                    },
                    enriched_at: new Date().toISOString(),
                });
            } else {
                // One row per subtopic
                for (const st of topic.subtopics) {
                    rows.push({
                        specification_version_id: specId,
                        topic_name: topic.topic_name,
                        subtopic_name: st.subtopic_name,
                        topic_number: topic.topic_number,
                        subtopic_number: st.subtopic_number,
                        topic_synopsis: synopsis,
                        marking_points: (exam as any).marking_points || null,
                        common_mistakes: (exam as any).common_mistakes || null,
                        exam_tips: (exam as any).exam_tips || null,
                        likely_command_words: (exam as any).likely_command_words || null,
                        subject_specific_data: {
                            ...content,
                            ...exam,
                            assessment: assessment || null,
                        },
                        enriched_at: new Date().toISOString(),
                    });
                }
            }
        }

        // Upsert in batches of 50
        const BATCH = 50;
        try {
            for (let i = 0; i < rows.length; i += BATCH) {
                const batch = rows.slice(i, i + BATCH);
                const { error } = await db
                    .from('spec_topics')
                    .upsert(batch, {
                        onConflict: 'specification_version_id,topic_name,subtopic_name',
                        ignoreDuplicates: false,
                    });

                if (error) throw error;
            }
            upserted += rows.length;
            console.log(`✅ ${rows.length} rows`);
        } catch (err) {
            failed++;
            console.log(`❌ ${(err as Error).message.slice(0, 80)}`);
        }
    }

    console.log(`\nApply complete: ${upserted} rows upserted, ${failed} specs failed`);
}

if (process.argv[1]?.endsWith('apply.ts')) {
    const ids = process.argv.slice(2);
    applyResults(ids.length ? ids : undefined).catch(console.error);
}
