"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useUserProfile } from "@/contexts/user-profile-context";
import { useSubscription } from "@/contexts/subscription-context";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
    ArrowLeft,
    Save,
    User,
    BookOpen,
    CreditCard,
    Crown,
    Sparkles,
    Trophy,
    Flame,
    ChevronRight,
    Loader2,
    AlertTriangle,
    Search,
} from "lucide-react";

const YEAR_GROUPS = [
    { label: "Year 3", keyStage: "KS2" },
    { label: "Year 4", keyStage: "KS2" },
    { label: "Year 5", keyStage: "KS2" },
    { label: "Year 6", keyStage: "KS2" },
    { label: "Year 7", keyStage: "KS3" },
    { label: "Year 8", keyStage: "KS3" },
    { label: "Year 9", keyStage: "KS3" },
    { label: "Year 10", keyStage: "KS4" },
    { label: "Year 11", keyStage: "KS4" },
    { label: "Year 12", keyStage: "A-Level" },
    { label: "Year 13", keyStage: "A-Level" },
];

interface Subject {
    id: string;
    name: string;
    icon: string | null;
}

interface SubjectSelection {
    subjectId: string;
    examBoard: string | null;
}

const TIER_INFO = {
    free: { name: "Free", icon: CreditCard, color: "text-muted-foreground" },
    pro: { name: "Pro", icon: Sparkles, color: "text-primary" },
    premium: { name: "Premium", icon: Crown, color: "text-yellow-500" },
} as const;

const AVATAR_COLORS = [
    { id: "cyan", bg: "bg-cyan-500", label: "Cyan" },
    { id: "blue", bg: "bg-blue-500", label: "Blue" },
    { id: "purple", bg: "bg-purple-500", label: "Purple" },
    { id: "green", bg: "bg-green-500", label: "Green" },
    { id: "orange", bg: "bg-orange-500", label: "Orange" },
    { id: "pink", bg: "bg-pink-500", label: "Pink" },
    { id: "red", bg: "bg-red-500", label: "Red" },
    { id: "yellow", bg: "bg-yellow-500", label: "Yellow" },
];

const EXAM_BOARDS = ["AQA", "Edexcel", "OCR", "WJEC", "SQA", "CCEA", "CIE"];

