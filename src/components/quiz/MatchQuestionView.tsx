"use client";

/**
 * MatchQuestionView - Click-to-match term matching component.
 * Students select a term, then click the matching definition.
 * No external drag-and-drop library needed.
 */

import { useState, useMemo } from "react";
import { Check, X, RotateCcw, ChevronRight } from "lucide-react";

export interface MatchPair {
    termId: string;
    term: string;
    definitionId: string;
    definition: string;
}

export interface MatchQuestionData {
    id: string;
    question_text: string;
    pairs: MatchPair[];
    explanation?: string;
    concept_tag?: string;
}

interface MatchQuestionViewProps {
    question: MatchQuestionData;
    onComplete: (isCorrect: boolean, correctCount: number, totalCount: number) => void;
    onNext: () => void;
}

interface MatchState {
    [definitionId: string]: string | null;
}

export function MatchQuestionView({ question, onComplete, onNext }: MatchQuestionViewProps) {
    const [matches, setMatches] = useState<MatchState>({});
    const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [results, setResults] = useState<Record<string, boolean>>({});

    const shuffledTerms = useMemo(
        () => [...question.pairs].sort(() => Math.random() - 0.5),
        [question.pairs]
    );

    const matchedTermIds = new Set(Object.values(matches).filter(Boolean));
    const allMatched = Object.keys(matches).length === question.pairs.length;

    const handleTermClick = (termId: string) => {
        if (isSubmitted || matchedTermIds.has(termId)) return;
        setSelectedTerm(selectedTerm === termId ? null : termId);
    };

    const handleDefinitionClick = (definitionId: string) => {
        if (isSubmitted || !selectedTerm) return;
        // Remove term from previous position
        const newMatches = { ...matches };
        Object.entries(newMatches).forEach(([key, val]) => {
            if (val === selectedTerm) delete newMatches[key];
        });
        newMatches[definitionId] = selectedTerm;
        setMatches(newMatches);
        setSelectedTerm(null);
    };

    const handleSubmit = () => {
        const resultMap: Record<string, boolean> = {};
        let correctCount = 0;

        question.pairs.forEach((pair) => {
            const isCorrect = matches[pair.definitionId] === pair.termId;
            resultMap[pair.definitionId] = isCorrect;
            if (isCorrect) correctCount++;
        });

        setResults(resultMap);
        setIsSubmitted(true);
        onComplete(correctCount === question.pairs.length, correctCount, question.pairs.length);
    };

    const handleReset = () => {
        setMatches({});
        setResults({});
        setIsSubmitted(false);
        setSelectedTerm(null);
    };

    const correctCount = Object.values(results).filter(Boolean).length;
    const allCorrect = correctCount === question.pairs.length;

    return (
        <div className="space-y-4">
            {question.concept_tag && (
                <span className="inline-block rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {question.concept_tag}
                </span>
            )}
            <h2 className="text-lg font-bold">{question.question_text}</h2>
            <p className="text-xs text-muted-foreground">
                Select a term, then click the matching definition
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Terms column */}
                <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Terms</h3>
                    {shuffledTerms.map((pair) => {
                        const isMatched = matchedTermIds.has(pair.termId);
                        const isSelected = selectedTerm === pair.termId;
                        const isCorrectResult = isSubmitted && Object.entries(matches).some(
                            ([defId, tId]) => tId === pair.termId && results[defId]
                        );
                        const isWrongResult = isSubmitted && !isCorrectResult && isMatched;

                        return (
                            <button
                                key={pair.termId}
                                onClick={() => handleTermClick(pair.termId)}
                                disabled={isSubmitted}
                                className={`w-full rounded-xl border p-3 text-left text-sm font-medium transition-all ${isSubmitted
                                        ? isCorrectResult
                                            ? "border-green-500 bg-green-500/10"
                                            : isWrongResult
                                                ? "border-red-500 bg-red-500/10"
                                                : "border-border bg-card opacity-50"
                                        : isSelected
                                            ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                                            : isMatched
                                                ? "border-primary/30 bg-primary/5 opacity-70"
                                                : "border-border bg-card hover:bg-muted/50"
                                    }`}
                            >
                                {pair.term}
                            </button>
                        );
                    })}
                </div>

                {/* Definitions column */}
                <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Definitions</h3>
                    {question.pairs.map((pair) => {
                        const matchedTermId = matches[pair.definitionId];
                        const matchedTerm = matchedTermId
                            ? question.pairs.find((p) => p.termId === matchedTermId)?.term
                            : null;

                        return (
                            <button
                                key={pair.definitionId}
                                onClick={() => handleDefinitionClick(pair.definitionId)}
                                disabled={isSubmitted || !selectedTerm}
                                className={`w-full rounded-xl border p-3 text-left text-sm transition-all ${isSubmitted
                                        ? results[pair.definitionId]
                                            ? "border-green-500 bg-green-500/10"
                                            : results[pair.definitionId] === false
                                                ? "border-red-500 bg-red-500/10"
                                                : "border-border bg-card"
                                        : matchedTermId
                                            ? "border-primary/30 bg-primary/5"
                                            : selectedTerm
                                                ? "border-border bg-card hover:bg-muted/50 cursor-pointer"
                                                : "border-border bg-card"
                                    }`}
                            >
                                <span className="text-muted-foreground">{pair.definition}</span>
                                {matchedTerm && (
                                    <span className="mt-1 block text-xs font-semibold text-primary">
                                        → {matchedTerm}
                                    </span>
                                )}
                                {isSubmitted && !results[pair.definitionId] && (
                                    <span className="mt-1 block text-xs font-semibold text-green-600">
                                        ✓ Correct: {pair.term}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Results */}
            {isSubmitted ? (
                <div className={`rounded-xl border-2 p-4 ${allCorrect ? "border-green-500 bg-green-500/5" : "border-yellow-500 bg-yellow-500/5"
                    }`}>
                    <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${allCorrect ? "bg-green-500/20" : "bg-yellow-500/20"
                            }`}>
                            {allCorrect ? <Check className="h-5 w-5 text-green-500" /> : <X className="h-5 w-5 text-yellow-500" />}
                        </div>
                        <div>
                            <p className="font-semibold">{allCorrect ? "Perfect! 🎉" : "Good try! 💪"}</p>
                            <p className="text-sm text-muted-foreground">
                                {correctCount} of {question.pairs.length} correct
                            </p>
                        </div>
                    </div>
                    {question.explanation && (
                        <p className="mt-3 border-t pt-3 text-sm text-muted-foreground">{question.explanation}</p>
                    )}
                    <div className="mt-3 flex gap-3">
                        {!allCorrect && (
                            <button
                                onClick={handleReset}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm hover:bg-muted"
                            >
                                <RotateCcw className="h-4 w-4" /> Try Again
                            </button>
                        )}
                        <button
                            onClick={onNext}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground"
                        >
                            Continue <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={handleSubmit}
                    disabled={!allMatched}
                    className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                    Check My Answers
                </button>
            )}
        </div>
    );
}
