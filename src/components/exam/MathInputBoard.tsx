"use client";

/**
 * MathInputBoard — On-screen panel with math symbol buttons for STEM answers.
 * Inserts special characters (fractions, powers, roots, Greek letters) into an answer field.
 */

import { useState } from "react";

interface MathInputBoardProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

const SYMBOL_GROUPS = [
    {
        label: "Operations",
        symbols: ["×", "÷", "±", "≠", "≈", "∞", "∝"],
    },
    {
        label: "Comparison",
        symbols: ["≤", "≥", "≪", "≫"],
    },
    {
        label: "Powers & Roots",
        symbols: ["²", "³", "⁴", "√", "∛", "ⁿ"],
    },
    {
        label: "Fractions",
        symbols: ["½", "⅓", "¼", "⅕", "⅛", "⅔", "¾"],
    },
    {
        label: "Greek",
        symbols: ["α", "β", "γ", "δ", "θ", "λ", "μ", "π", "σ", "ω", "Δ", "Σ", "Ω"],
    },
    {
        label: "Calculus",
        symbols: ["∫", "∂", "∑", "∏", "∇", "→", "⇒"],
    },
    {
        label: "Sets",
        symbols: ["∈", "∉", "∪", "∩", "⊂", "∅", "ℝ", "ℤ", "ℕ"],
    },
    {
        label: "Units",
        symbols: ["°", "′", "″", "Å", "µ"],
    },
];

export function MathInputBoard({ value, onChange, disabled = false }: MathInputBoardProps) {
    const [activeGroup, setActiveGroup] = useState(0);

    const insertSymbol = (symbol: string) => {
        if (disabled) return;
        onChange(value + symbol);
    };

    return (
        <div className="space-y-3">
            {/* Text input */}
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder="Type your answer or use the symbol buttons below..."
                className="min-h-[100px] w-full resize-none rounded-xl border border-border bg-background p-3 font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />

            {/* Group tabs */}
            <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1 scrollbar-hide">
                {SYMBOL_GROUPS.map((group, i) => (
                    <button
                        key={group.label}
                        onClick={() => setActiveGroup(i)}
                        className={`shrink-0 rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors ${activeGroup === i
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {group.label}
                    </button>
                ))}
            </div>

            {/* Symbol buttons */}
            <div className="flex flex-wrap gap-1.5">
                {SYMBOL_GROUPS[activeGroup].symbols.map((sym) => (
                    <button
                        key={sym}
                        onClick={() => insertSymbol(sym)}
                        disabled={disabled}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-lg font-medium transition-colors hover:bg-muted disabled:opacity-50"
                    >
                        {sym}
                    </button>
                ))}
            </div>
        </div>
    );
}
