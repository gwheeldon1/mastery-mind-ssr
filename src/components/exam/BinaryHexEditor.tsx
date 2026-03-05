"use client";

/**
 * BinaryHexEditor — Converter and input for binary/hex/denary values.
 * For Computer Science questions about number systems.
 */

import { useState, useEffect, useRef } from "react";

interface BinaryHexEditorProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    bits?: number;
}

function toBinary(dec: number, bits: number): string {
    if (isNaN(dec) || dec < 0) return "0".repeat(bits);
    return (dec >>> 0).toString(2).padStart(bits, "0").slice(-bits);
}

function toHex(dec: number): string {
    if (isNaN(dec) || dec < 0) return "0";
    return (dec >>> 0).toString(16).toUpperCase();
}

export function BinaryHexEditor({ value, onChange, disabled = false, bits = 8 }: BinaryHexEditorProps) {
    const [mode, setMode] = useState<"binary" | "denary" | "hex">("binary");
    const [binaryBits, setBinaryBits] = useState<number[]>(() => {
        try {
            const parsed = JSON.parse(value);
            if (parsed?.binary) {
                return parsed.binary.split("").map((b: string) => parseInt(b, 10) || 0);
            }
        } catch { /* ignore */ }
        return Array(bits).fill(0);
    });
    const [denaryInput, setDenaryInput] = useState("");
    const [hexInput, setHexInput] = useState("");

    const denaryValue = binaryBits.reduce((acc, bit, i) => acc + bit * Math.pow(2, bits - 1 - i), 0);

    const onChangeRef = useRef(onChange);
    useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

    useEffect(() => {
        const binary = binaryBits.join("");
        const denary = denaryValue;
        const hex = toHex(denary);
        onChangeRef.current(JSON.stringify({ binary, denary, hex }, null, 2));
    }, [binaryBits, denaryValue]);

    const toggleBit = (index: number) => {
        if (disabled) return;
        setBinaryBits((prev) => prev.map((b, i) => (i === index ? (b === 0 ? 1 : 0) : b)));
    };

    const handleDenaryChange = (val: string) => {
        setDenaryInput(val);
        const num = parseInt(val, 10);
        if (!isNaN(num) && num >= 0 && num < Math.pow(2, bits)) {
            setBinaryBits(toBinary(num, bits).split("").map(Number));
        }
    };

    const handleHexChange = (val: string) => {
        setHexInput(val);
        const num = parseInt(val, 16);
        if (!isNaN(num) && num >= 0 && num < Math.pow(2, bits)) {
            setBinaryBits(toBinary(num, bits).split("").map(Number));
        }
    };

    return (
        <div className="space-y-4">
            {/* Mode tabs */}
            <div className="flex gap-1 rounded-lg bg-muted p-1">
                {(["binary", "denary", "hex"] as const).map((m) => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                            }`}
                    >
                        {m}
                    </button>
                ))}
            </div>

            {/* Binary bit toggles */}
            {mode === "binary" && (
                <div className="space-y-2">
                    <div className="flex justify-center">
                        <div className="flex gap-1.5">
                            {binaryBits.map((bit, i) => (
                                <div key={i} className="text-center">
                                    <p className="mb-0.5 text-[9px] text-muted-foreground">{Math.pow(2, bits - 1 - i)}</p>
                                    <button
                                        onClick={() => toggleBit(i)}
                                        disabled={disabled}
                                        className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold transition-colors ${bit === 1
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted hover:bg-muted/80"
                                            } disabled:opacity-50`}
                                    >
                                        {bit}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Denary input */}
            {mode === "denary" && (
                <input
                    type="number"
                    value={denaryInput || denaryValue}
                    onChange={(e) => handleDenaryChange(e.target.value)}
                    disabled={disabled}
                    min={0}
                    max={Math.pow(2, bits) - 1}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-center font-mono text-lg font-bold focus:border-primary focus:outline-none"
                    placeholder="Enter denary value"
                />
            )}

            {/* Hex input */}
            {mode === "hex" && (
                <input
                    value={hexInput || toHex(denaryValue)}
                    onChange={(e) => handleHexChange(e.target.value)}
                    disabled={disabled}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-center font-mono text-lg font-bold uppercase focus:border-primary focus:outline-none"
                    placeholder="Enter hex value"
                />
            )}

            {/* Conversion display */}
            <div className="flex justify-center gap-4 rounded-xl bg-muted/50 p-3">
                <div className="text-center">
                    <p className="text-[10px] uppercase text-muted-foreground">Binary</p>
                    <p className="font-mono text-sm font-semibold">{binaryBits.join("")}</p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] uppercase text-muted-foreground">Denary</p>
                    <p className="font-mono text-sm font-semibold">{denaryValue}</p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] uppercase text-muted-foreground">Hex</p>
                    <p className="font-mono text-sm font-semibold">{toHex(denaryValue)}</p>
                </div>
            </div>
        </div>
    );
}
