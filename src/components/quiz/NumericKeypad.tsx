"use client";

/**
 * NumericKeypad — Touch-friendly calculator input for STEM questions.
 * Decimal, negative, and fraction support.
 */

import { useState, useCallback } from "react";
import { Delete, Divide, Check } from "lucide-react";

interface NumericKeypadProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit?: () => void;
    disabled?: boolean;
    allowFractions?: boolean;
    allowNegative?: boolean;
    allowDecimal?: boolean;
    placeholder?: string;
}

export function NumericKeypad({
    value,
    onChange,
    onSubmit,
    disabled = false,
    allowFractions = true,
    allowNegative = true,
    allowDecimal = true,
    placeholder = "Enter your answer",
}: NumericKeypadProps) {
    const [mode, setMode] = useState<"normal" | "fraction">("normal");

    const handlePress = useCallback(
        (key: string) => {
            if (disabled) return;
            switch (key) {
                case "DEL":
                    onChange(value.slice(0, -1));
                    break;
                case "CLR":
                    onChange("");
                    setMode("normal");
                    break;
                case "±":
                    if (value.startsWith("-")) onChange(value.slice(1));
                    else onChange("-" + (value || ""));
                    break;
                case "/":
                    if (allowFractions && !value.includes("/")) {
                        onChange(value + "/");
                        setMode("fraction");
                    }
                    break;
                case ".":
                    if (allowDecimal) {
                        if (mode === "fraction") {
                            const parts = value.split("/");
                            if (parts.length === 2 && !parts[1].includes(".")) onChange(value + ".");
                        } else if (!value.includes(".")) {
                            onChange(value + ".");
                        }
                    }
                    break;
                default:
                    onChange(value + key);
            }
        },
        [value, onChange, disabled, allowFractions, allowDecimal, mode]
    );

    const keys = [
        ["7", "8", "9"],
        ["4", "5", "6"],
        ["1", "2", "3"],
        ["0", ".", "DEL"],
    ];

    return (
        <div className="space-y-3">
            {/* Display */}
            <div
                className={`flex h-14 items-center justify-end rounded-xl border-2 bg-background px-4 text-right font-mono text-2xl font-bold ${disabled ? "bg-muted text-muted-foreground" : "border-border"
                    }`}
            >
                {value || <span className="text-lg text-muted-foreground">{placeholder}</span>}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-4 gap-1.5">
                {/* Number keys */}
                <div className="col-span-3 grid grid-cols-3 gap-1.5">
                    {keys.flat().map((key) => (
                        <button
                            key={key}
                            onClick={() => handlePress(key)}
                            disabled={disabled}
                            className={`flex h-12 items-center justify-center rounded-lg text-lg font-semibold transition-colors ${key === "DEL"
                                    ? "border border-border bg-card hover:bg-muted"
                                    : "bg-muted hover:bg-muted/80"
                                } disabled:opacity-50`}
                        >
                            {key === "DEL" ? <Delete className="h-5 w-5" /> : key}
                        </button>
                    ))}
                </div>

                {/* Side column */}
                <div className="flex flex-col gap-1.5">
                    {allowNegative && (
                        <button
                            onClick={() => handlePress("±")}
                            disabled={disabled}
                            className="flex flex-1 items-center justify-center rounded-lg border border-border bg-card text-lg font-semibold hover:bg-muted disabled:opacity-50"
                        >
                            ±
                        </button>
                    )}
                    {allowFractions && (
                        <button
                            onClick={() => handlePress("/")}
                            disabled={disabled || value.includes("/")}
                            className={`flex flex-1 items-center justify-center rounded-lg text-lg font-semibold disabled:opacity-50 ${mode === "fraction"
                                    ? "bg-primary text-primary-foreground"
                                    : "border border-border bg-card hover:bg-muted"
                                }`}
                        >
                            <Divide className="h-5 w-5" />
                        </button>
                    )}
                    <button
                        onClick={() => handlePress("CLR")}
                        disabled={disabled || !value}
                        className="flex flex-1 items-center justify-center rounded-lg border border-border bg-card text-xs font-medium hover:bg-muted disabled:opacity-50"
                    >
                        CLR
                    </button>
                    {onSubmit && (
                        <button
                            onClick={onSubmit}
                            disabled={disabled || !value}
                            className="flex flex-1 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
                        >
                            <Check className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Fraction indicator */}
            {mode === "fraction" && value.includes("/") && (
                <p className="text-center text-xs text-muted-foreground">
                    Entering fraction: {value.split("/")[0] || "?"} ÷ {value.split("/")[1] || "?"}
                </p>
            )}
        </div>
    );
}
