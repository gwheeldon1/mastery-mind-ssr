"use client";

/**
 * DashboardAITutor — Floating AI study companion chat.
 * Premium feature: general study advice, revision planning, exam technique.
 * Uses the socratic-tutor edge function with mode: 'general'.
 */

import { useState, useCallback, useRef, useEffect, memo } from "react";
import { useUserProfile } from "@/contexts/user-profile-context";
import { toast } from "sonner";
import {
    Sparkles,
    Send,
    Loader2,
    Calendar,
    Target,
    Brain,
    BookOpen,
    ClipboardList,
    PenTool,
    FileSearch,
    BarChart3,
    X,
} from "lucide-react";

interface Message {
    role: "user" | "tutor";
    content: string;
    isStreaming?: boolean;
}

const SUBJECTS = [
    "General", "Biology", "Chemistry", "Physics", "Psychology",
    "English Literature", "English Language", "Maths", "History",
    "Geography", "Business Studies", "Computer Science", "Sociology", "Economics",
];

const QUICK_PROMPTS = [
    { label: "Plan my revision schedule", icon: Calendar },
    { label: "What should I focus on?", icon: Target },
    { label: "Explain a concept I'm struggling with", icon: Brain },
    { label: "Study technique tips", icon: BookOpen },
    { label: "Exam technique advice", icon: ClipboardList },
    { label: "Create a practice question", icon: PenTool },
    { label: "Review my revision notes", icon: FileSearch },
    { label: "My weakest topics", icon: BarChart3 },
];

export const DashboardAITutor = memo(function DashboardAITutor() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState("General");
    const scrollRef = useRef<HTMLDivElement>(null);
    const { profile } = useUserProfile();

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    const sendMessage = useCallback(
        async (content: string) => {
            if (!content.trim() || isLoading) return;
            setInputValue("");
            setIsLoading(true);

            setMessages((prev) => [
                ...prev,
                { role: "user", content },
                { role: "tutor", content: "", isStreaming: true },
            ]);

            try {
                const res = await fetch("/api/ai/tutor", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        mode: "general",
                        subject: selectedSubject !== "General" ? selectedSubject : undefined,
                        studentMessage: content,
                        conversationHistory: messages.slice(-20).map((m) => ({
                            role: m.role === "user" ? "user" : "tutor",
                            content: m.content,
                        })),
                        yearGroup: profile?.year_group || undefined,
                    }),
                });

                if (!res.ok) throw new Error(`API error: ${res.status}`);

                const reader = res.body?.getReader();
                const decoder = new TextDecoder();

                if (!reader) throw new Error("No response body");

                let accumulated = "";
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    accumulated += decoder.decode(value, { stream: true });
                    const current = accumulated;
                    setMessages((prev) => {
                        const updated = [...prev];
                        const last = updated[updated.length - 1];
                        if (last?.isStreaming) {
                            updated[updated.length - 1] = {
                                role: "tutor",
                                content: current,
                                isStreaming: true,
                            };
                        }
                        return updated;
                    });
                }

                // Finalize — remove streaming flag
                setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last?.isStreaming) {
                        updated[updated.length - 1] = {
                            role: "tutor",
                            content: accumulated || "I'm your AI study companion! What would you like help with?",
                        };
                    }
                    return updated;
                });
            } catch (err: any) {
                if (err?.status === 429) toast.error("Please wait a moment before asking another question.");
                else toast.error("Unable to get help right now. Please try again.");
                setMessages((prev) => prev.filter((m) => !m.isStreaming));
            } finally {
                setIsLoading(false);
            }
        },
        [messages, isLoading, selectedSubject, profile?.year_group]
    );

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-xl transition-all hover:scale-110 active:scale-95"
                aria-label="Open AI Study Tutor"
            >
                <Sparkles className="h-6 w-6 text-primary-foreground" />
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex h-[500px] w-[360px] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">AI Study Tutor</span>
                    <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">Premium</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="rounded-lg p-1 hover:bg-muted">
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Subject selector */}
            <div className="border-b border-border px-4 py-2">
                <select
                    className="w-full rounded-lg border-0 bg-muted px-2 py-1 text-xs focus:outline-none"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                >
                    {SUBJECTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
                {messages.length === 0 ? (
                    <div className="space-y-4">
                        <div className="py-4 text-center">
                            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                <Sparkles className="h-5 w-5 text-primary" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                I&apos;m your AI study companion. Ask me anything!
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                            {QUICK_PROMPTS.map((p, i) => {
                                const Icon = p.icon;
                                return (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(p.label)}
                                        disabled={isLoading}
                                        className="flex items-center gap-1.5 rounded-lg border border-border px-2 py-2 text-left text-[11px] hover:bg-muted disabled:opacity-50"
                                    >
                                        <Icon className="h-3 w-3 shrink-0" />
                                        <span className="truncate">{p.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div
                                    className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${msg.role === "user"
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted"
                                        }`}
                                >
                                    {msg.isStreaming ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
                                        </span>
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                            </div>
                        ))}
                        {messages.length > 0 && !isLoading && (
                            <div className="flex justify-center pt-1">
                                <button
                                    onClick={() => setMessages([])}
                                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-3 w-3" /> Clear chat
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Input */}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage(inputValue);
                }}
                className="flex gap-2 border-t border-border p-3"
            >
                <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask anything study-related..."
                    className="min-h-[40px] max-h-[80px] flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    disabled={isLoading}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage(inputValue);
                        }
                    }}
                />
                <button
                    type="submit"
                    disabled={!inputValue.trim() || isLoading}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
            </form>
        </div>
    );
});
