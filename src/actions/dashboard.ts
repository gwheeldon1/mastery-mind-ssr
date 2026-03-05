"use server";

/**
 * Dashboard server action — fetches all dashboard data in a single server call.
 * Eliminates the client-side waterfall of sequential Supabase queries.
 */

import { createClient } from "@/lib/supabase/server";

export interface DashboardSubject {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
    topics: DashboardTopic[];
    totalMastery: number;
    topicsPracticed: number;
}

export interface DashboardTopic {
    id: string;
    name: string;
    mastery: number;
    curriculumContentId: string | null;
}

export interface DashboardData {
    subjects: DashboardSubject[];
    overallMastery: number;
    totalTopics: number;
}

/**
 * Fetch all dashboard subjects, topics, and progress for a user.
 * Runs server-side — avoids the client waterfall of 4+ sequential queries.
 */
export async function fetchDashboardData(userId: string): Promise<DashboardData> {
    const supabase = await createClient();

    // 1. Get user's subjects
    const { data: userSubjects } = await supabase
        .from("user_subjects")
        .select("subject_id, exam_board")
        .eq("user_id", userId);

    if (!userSubjects?.length) {
        return { subjects: [], overallMastery: 0, totalTopics: 0 };
    }

    const subjectIds = userSubjects.map((us) => us.subject_id);

    // 2. Fetch subject details
    const { data: subjectsData } = await supabase
        .from("subjects")
        .select("id, name, color, icon")
        .in("id", subjectIds)
        .order("name");

    // 3. Build subject data with topics and progress
    const allSubjectData: DashboardSubject[] = [];

    for (const subjectRow of subjectsData || []) {
        const userSub = userSubjects.find((us) => us.subject_id === subjectRow.id);

        let query = supabase
            .from("spec_topics")
            .select(
                "id, topic_name, specification_versions!inner(subject_id, exam_board)"
            )
            .eq("specification_versions.subject_id", subjectRow.id);

        if (userSub?.exam_board) {
            query = query.eq("specification_versions.exam_board", userSub.exam_board);
        }

        const { data: topicsData } = await query.limit(50);

        // Fetch progress for these topics
        const topicIds = (topicsData || []).map((t: any) => t.id);
        const progressMap = new Map<string, number>();

        if (topicIds.length > 0) {
            const { data: progressData } = await supabase
                .from("user_curriculum_progress")
                .select("spec_topic_id, mastery_percentage")
                .eq("user_id", userId)
                .in("spec_topic_id", topicIds);

            progressData?.forEach((p) => {
                if (p.spec_topic_id)
                    progressMap.set(p.spec_topic_id, p.mastery_percentage);
            });
        }

        const topics: DashboardTopic[] = (topicsData || []).map((t: any) => ({
            id: t.id,
            name: t.topic_name,
            mastery: progressMap.get(t.id) || 0,
            curriculumContentId: t.id,
        }));

        const practiced = topics.filter((t) => t.mastery > 0).length;
        const avgMastery =
            topics.length > 0
                ? Math.round(
                    topics.reduce((sum, t) => sum + t.mastery, 0) / topics.length
                )
                : 0;

        allSubjectData.push({
            id: subjectRow.id,
            name: subjectRow.name,
            color: subjectRow.color,
            icon: subjectRow.icon,
            topics,
            totalMastery: avgMastery,
            topicsPracticed: practiced,
        });
    }

    // Compute overall stats
    const allTopics = allSubjectData.flatMap((s) => s.topics);
    const totalTopics = allTopics.length;
    const overallMastery =
        totalTopics > 0
            ? Math.round(allTopics.reduce((s, t) => s + t.mastery, 0) / totalTopics)
            : 0;

    return { subjects: allSubjectData, overallMastery, totalTopics };
}
