"use client";

/**
 * ExamMetadataSelector — Subject/board/paper picker for exam setup.
 * Pre-populates qualification from user profile.
 */

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserProfile } from "@/contexts/user-profile-context";
import { Loader2, BookOpen } from "lucide-react";

export interface ExamMetadata {
    subject_id: string;
    subject_name: string;
    exam_board: string;
    qualification_level: string;
    year_group: string;
    paper_year?: number;
    paper_number?: string;
}

interface ExamMetadataSelectorProps {
    onConfirm: (metadata: ExamMetadata) => void;
    onCancel: () => void;
}

interface SubjectOption {
    id: string;
    name: string;
}

const EXAM_BOARDS = ["AQA", "Edexcel", "OCR", "WJEC", "Eduqas"];
const LEVELS = [
    { value: "GCSE", label: "GCSE" },
    { value: "iGCSE", label: "iGCSE" },
    { value: "A-Level", label: "A-Level" },
];

export function ExamMetadataSelector({ onConfirm, onCancel }: ExamMetadataSelectorProps) {
    const { profile } = useUserProfile();
    const supabase = createClient();
    const [subjects, setSubjects] = useState<SubjectOption[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedSubject, setSelectedSubject] = useState<SubjectOption | null>(null);
    const [examBoard, setExamBoard] = useState("");
    const [qualificationLevel, setQualificationLevel] = useState("GCSE");
    const [paperYear, setPaperYear] = useState("");
    const [paperNumber, setPaperNumber] = useState("");

    useEffect(() => {
        async function fetchSubjects() {
            setLoading(true);
            const { data } = await supabase.from("subjects").select("id, name").order("name");
            if (data) {
                const unique = data.filter((s, i, self) => i === self.findIndex((t) => t.name === s.name));
                setSubjects(unique.map((s) => ({ id: s.id, name: s.name })));
            }
            setLoading(false);
        }
        fetchSubjects();
    }, [supabase]);

    useEffect(() => {
        if (profile?.year_group) {
            if (profile.year_group.includes("12") || profile.year_group.includes("13")) {
                setQualificationLevel("A-Level");
            }
        }
    }, [profile?.year_group]);

    const isValid = selectedSubject && examBoard && qualificationLevel;

    const handleConfirm = () => {
        if (!isValid || !selectedSubject) return;
        const defaultYearGroup =
            qualificationLevel === "GCSE" || qualificationLevel === "iGCSE" ? "Year 11" : "Year 13";

        onConfirm({
            subject_id: selectedSubject.id,
            subject_name: selectedSubject.name,
            exam_board: examBoard,
            qualification_level: qualificationLevel,
            year_group: defaultYearGroup,
            paper_year: paperYear ? parseInt(paperYear, 10) : undefined,
            paper_number: paperNumber || undefined,
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="text-center">
                <h2 className="text-lg font-semibold">Exam Details</h2>
                <p className="text-sm text-muted-foreground">Tell us about the exam paper</p>
            </div>

            <div className="space-y-4">
                {/* Subject */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Subject</label>
                    <select
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
                        value={selectedSubject?.id || ""}
                        onChange={(e) => {
                            const s = subjects.find((s) => s.id === e.target.value);
                            setSelectedSubject(s || null);
                        }}
                    >
                        <option value="">Select a subject</option>
                        {subjects.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>

                {/* Exam Board */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Exam Board</label>
                    <select
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
                        value={examBoard}
                        onChange={(e) => setExamBoard(e.target.value)}
                    >
                        <option value="">Select exam board</option>
                        {EXAM_BOARDS.map((b) => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>
                </div>

                {/* Qualification */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Qualification</label>
                    <select
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
                        value={qualificationLevel}
                        onChange={(e) => setQualificationLevel(e.target.value)}
                    >
                        {LEVELS.map((l) => (
                            <option key={l.value} value={l.value}>{l.label}</option>
                        ))}
                    </select>
                </div>

                {/* Paper Year */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                        Paper Year <span className="text-xs text-muted-foreground">(optional)</span>
                    </label>
                    <input
                        type="number"
                        placeholder="e.g. 2023"
                        value={paperYear}
                        onChange={(e) => setPaperYear(e.target.value)}
                        min={2000}
                        max={2030}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
                    />
                </div>

                {/* Paper Number */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                        Paper Number <span className="text-xs text-muted-foreground">(optional)</span>
                    </label>
                    <select
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
                        value={paperNumber}
                        onChange={(e) => setPaperNumber(e.target.value)}
                    >
                        <option value="">Select paper</option>
                        <option value="Paper 1">Paper 1</option>
                        <option value="Paper 2">Paper 2</option>
                        <option value="Paper 3">Paper 3</option>
                    </select>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    className="flex-1 rounded-xl border border-border py-2.5 text-sm hover:bg-muted"
                >
                    Cancel
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={!isValid}
                    className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                    Continue
                </button>
            </div>
        </div>
    );
}
