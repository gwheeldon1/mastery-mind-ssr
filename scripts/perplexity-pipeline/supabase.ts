/**
 * Supabase client + spec loader.
 * Fetches all current specification_versions to drive the pipeline.
 */

import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { SpecInput } from './types.js';

let client: SupabaseClient | null = null;

export function getClient(): SupabaseClient {
    if (client) return client;

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        throw new Error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in env');
    }

    client = createClient(url, key);
    return client;
}

/**
 * Load all current specification versions with their subject name.
 */
export async function loadSpecs(): Promise<SpecInput[]> {
    const db = getClient();

    const { data, error } = await db
        .from('specification_versions')
        .select(`
      id,
      exam_board,
      qualification_level,
      spec_code,
      subject_id,
      subjects!inner(name)
    `)
        .eq('is_current', true)
        .order('exam_board')
        .order('qualification_level');

    if (error) throw new Error(`Failed to load specs: ${error.message}`);

    return (data || []).map((row: any) => ({
        id: row.id,
        board: row.exam_board,
        level: row.qualification_level,
        subject: row.subjects.name,
        spec_code: row.spec_code || '',
        subject_id: row.subject_id,
    }));
}
