import { useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    FSRSState,
    Rating,
    reviewCard,
    getNextReviewDate,
    correctnessToRating,
    initializeFSRSState,
    estimateRetention,
    previewSchedule,
} from '@/lib/fsrs';

interface ReviewItem {
    id: string;
    topic_id: string | null;
    concept_tag: string | null;
    curriculum_content_id: string | null;
    next_review_at: string;
    interval_days: number;
    ease_factor: number;
    repetitions: number;
    stability: number | null;
    difficulty_fsrs: number | null;
    last_review_at: string | null;
    algorithm: string | null;
}

export function useFSRS() {
    const supabase = createClient();

    const toFSRSState = useCallback((item: ReviewItem | null): FSRSState => {
        if (!item || item.algorithm !== 'fsrs') return initializeFSRSState();
        return {
            stability: item.stability || 0,
            difficulty: item.difficulty_fsrs || 0.3,
            elapsedDays: 0,
            scheduledDays: item.interval_days,
            reps: item.repetitions,
            lapses: 0,
            lastReview: item.last_review_at ? new Date(item.last_review_at) : null,
        };
    }, []);

    const scheduleReview = useCallback(async (
        userId: string,
        topicId: string | null,
        conceptTag: string | null,
        curriculumContentId: string | null,
        isCorrect: boolean,
        confidence?: number,
        specTopicId?: string | null
    ) => {
        let query = supabase
            .from('review_schedule')
            .select('id, topic_id, concept_tag, curriculum_content_id, next_review_at, interval_days, ease_factor, repetitions, stability, difficulty_fsrs, last_review_at, algorithm')
            .eq('user_id', userId);

        if (topicId) query = query.eq('topic_id', topicId);
        if (conceptTag) query = query.eq('concept_tag', conceptTag);
        if (curriculumContentId) query = query.eq('curriculum_content_id', curriculumContentId);

        const { data: existing } = await query.maybeSingle();
        const currentState = toFSRSState(existing as ReviewItem | null);
        const rating = correctnessToRating(isCorrect, confidence);
        const { state: newState } = reviewCard(currentState, rating);
        const nextReviewDate = getNextReviewDate(newState);

        const updateData = {
            interval_days: newState.scheduledDays,
            ease_factor: 2.5,
            repetitions: newState.reps,
            next_review_at: nextReviewDate.toISOString(),
            stability: newState.stability,
            difficulty_fsrs: newState.difficulty,
            last_review_at: new Date().toISOString(),
            algorithm: 'fsrs',
            updated_at: new Date().toISOString(),
        };

        if (existing) {
            await supabase.from('review_schedule').update(updateData).eq('id', existing.id);
        } else {
            await supabase.from('review_schedule').upsert({
                user_id: userId,
                topic_id: topicId,
                concept_tag: conceptTag,
                curriculum_content_id: curriculumContentId,
                spec_topic_id: specTopicId || null,
                ...updateData,
            }, { onConflict: 'user_id,topic_id,concept_tag,curriculum_content_id' });
        }

        return { scheduledDays: newState.scheduledDays, nextReviewAt: nextReviewDate, stability: newState.stability, difficulty: newState.difficulty };
    }, [supabase, toFSRSState]);

    const getDueReviews = useCallback(async (userId: string) => {
        const now = new Date().toISOString();
        const { data, error } = await supabase
            .from('review_schedule')
            .select('id, topic_id, concept_tag, curriculum_content_id, spec_topic_id, next_review_at, interval_days, ease_factor, repetitions, stability, difficulty_fsrs, last_review_at, algorithm')
            .eq('user_id', userId)
            .lte('next_review_at', now)
            .order('next_review_at', { ascending: true })
            .limit(200);

        if (error || !data) return [];

        const contentIds = data.map(r => (r as any).spec_topic_id || r.curriculum_content_id).filter(Boolean);
        const contentMap = new Map<string, { topic: string; subject_id: string }>();

        if (contentIds.length > 0) {
            const { data: topics } = await supabase
                .from('spec_topics')
                .select('id, topic_name, specification_versions(subject_id)')
                .in('id', contentIds);

            topics?.forEach((c: any) => contentMap.set(c.id, { topic: c.topic_name || '', subject_id: c.specification_versions?.subject_id }));
        }

        return data.map(item => {
            const contentId = (item as any).spec_topic_id || item.curriculum_content_id;
            const content = contentId ? contentMap.get(contentId) : null;
            const state = toFSRSState(item as ReviewItem);
            const daysSinceReview = item.last_review_at
                ? (Date.now() - new Date(item.last_review_at).getTime()) / (1000 * 60 * 60 * 24)
                : 0;

            return { ...item, curriculum: content, estimatedRetention: estimateRetention(state, daysSinceReview), fsrsState: state };
        });
    }, [supabase, toFSRSState]);

    const getRetentionForecast = useCallback(async (userId: string, days = 7) => {
        const { data } = await supabase
            .from('review_schedule')
            .select('id, interval_days, ease_factor, repetitions, stability, difficulty_fsrs, last_review_at, next_review_at, algorithm')
            .eq('user_id', userId)
            .eq('algorithm', 'fsrs')
            .limit(500);

        if (!data) return [];

        const forecast = [];
        for (let day = 0; day <= days; day++) {
            const avgRetention = data.reduce((sum, item) => {
                const state = toFSRSState(item as ReviewItem);
                const daysSinceReview = item.last_review_at
                    ? (Date.now() - new Date(item.last_review_at).getTime()) / (1000 * 60 * 60 * 24) + day
                    : day;
                return sum + estimateRetention(state, daysSinceReview);
            }, 0) / Math.max(data.length, 1);

            forecast.push({
                day,
                avgRetention: Math.round(avgRetention * 100),
                itemsDue: data.filter(item => {
                    const dueDate = new Date(item.next_review_at);
                    const targetDate = new Date();
                    targetDate.setDate(targetDate.getDate() + day);
                    return dueDate <= targetDate;
                }).length,
            });
        }

        return forecast;
    }, [supabase, toFSRSState]);

    return { scheduleReview, getDueReviews, getRetentionForecast, Rating };
}
