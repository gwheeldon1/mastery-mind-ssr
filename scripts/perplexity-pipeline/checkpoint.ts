/**
 * Checkpoint persistence — saves/loads pipeline state to JSON files.
 * Enables crash recovery: the runner skips specs/topics already in the checkpoint.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const RESULTS_DIR = join(import.meta.dirname!, 'results');

function ensureDir(): void {
    if (!existsSync(RESULTS_DIR)) mkdirSync(RESULTS_DIR, { recursive: true });
}

export function loadCheckpoint<T>(step: string): Record<string, T> {
    ensureDir();
    const path = join(RESULTS_DIR, `${step}.json`);
    if (!existsSync(path)) return {};
    try {
        return JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
        return {};
    }
}

export function saveCheckpoint<T>(step: string, data: Record<string, T>): void {
    ensureDir();
    const path = join(RESULTS_DIR, `${step}.json`);
    writeFileSync(path, JSON.stringify(data, null, 2));
}

/**
 * Append a single result to a checkpoint, writing immediately.
 * This ensures no data is lost on crash.
 */
export function appendCheckpoint<T>(step: string, key: string, value: T): void {
    const data = loadCheckpoint<T>(step);
    data[key] = value;
    saveCheckpoint(step, data);
}
