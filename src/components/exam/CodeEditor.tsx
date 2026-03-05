"use client";

/**
 * CodeEditor — Tabbed editor for code-writing, pseudocode, SQL, debug, and output questions.
 * Tab key inserts indentation. Tracks code, output, and explanation.
 */

import { useState, useEffect, useRef } from "react";

interface CodeEditorProps {
    questionType: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

interface CodeResponse {
    code: string;
    explanation: string;
    output?: string;
}

function getEditorConfig(questionType: string) {
    const type = questionType.toUpperCase();
    switch (type) {
        case "CODE_WRITING":
        case "PSEUDOCODE_WRITING":
            return {
                placeholder: `Write your ${type === "PSEUDOCODE_WRITING" ? "pseudocode" : "code"} here...`,
                showOutput: false,
                showExplanation: true,
                codeLabel: type === "PSEUDOCODE_WRITING" ? "Pseudocode" : "Code",
            };
        case "SQL_QUERY":
            return { placeholder: "Write your SQL query here...", showOutput: true, showExplanation: true, codeLabel: "SQL Query" };
        case "DEBUG_CODE":
            return { placeholder: "Write the corrected code here...", showOutput: false, showExplanation: true, codeLabel: "Corrected Code" };
        case "CODE_OUTPUT":
            return { placeholder: "What will this code output?", showOutput: true, showExplanation: true, codeLabel: "Predicted Output" };
        default:
            return { placeholder: "Write your answer here...", showOutput: false, showExplanation: true, codeLabel: "Code" };
    }
}

export function CodeEditor({ questionType, value, onChange, disabled = false }: CodeEditorProps) {
    const config = getEditorConfig(questionType);
    const [activeTab, setActiveTab] = useState(questionType.toUpperCase() === "CODE_OUTPUT" ? "output" : "code");

    const [data, setData] = useState<CodeResponse>(() => {
        try {
            return value ? JSON.parse(value) : { code: "", explanation: "", output: "" };
        } catch {
            return { code: value || "", explanation: "", output: "" };
        }
    });

    const onChangeRef = useRef(onChange);
    useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
    useEffect(() => { onChangeRef.current(JSON.stringify(data, null, 2)); }, [data]);

    const updateField = (field: keyof CodeResponse, val: string) => {
        setData((prev) => ({ ...prev, [field]: val }));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Tab") {
            e.preventDefault();
            const target = e.target as HTMLTextAreaElement;
            const start = target.selectionStart;
            const end = target.selectionEnd;
            const newVal = data.code.substring(0, start) + "    " + data.code.substring(end);
            updateField("code", newVal);
            setTimeout(() => { target.selectionStart = target.selectionEnd = start + 4; }, 0);
        }
    };

    const tabs = [
        { id: "code", label: config.codeLabel },
        ...(config.showOutput ? [{ id: "output", label: "Output" }] : []),
        ...(config.showExplanation ? [{ id: "explain", label: "Explanation" }] : []),
    ];

    return (
        <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
                {questionType.toUpperCase() === "CODE_OUTPUT"
                    ? "Predict what the code will output."
                    : "Write your code using proper syntax. Press Tab for indentation."}
            </p>

            {/* Tabs */}
            <div className="flex gap-1 rounded-lg bg-muted p-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === tab.id
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {activeTab === "code" && (
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{config.codeLabel}</span>
                        <span className="text-xs text-muted-foreground">{data.code.split("\n").length} lines</span>
                    </div>
                    <textarea
                        value={data.code}
                        onChange={(e) => updateField("code", e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={disabled}
                        placeholder={config.placeholder}
                        className="min-h-[200px] w-full resize-none rounded-xl border border-border bg-background p-4 font-mono text-sm leading-relaxed focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        spellCheck={false}
                    />
                </div>
            )}

            {activeTab === "output" && config.showOutput && (
                <textarea
                    value={data.output || ""}
                    onChange={(e) => updateField("output", e.target.value)}
                    disabled={disabled}
                    placeholder="Enter the expected output here..."
                    className="min-h-[200px] w-full resize-none rounded-xl border border-border bg-muted/30 p-4 font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    spellCheck={false}
                />
            )}

            {activeTab === "explain" && config.showExplanation && (
                <textarea
                    value={data.explanation}
                    onChange={(e) => updateField("explanation", e.target.value)}
                    disabled={disabled}
                    placeholder="Explain your approach and any key decisions..."
                    className="min-h-[150px] w-full resize-none rounded-xl border border-border bg-background p-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
            )}
        </div>
    );
}
