"use client";

/**
 * SocraticTutor — AI guided-discovery chat for quiz questions.
 * After answering wrong, students can explore the concept with Socratic questioning.
 * Calls socratic-tutor edge function with question context.
 */

import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Loader2, Lightbulb, AlertCircle, X } from "lucide-react";

interface SocraticTutorProps {
    questionText: string;
    correctAnswer: string;
    explanation: string;
    conceptTag?: string;
    subject?: string;
    topic?: string;
    onClose: () => void;
    yearGroup?: string;
}

interface Message {
    role: "user" | "tutor";
    content: string;
}

const MAX_HINTS = 5;

export function SocraticTutor({
    questionText,
    correctAnswer,
    explanation,
    conceptTag,
    subject,
    topic,
    onClose,
    yearGroup,
}: SocraticTutorProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [hintCount, setHintCount] = useState(0);
    const [answerRevealed, setAnswerRevealed] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    useEffect(() => {
        setMessages([
            {
                role: "tutor",
                content: "I'm here to guide you through this question. What's your initial thinking about how to approach it?",
            },
        ]);
    }, []);

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading || answerRevealed) return;
        const userMsg: Message = { role: "user", content: inputValue.trim() };
        setMessages((prev) => [...prev, userMsg]);
        setInputValue("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/ai/socratic", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    questionText,
                    correctAnswer,
                    explanation,
                    conceptTag,
                    subject,
                    topic,
                    studentMessage: userMsg.content,
                    conversationHistory: messages,
                    hintCount,
                    yearGroup,
                }),
            });

            if (!res.ok) throw new Error(`API error: ${res.status}`);

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            if (!reader) throw new Error("No response body");

            // Add streaming placeholder
            setMessages((prev) => [...prev, { role: "tutor", content: "" }]);

            let accumulated = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                accumulated += decoder.decode(value, { stream: true });
                const current = accumulated;
                setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: "tutor", content: current };
                    return updated;
                });
            }

            setHintCount((prev) => prev + 1);
            if (hintCount >= MAX_HINTS - 1) setAnswerRevealed(true);
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: "tutor", content: "I'm having trouble connecting right now. Try again in a moment!" },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-2 z-50 flex flex-col overflow-hidden rounded-2xl border border-primary/20 bg-background shadow-2xl sm:inset-auto sm:bottom-4 sm:right-4 sm:h-[500px] sm:w-[380px]">
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-primary/5 px-4 py-3">
                <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Guided Discovery 🧠</span>
                    <span className="text-xs text-muted-foreground">{hintCount}/{MAX_HINTS}</span>
                </div>
                <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted">
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Question context */}
            <div className="border-b bg-muted/30 px-4 py-2">
                <p className="text-[10px] font-medium uppercase text-muted-foreground">Working on:</p>
                <p className="line-clamp-2 text-xs">{questionText}</p>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
                <div className="space-y-3">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div
                                className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                                    }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="rounded-xl bg-muted px-3 py-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Answer revealed */}
            {answerRevealed && (
                <div className="flex items-center gap-2 border-t bg-green-500/10 px-4 py-2 text-xs font-medium text-green-600">
                    <Lightbulb className="h-3.5 w-3.5" />
                    Great effort! Check the explanation for the full answer.
                </div>
            )}

            {/* Hint warning */}
            {hintCount >= MAX_HINTS - 2 && !answerRevealed && (
                <div className="flex items-center gap-2 border-t bg-yellow-500/10 px-4 py-1.5 text-[11px] text-yellow-600">
                    <AlertCircle className="h-3 w-3" />
                    {MAX_HINTS - hintCount} hint{MAX_HINTS - hintCount !== 1 ? "s" : ""} remaining
                </div>
            )}

            {/* Input */}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                }}
                className="flex gap-2 border-t p-3"
            >
                <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={answerRevealed ? "Session complete!" : "Share your thinking..."}
                    disabled={isLoading || answerRevealed}
                    className="min-h-[44px] max-h-[80px] flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:opacity-50"
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                />
                <button
                    type="submit"
                    disabled={!inputValue.trim() || isLoading || answerRevealed}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
            </form>
        </div>
    );
}
