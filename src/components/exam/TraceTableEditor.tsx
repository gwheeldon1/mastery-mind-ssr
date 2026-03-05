"use client";

/**
 * TraceTableEditor — Grid editor for tracing algorithm execution.
 * Parses column headers from question text and provides editable cells.
 */

import { useState, useEffect } from "react";

interface TraceTableEditorProps {
    questionText: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

interface TableStructure {
    headers: string[];
    rows: number;
}

function parseTraceTable(questionText: string): TableStructure | null {
    // Try markdown table
    const tableMatch = questionText.match(/\|([^\n]+)\|\n\|[\s\-|]+\|\n((?:\|[^\n]*\|\n?)*)/);
    if (tableMatch) {
        const headers = tableMatch[1].split("|").map((h) => h.trim()).filter(Boolean);
        const bodyRows = tableMatch[2].trim().split("\n").filter((r) => r.includes("|"));
        return { headers, rows: bodyRows.length || 6 };
    }

    // Try hint text: "columns for: i, item, total, OUTPUT"
    const hintMatch = questionText.match(/columns for:\s*([^*\n]+)/i);
    if (hintMatch) {
        const headers = hintMatch[1].split(",").map((h) => h.trim()).filter(Boolean);
        if (headers.length > 0) return { headers, rows: 8 };
    }

    // Try detecting from code
    const codeMatch = questionText.match(/```[\s\S]*?```/);
    if (codeMatch && questionText.toLowerCase().includes("trace")) {
        const code = codeMatch[0];
        const headers: string[] = [];
        const loopVar = code.match(/FOR\s+(\w+)\s+FROM/i)?.[1];
        if (loopVar) headers.push(loopVar);
        for (const match of code.matchAll(/DECLARE\s+(\w+)/gi)) {
            if (!headers.includes(match[1])) headers.push(match[1]);
        }
        if (/OUTPUT/i.test(code) && !headers.includes("OUTPUT")) headers.push("OUTPUT");
        if (headers.length > 0) return { headers, rows: 8 };
    }

    return null;
}

function serializeTable(headers: string[], data: string[][]): string {
    return JSON.stringify(
        data.map((row) => {
            const obj: Record<string, string> = {};
            headers.forEach((h, j) => { obj[h] = row[j] || ""; });
            return obj;
        }),
        null,
        2
    );
}

function parseTableData(value: string, headers: string[], rows: number): string[][] {
    if (!value) return Array(rows).fill(null).map(() => Array(headers.length).fill(""));
    try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.map((row: any) => headers.map((h) => row[h] || ""));
    } catch { /* ignore */ }
    return Array(rows).fill(null).map(() => Array(headers.length).fill(""));
}

export function TraceTableEditor({ questionText, value, onChange, disabled = false }: TraceTableEditorProps) {
    const tableStructure = parseTraceTable(questionText);

    const [tableData, setTableData] = useState<string[][]>(() => {
        if (!tableStructure) return [];
        return parseTableData(value, tableStructure.headers, tableStructure.rows);
    });

    useEffect(() => {
        if (tableStructure) {
            const serialized = serializeTable(tableStructure.headers, tableData);
            if (serialized !== value) onChange(serialized);
        }
    }, [tableData]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!tableStructure) {
        return <p className="py-4 text-center text-sm text-muted-foreground">No trace table detected in question.</p>;
    }

    const handleCellChange = (row: number, col: number, val: string) => {
        setTableData((prev) =>
            prev.map((r, i) => (i === row ? r.map((c, j) => (j === col ? val : c)) : [...r]))
        );
    };

    return (
        <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
                Fill in the trace table below. Each cell represents the value at that point.
            </p>
            <div className="overflow-auto rounded-xl border border-border">
                <table className="w-full">
                    <thead>
                        <tr className="bg-muted/50">
                            {tableStructure.headers.map((h, i) => (
                                <th key={i} className="min-w-[80px] border-b border-border px-3 py-2 text-center font-mono text-xs font-semibold">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.map((row, rowIdx) => (
                            <tr key={rowIdx} className="border-b border-border last:border-b-0">
                                {row.map((cell, colIdx) => (
                                    <td key={colIdx} className="p-1">
                                        <input
                                            value={cell}
                                            onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                                            disabled={disabled}
                                            className="h-8 w-full rounded border-0 bg-transparent text-center font-mono text-sm focus:bg-primary/5 focus:outline-none"
                                            placeholder="—"
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="text-xs text-muted-foreground">
                Tip: Use &ldquo;—&rdquo; or leave blank for unchanged values.
            </p>
        </div>
    );
}
