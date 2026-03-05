/**
 * Free Spaced Repetition Scheduler (FSRS) Algorithm
 * Based on the research by Jarrett Ye
 * Reference: https://github.com/open-spaced-repetition/fsrs4anki
 *
 * FSRS improves on SM-2 by using memory stability and retrievability models.
 */

const DEFAULT_PARAMS = {
    w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],
    requestRetention: 0.9,
    maximumInterval: 36500,
};

export enum Rating {
    Again = 1,
    Hard = 2,
    Good = 3,
    Easy = 4,
}

export interface FSRSState {
    stability: number;
    difficulty: number;
    elapsedDays: number;
    scheduledDays: number;
    reps: number;
    lapses: number;
    lastReview: Date | null;
}

export interface ReviewLog {
    rating: Rating;
    reviewedAt: Date;
    elapsedDays: number;
    scheduledDays: number;
    state: FSRSState;
}

export function initializeFSRSState(): FSRSState {
    return { stability: 0, difficulty: 0, elapsedDays: 0, scheduledDays: 0, reps: 0, lapses: 0, lastReview: null };
}

function initStability(rating: Rating): number {
    return Math.max(0.1, DEFAULT_PARAMS.w[rating - 1]);
}

function initDifficulty(rating: Rating): number {
    const w = DEFAULT_PARAMS.w;
    return Math.min(Math.max(w[4] - Math.exp(w[5] * (rating - 1)) + 1, 1), 10) / 10;
}

export function getRetrievability(state: FSRSState, elapsedDays: number): number {
    if (state.stability === 0) return 0;
    return Math.pow(1 + elapsedDays / (9 * state.stability), -1);
}

function nextStability(state: FSRSState, retrievability: number, rating: Rating): number {
    const w = DEFAULT_PARAMS.w;
    const { stability, difficulty } = state;

    if (rating === Rating.Again) {
        return w[11] * Math.pow(difficulty, -w[12]) *
            (Math.pow(stability + 1, w[13]) - 1) *
            Math.exp(w[14] * (1 - retrievability));
    }

    const hardPenalty = rating === Rating.Hard ? w[15] : 1;
    const easyBonus = rating === Rating.Easy ? w[16] : 1;

    return stability * (
        1 + Math.exp(w[8]) *
        (11 - difficulty) *
        Math.pow(stability, -w[9]) *
        (Math.exp(w[10] * (1 - retrievability)) - 1) *
        hardPenalty * easyBonus
    );
}

function nextDifficulty(difficulty: number, rating: Rating): number {
    const w = DEFAULT_PARAMS.w;
    const newDifficulty = difficulty - w[6] * (rating - 3);
    const meanDifficulty = initDifficulty(Rating.Good);
    return Math.min(Math.max((1 - w[7]) * newDifficulty + w[7] * meanDifficulty, 0.01), 1);
}

function nextInterval(stability: number): number {
    const { requestRetention, maximumInterval } = DEFAULT_PARAMS;
    const interval = (9 * stability) * (1 / requestRetention - 1);
    return Math.min(Math.max(Math.round(interval), 1), maximumInterval);
}

export function reviewCard(
    state: FSRSState,
    rating: Rating,
    reviewDate: Date = new Date()
): { state: FSRSState; log: ReviewLog } {
    const elapsedDays = state.lastReview
        ? Math.max(0, (reviewDate.getTime() - state.lastReview.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    let newState: FSRSState;

    if (state.reps === 0) {
        newState = {
            stability: initStability(rating),
            difficulty: initDifficulty(rating),
            elapsedDays: 0,
            scheduledDays: 0,
            reps: rating >= Rating.Good ? 1 : 0,
            lapses: rating === Rating.Again ? 1 : 0,
            lastReview: reviewDate,
        };
    } else {
        const retrievability = getRetrievability(state, elapsedDays);
        newState = {
            stability: nextStability(state, retrievability, rating),
            difficulty: nextDifficulty(state.difficulty, rating),
            elapsedDays,
            scheduledDays: 0,
            reps: rating >= Rating.Good ? state.reps + 1 : state.reps,
            lapses: rating === Rating.Again ? state.lapses + 1 : state.lapses,
            lastReview: reviewDate,
        };
    }

    newState.scheduledDays = nextInterval(newState.stability);

    return {
        state: newState,
        log: { rating, reviewedAt: reviewDate, elapsedDays, scheduledDays: newState.scheduledDays, state: { ...newState } },
    };
}

export function getNextReviewDate(state: FSRSState): Date {
    const d = new Date();
    d.setDate(d.getDate() + state.scheduledDays);
    return d;
}

export function correctnessToRating(isCorrect: boolean, confidence?: number): Rating {
    if (!isCorrect) return Rating.Again;
    if (confidence !== undefined) {
        if (confidence >= 4) return Rating.Easy;
        if (confidence >= 3) return Rating.Good;
        return Rating.Hard;
    }
    return Rating.Good;
}

export function estimateRetention(state: FSRSState, daysFromNow: number): number {
    return getRetrievability(state, state.elapsedDays + daysFromNow);
}

export function previewSchedule(state: FSRSState): Record<Rating, number> {
    const r = state.stability > 0
        ? getRetrievability(state, state.elapsedDays)
        : DEFAULT_PARAMS.requestRetention;

    return {
        [Rating.Again]: nextInterval(initStability(Rating.Again)),
        [Rating.Hard]: nextInterval(nextStability(state, r, Rating.Hard)),
        [Rating.Good]: nextInterval(nextStability(state, r, Rating.Good)),
        [Rating.Easy]: nextInterval(nextStability(state, r, Rating.Easy)),
    };
}
