"use client";

import { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
    code: string;
    id?: string;
}

/**
 * Renders a Mermaid diagram from code. Loads mermaid.js lazily from CDN
 * to avoid bundle bloat. Falls back to a code block if rendering fails.
 */
export function MermaidDiagram({ code, id }: MermaidDiagramProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState(false);
    const [rendered, setRendered] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function render() {
            try {
                // Dynamically import mermaid from CDN
                const mermaid = (window as any).mermaid;
                if (!mermaid) {
                    // Load mermaid from CDN if not already loaded
                    const script = document.createElement("script");
                    script.src =
                        "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js";
                    script.async = true;
                    await new Promise<void>((resolve, reject) => {
                        script.onload = () => resolve();
                        script.onerror = () => reject(new Error("Failed to load mermaid"));
                        document.head.appendChild(script);
                    });
                    (window as any).mermaid.initialize({
                        startOnLoad: false,
                        theme: document.documentElement.classList.contains("dark")
                            ? "dark"
                            : "default",
                        securityLevel: "loose",
                    });
                }

                if (cancelled || !containerRef.current) return;

                const uniqueId = id || `mermaid-${Math.random().toString(36).slice(2, 8)}`;
                const { svg } = await (window as any).mermaid.render(
                    uniqueId,
                    code.trim()
                );

                if (cancelled || !containerRef.current) return;
                containerRef.current.innerHTML = svg;
                setRendered(true);
            } catch (err) {
                console.warn("Mermaid render failed:", err);
                if (!cancelled) setError(true);
            }
        }

        render();
        return () => {
            cancelled = true;
        };
    }, [code, id]);

    if (error) {
        return (
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs text-muted-foreground">
                <code>{code}</code>
            </pre>
        );
    }

    return (
        <div className="my-4">
            <div
                ref={containerRef}
                className="flex justify-center overflow-x-auto rounded-lg border border-border bg-card p-4"
            >
                {!rendered && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Loading diagram...
                    </div>
                )}
            </div>
        </div>
    );
}
