/**
 * Subject bucket detection.
 * Ported from mastery-mind-hub/_shared/enrichment/manus-enrichment-prompts.ts
 */

import type { SubjectBucket } from './types.js';

export function detectSubjectBucket(subjectName: string): SubjectBucket {
    const n = subjectName.toLowerCase().trim();

    // English Language MUST be checked before generic 'english' patterns
    if (n.includes('english language')) return 'ENGLISH_LANGUAGE';

    // STEM
    const stem = [
        'mathematics', 'maths', 'physics', 'chemistry', 'biology',
        'computer science', 'computing', 'combined science', 'science',
        'statistics', 'further maths', 'further mathematics',
    ];
    if (stem.some(p => n.includes(p))) return 'STEM';

    // Text-based
    const text = ['english literature', 'drama', 'theatre studies', 'classical civilisation', 'classics'];
    if (text.some(p => n.includes(p))) return 'TEXT_BASED';

    // Thematic / Humanities
    const thematic = [
        'history', 'geography', 'religious studies', 'religious education', 're', 'rs',
        'philosophy', 'ethics', 'sociology', 'politics', 'government',
        'economics', 'business studies', 'business', 'citizenship', 'media studies',
        'psychology',
    ];
    if (thematic.some(p => n.includes(p))) return 'THEMATIC';

    // MFL
    const mfl = [
        'french', 'german', 'spanish', 'chinese', 'mandarin',
        'japanese', 'russian', 'italian', 'arabic', 'urdu',
        'polish', 'portuguese', 'latin', 'greek', 'hindi', 'punjabi',
    ];
    if (mfl.some(p => n.includes(p))) return 'MFL';

    // Creative Arts
    const creative = [
        'art', 'music', 'physical education', 'pe', 'sport',
        'design and technology', 'design technology', 'd&t', 'dt',
        'food', 'textiles', 'engineering', 'graphic',
    ];
    if (creative.some(p => n.includes(p))) return 'CREATIVE_ARTS';

    return 'OTHER';
}