export default function ProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const { profile, isPrimaryMode, updateProfile } = useUserProfile();
    const {
        tier,
        subscribed,
        isTrialing,
        subscriptionEnd,
        internalTrialActive,
        internalTrialEnd,
        loading: subLoading,
    } = useSubscription();

    const router = useRouter();
    const supabase = createClient();

    const [displayName, setDisplayName] = useState("");
    const [yearGroup, setYearGroup] = useState<string | null>(null);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [subjectSelections, setSubjectSelections] = useState<
        SubjectSelection[]
    >([]);
    const [avatarColor, setAvatarColor] = useState("cyan");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [subjectSearch, setSubjectSearch] = useState("");

    useEffect(() => {
        if (!authLoading && !user) router.replace("/auth");
    }, [authLoading, user, router]);

    // Sync profile data
    useEffect(() => {
        if (profile) {
            setDisplayName(profile.display_name || "");
            setYearGroup(profile.year_group || null);
            setAvatarColor(profile.avatar_bg_color || "cyan");
        }
    }, [profile]);

    // Fetch subjects and user selections
    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [{ data: allSubjects }, { data: userSubjects }] =
                await Promise.all([
                    supabase.from("subjects").select("id, name, icon").order("name"),
                    supabase
                        .from("user_subjects")
                        .select("subject_id, exam_board")
                        .eq("user_id", user.id),
                ]);

            if (allSubjects) setSubjects(allSubjects);
            if (userSubjects) {
                setSubjectSelections(
                    userSubjects.map((us) => ({
                        subjectId: us.subject_id,
                        examBoard: us.exam_board || null,
                    }))
                );
            }
        } catch (err) {
            console.error("Failed to load profile data:", err);
        } finally {
            setLoading(false);
        }
    }, [user, supabase]);

    useEffect(() => {
        if (user) fetchData();
    }, [user, fetchData]);

    const toggleSubject = (subjectId: string) => {
        setSubjectSelections((prev) => {
            const exists = prev.find((s) => s.subjectId === subjectId);
            if (exists) return prev.filter((s) => s.subjectId !== subjectId);
            return [...prev, { subjectId, examBoard: null }];
        });
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            // Update profile
            await updateProfile({
                display_name: displayName,
                year_group: yearGroup,
                avatar_bg_color: avatarColor,
            });

            // Sync user subjects
            const { data: currentSubjects } = await supabase
                .from("user_subjects")
                .select("subject_id")
                .eq("user_id", user.id);

            const currentIds = currentSubjects?.map((s) => s.subject_id) || [];
            const selectedIds = subjectSelections.map((s) => s.subjectId);

            // Add new
            const toAdd = selectedIds.filter((id) => !currentIds.includes(id));
            if (toAdd.length > 0) {
                await supabase.from("user_subjects").insert(
                    toAdd.map((subjectId) => {
                        const sel = subjectSelections.find((s) => s.subjectId === subjectId);
                        return {
                            user_id: user.id,
                            subject_id: subjectId,
                            exam_board: sel?.examBoard || null,
                        };
                    })
                );
            }

            // Update exam boards for existing subjects
            const toUpdate = selectedIds.filter((id) => currentIds.includes(id));
            for (const subjectId of toUpdate) {
                const sel = subjectSelections.find((s) => s.subjectId === subjectId);
                if (sel) {
                    await supabase
                        .from("user_subjects")
                        .update({ exam_board: sel.examBoard || null })
                        .eq("user_id", user.id)
                        .eq("subject_id", subjectId);
                }
            }

            // Remove deselected
            const toRemove = currentIds.filter((id) => !selectedIds.includes(id));
            if (toRemove.length > 0) {
                await supabase
                    .from("user_subjects")
                    .delete()
                    .eq("user_id", user.id)
                    .in("subject_id", toRemove);
            }

            toast.success(isPrimaryMode ? "Saved! 🎉" : "Profile updated");
        } catch (error) {
            console.error("Error saving profile:", error);
            toast.error("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const TierIcon = TIER_INFO[tier].icon;

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
                <div className="container flex h-14 items-center gap-2 px-4">
                    <Link
                        href="/dashboard"
                        className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <span className="text-lg font-bold">Profile</span>
                </div>
            </header>

            <main className="container space-y-6 px-4 py-6">
                {/* Profile Info */}
                <section className="rounded-xl border border-border bg-card p-5">
                    <h2 className="mb-4 flex items-center gap-2 font-semibold">
                        <User className="h-5 w-5" />
                        {isPrimaryMode ? "About You" : "Profile Information"}
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-muted-foreground">
                                {isPrimaryMode ? "Your Name" : "Display Name"}
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Enter your name"
                                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-muted-foreground">
                                Year Group
                            </label>
                            <select
                                value={yearGroup || ""}
                                onChange={(e) => setYearGroup(e.target.value || null)}
                                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="">Select your year group</option>
                                {YEAR_GROUPS.map((year) => (
                                    <option key={year.label} value={year.label}>
                                        {year.label} ({year.keyStage})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-muted-foreground">
                                Email
                            </label>
                            <p className="text-sm text-foreground">
                                {profile?.email || user?.email}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Avatar Color */}
                <section className="rounded-xl border border-border bg-card p-5">
                    <h2 className="mb-4 flex items-center gap-2 font-semibold">
                        <User className="h-5 w-5" />
                        {isPrimaryMode ? "Your Avatar Colour 🎨" : "Avatar Colour"}
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        {AVATAR_COLORS.map((colour) => {
                            const initial = (displayName || "?")[0].toUpperCase();
                            const isSelected = avatarColor === colour.id;
                            return (
                                <button
                                    key={colour.id}
                                    onClick={() => setAvatarColor(colour.id)}
                                    className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white transition-all ${colour.bg
                                        } ${isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110" : "opacity-60 hover:opacity-100"}`}
                                    title={colour.label}
                                >
                                    {initial}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Subscription */}
                <section className="rounded-xl border border-border bg-card p-5">
                    <h2 className="mb-4 flex items-center gap-2 font-semibold">
                        <CreditCard className="h-5 w-5" />
                        {isPrimaryMode ? "Your Plan 🌟" : "Subscription"}
                    </h2>
                    {subLoading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground">Loading...</span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <TierIcon
                                    className={`h-6 w-6 ${TIER_INFO[tier].color}`}
                                />
                                <div>
                                    <p className="text-lg font-semibold">
                                        {TIER_INFO[tier].name} Plan
                                    </p>
                                    {internalTrialActive && !subscribed && (
                                        <p className="text-sm text-muted-foreground">
                                            Free trial{" "}
                                            {internalTrialEnd
                                                ? `ends ${new Date(internalTrialEnd).toLocaleDateString()}`
                                                : "active"}
                                        </p>
                                    )}
                                    {subscribed && subscriptionEnd && !isTrialing && (
                                        <p className="text-sm text-muted-foreground">
                                            Renews {new Date(subscriptionEnd).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <Link
                                href="/subscription"
                                className="block w-full rounded-lg border border-border py-2.5 text-center text-sm font-medium transition-colors hover:bg-muted"
                            >
                                {subscribed
                                    ? "Manage Subscription"
                                    : internalTrialActive
                                        ? "Subscribe Now"
                                        : "Upgrade Plan"}
                            </Link>
                        </div>
                    )}
                </section>

                {/* Quick Links */}
                <section className="rounded-xl border border-border bg-card p-5">
                    <h2 className="mb-4 flex items-center gap-2 font-semibold">
                        <Flame className="h-5 w-5 text-orange-500" />
                        {isPrimaryMode ? "Your Activity 🔥" : "Activity & Streaks"}
                    </h2>
                    <div className="space-y-2">
                        <Link
                            href="/leaderboard"
                            className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 transition-colors hover:bg-primary/10"
                        >
                            <div className="rounded-lg bg-primary/20 p-2">
                                <Trophy className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">
                                    {isPrimaryMode ? "Leaderboard 🏆" : "Weekly Leaderboard"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {isPrimaryMode
                                        ? "See how you rank!"
                                        : "Compete with other learners"}
                                </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </Link>
                    </div>
                </section>

                {/* Subject Selection */}
                <section className="rounded-xl border border-border bg-card p-5">
                    <h2 className="mb-4 flex items-center gap-2 font-semibold">
                        <BookOpen className="h-5 w-5" />
                        {isPrimaryMode ? "Your Subjects 📚" : "My Subjects"}
                    </h2>

                    {/* Exam board reminder */}
                    {(() => {
                        const missing = subjectSelections.filter(s => !s.examBoard);
                        if (missing.length === 0) return null;
                        const missingNames = missing
                            .map(m => subjects.find(s => s.id === m.subjectId)?.name)
                            .filter(Boolean);
                        return (
                            <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                                <div className="text-sm">
                                    <p className="font-medium text-amber-700 dark:text-amber-400">
                                        {isPrimaryMode
                                            ? "Pick your exam boards! 📝"
                                            : "Exam boards not set"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Set exam boards for {missingNames.join(", ")} to get the right
                                        questions for your syllabus.
                                    </p>
                                </div>
                            </div>
                        );
                    })()}

                    <p className="mb-3 text-sm text-muted-foreground">
                        {isPrimaryMode
                            ? "Pick the subjects you want to learn!"
                            : "Select the subjects you're studying to personalise your dashboard"}
                    </p>

                    {/* Subject search */}
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={subjectSearch}
                            onChange={e => setSubjectSearch(e.target.value)}
                            placeholder={isPrimaryMode ? "Search subjects..." : "Filter subjects"}
                            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                    <div className="space-y-2">
                        {subjects
                            .filter(s => !subjectSearch || s.name.toLowerCase().includes(subjectSearch.toLowerCase()))
                            .map((subject) => {
                                const selection = subjectSelections.find(
                                    (s) => s.subjectId === subject.id
                                );
                                const isSelected = !!selection;
                                return (
                                    <div key={subject.id}>
                                        <label
                                            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${isSelected
                                                ? "border-primary bg-primary/10"
                                                : "border-border bg-card hover:bg-muted/50"
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSubject(subject.id)}
                                                className="h-4 w-4 rounded border-border text-primary accent-primary"
                                            />
                                            <span className="flex-1 font-medium">
                                                {subject.icon && (
                                                    <span className="mr-1.5">{subject.icon}</span>
                                                )}
                                                {subject.name}
                                            </span>
                                        </label>
                                        {/* Exam board selector */}
                                        {isSelected && (
                                            <div className="ml-7 mt-1 mb-2">
                                                <select
                                                    value={selection?.examBoard || ""}
                                                    onChange={(e) => {
                                                        const board = e.target.value || null;
                                                        setSubjectSelections((prev) =>
                                                            prev.map((s) =>
                                                                s.subjectId === subject.id
                                                                    ? { ...s, examBoard: board }
                                                                    : s
                                                            )
                                                        );
                                                    }}
                                                    className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                                >
                                                    <option value="">Select exam board</option>
                                                    {EXAM_BOARDS.map((board) => (
                                                        <option key={board} value={board}>
                                                            {board}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                    </div>
                    {subjects.length === 0 && (
                        <p className="py-4 text-center text-muted-foreground">
                            No subjects available for your year group
                        </p>
                    )}
                </section>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                    <Save className="h-4 w-4" />
                    {saving
                        ? "Saving..."
                        : isPrimaryMode
                            ? "Save Changes! ✨"
                            : "Save Changes"}
                </button>
            </main>
        </div>
    );
}
