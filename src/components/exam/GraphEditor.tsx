"use client";

/**
 * GraphEditor — Canvas-based graph input for math/science questions.
 * Students plot points and draw lines on a coordinate grid.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { RotateCcw, Minus, Plus } from "lucide-react";

interface Point {
    x: number;
    y: number;
}

interface GraphEditorProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    xRange?: [number, number];
    yRange?: [number, number];
    gridStep?: number;
}

export function GraphEditor({
    value,
    onChange,
    disabled = false,
    xRange = [-10, 10],
    yRange = [-10, 10],
    gridStep = 1,
}: GraphEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [points, setPoints] = useState<Point[]>(() => {
        try {
            return value ? JSON.parse(value) : [];
        } catch {
            return [];
        }
    });
    const [scale, setScale] = useState(20); // pixels per unit

    const width = 360;
    const height = 360;
    const cx = width / 2;
    const cy = height / 2;

    const drawGrid = useCallback(
        (ctx: CanvasRenderingContext2D) => {
            ctx.clearRect(0, 0, width, height);

            // Grid lines
            ctx.strokeStyle = "rgba(128,128,128,0.15)";
            ctx.lineWidth = 1;
            for (let x = xRange[0]; x <= xRange[1]; x += gridStep) {
                const px = cx + x * scale;
                ctx.beginPath();
                ctx.moveTo(px, 0);
                ctx.lineTo(px, height);
                ctx.stroke();
            }
            for (let y = yRange[0]; y <= yRange[1]; y += gridStep) {
                const py = cy - y * scale;
                ctx.beginPath();
                ctx.moveTo(0, py);
                ctx.lineTo(width, py);
                ctx.stroke();
            }

            // Axes
            ctx.strokeStyle = "rgba(128,128,128,0.6)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, cy);
            ctx.lineTo(width, cy);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx, 0);
            ctx.lineTo(cx, height);
            ctx.stroke();

            // Axis labels
            ctx.fillStyle = "rgba(128,128,128,0.8)";
            ctx.font = "10px monospace";
            ctx.textAlign = "center";
            for (let x = xRange[0]; x <= xRange[1]; x += gridStep * 2) {
                if (x === 0) continue;
                ctx.fillText(String(x), cx + x * scale, cy + 14);
            }
            ctx.textAlign = "right";
            for (let y = yRange[0]; y <= yRange[1]; y += gridStep * 2) {
                if (y === 0) continue;
                ctx.fillText(String(y), cx - 5, cy - y * scale + 4);
            }

            // Draw lines between points
            if (points.length > 1) {
                ctx.strokeStyle = "hsl(221, 83%, 53%)";
                ctx.lineWidth = 2;
                ctx.beginPath();
                const sorted = [...points].sort((a, b) => a.x - b.x);
                sorted.forEach((p, i) => {
                    const px = cx + p.x * scale;
                    const py = cy - p.y * scale;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                });
                ctx.stroke();
            }

            // Draw points
            points.forEach((p) => {
                const px = cx + p.x * scale;
                const py = cy - p.y * scale;
                ctx.fillStyle = "hsl(221, 83%, 53%)";
                ctx.beginPath();
                ctx.arc(px, py, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "white";
                ctx.beginPath();
                ctx.arc(px, py, 2, 0, Math.PI * 2);
                ctx.fill();
            });
        },
        [points, scale, cx, cy, xRange, yRange, gridStep, width, height]
    );

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        drawGrid(ctx);
    }, [drawGrid]);

    useEffect(() => {
        onChange(JSON.stringify(points));
    }, [points]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (disabled) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const rawX = (e.clientX - rect.left - cx) / scale;
        const rawY = -(e.clientY - rect.top - cy) / scale;
        // Snap to nearest 0.5
        const x = Math.round(rawX * 2) / 2;
        const y = Math.round(rawY * 2) / 2;

        // Toggle — remove if clicking near existing point
        const existing = points.findIndex((p) => Math.abs(p.x - x) < 0.5 && Math.abs(p.y - y) < 0.5);
        if (existing >= 0) {
            setPoints((prev) => prev.filter((_, i) => i !== existing));
        } else {
            setPoints((prev) => [...prev, { x, y }]);
        }
    };

    return (
        <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Click to plot points. Click a point again to remove it.</p>
            <div className="mx-auto overflow-hidden rounded-xl border border-border" style={{ width, height }}>
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    onClick={handleCanvasClick}
                    className="cursor-crosshair"
                />
            </div>
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setPoints([])}
                    disabled={disabled || points.length === 0}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-50"
                >
                    <RotateCcw className="h-3 w-3" /> Clear
                </button>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setScale((s) => Math.max(10, s - 5))}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-xs hover:bg-muted"
                    >
                        <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs text-muted-foreground">{points.length} points</span>
                    <button
                        onClick={() => setScale((s) => Math.min(40, s + 5))}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-xs hover:bg-muted"
                    >
                        <Plus className="h-3 w-3" />
                    </button>
                </div>
            </div>
        </div>
    );
}
