"use client";

/**
 * PastPaperImportModal — Upload past paper PDFs for practice.
 * Shows upload UI, validates file type, and provides status feedback.
 * Actual OCR/parsing happens server-side via edge function.
 */

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Upload, FileText, X, Loader2, CheckCircle2 } from "lucide-react";

interface PastPaperImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    subjectId?: string;
}

type UploadStatus = "idle" | "uploading" | "processing" | "done" | "error";

export function PastPaperImportModal({ isOpen, onClose, subjectId }: PastPaperImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<UploadStatus>("idle");
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    if (!isOpen) return null;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (!selected) return;

        if (selected.type !== "application/pdf") {
            setError("Please upload a PDF file.");
            return;
        }
        if (selected.size > 20 * 1024 * 1024) {
            setError("File must be under 20MB.");
            return;
        }
        setFile(selected);
        setError(null);
    };

    const handleUpload = async () => {
        if (!file) return;
        setStatus("uploading");
        setError(null);

        try {
            const ext = file.name.split(".").pop();
            const path = `past-papers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const { error: uploadError } = await supabase.storage
                .from("uploads")
                .upload(path, file, { contentType: file.type });

            if (uploadError) throw new Error(uploadError.message);

            setStatus("processing");

            // Invoke processing edge function
            const { error: fnError } = await supabase.functions.invoke("process-past-paper", {
                body: { storagePath: path, subjectId },
            });

            if (fnError) throw new Error(fnError.message);

            setStatus("done");
            toast.success("Past paper imported successfully!");
        } catch (err: any) {
            setStatus("error");
            setError(err.message || "Upload failed.");
            toast.error("Failed to import past paper.");
        }
    };

    const handleClose = () => {
        setFile(null);
        setStatus("idle");
        setError(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Import Past Paper</h2>
                    <button onClick={handleClose} className="rounded-lg p-1 hover:bg-muted">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {status === "done" ? (
                    <div className="py-8 text-center">
                        <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-500" />
                        <p className="font-semibold">Import Complete!</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Questions extracted and ready to practice.
                        </p>
                        <button
                            onClick={handleClose}
                            className="mt-4 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Drop zone */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="cursor-pointer rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/50 hover:bg-muted/30"
                        >
                            {file ? (
                                <div className="flex items-center justify-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    <span className="text-sm font-medium">{file.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        ({(file.size / 1024 / 1024).toFixed(1)}MB)
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                                    <p className="text-sm font-medium">Click to select a PDF</p>
                                    <p className="mt-1 text-xs text-muted-foreground">Past papers up to 20MB</p>
                                </>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {error && (
                            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>
                        )}

                        {status === "uploading" || status === "processing" ? (
                            <div className="flex items-center justify-center gap-2 py-4">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                <span className="text-sm">
                                    {status === "uploading" ? "Uploading..." : "Extracting questions..."}
                                </span>
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <button
                                    onClick={handleClose}
                                    className="flex-1 rounded-xl border border-border py-2.5 text-sm hover:bg-muted"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={!file}
                                    className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
                                >
                                    Import
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
