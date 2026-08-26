"use client";

import { useEffect, useState } from "react";
import type { SentenceExplanation } from "@korean-learning/ai";

import type { TranscriptSegment } from "@/lib/transcript";
import type { SentenceExplanationState } from "@/lib/use-sentence-explanation";
import type { LearnerItemState } from "@/lib/use-learner-item";
import type { WordExplanationState } from "@/lib/use-word-explanation";

export interface SentenceBreakdownPopoverProps {
  segment: TranscriptSegment;
  state: SentenceExplanationState;
  onRetry?: () => void;
  wordState?: WordExplanationState;
  onWordClick?: (word: string) => void;
  learnerState?: LearnerItemState;
  onMarkKnown?: () => void;
  onMarkLearning?: () => void;
  onUndo?: () => void;
  onClose: () => void;
}

export function SentenceBreakdownPopover({
  segment,
  state,
  onRetry,
  wordState,
  onWordClick,
  learnerState,
  onMarkKnown,
  onMarkLearning,
  onUndo,
  onClose
}: SentenceBreakdownPopoverProps) {
  const [showGrammar, setShowGrammar] = useState(false);
  const [showNuance, setShowNuance] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        document.getElementById(`segment-btn-${segment.id}`)?.focus();
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [segment.id, onClose]);

  const handleClose = () => {
    document.getElementById(`segment-btn-${segment.id}`)?.focus();
    onClose();
  };

  return (
    <section
      className="relative rounded-2xl border border-[#C7654C]/30 bg-slate-950 p-4 shadow-2xl mr-1 mb-3"
      aria-label="Sentence explanation popover"
    >
      <button
        type="button"
        onClick={handleClose}
        className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors"
        aria-label="Close explanation popover"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {state.status === "loading" ? (
        <div role="status" aria-live="polite" className="pr-6">
          <p className="animate-pulse text-sm font-medium text-sky-300">Explaining the sentence…</p>
          <div className="mt-4 space-y-2">
            <div className="h-3.5 w-11/12 animate-pulse rounded bg-slate-800" />
            <div className="h-3.5 w-9/12 animate-pulse rounded bg-slate-800" />
          </div>
        </div>
      ) : null}

      {state.status === "error" ? (
        <div role="alert" className="pr-6">
          <p className="text-sm leading-6 text-rose-300">{state.error}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:border-sky-400 hover:text-white"
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : null}

      {state.status === "ready" && state.explanation ? (
        <div className="pr-6">
          {/* Natural meaning prioritized */}
          <section aria-label="Natural meaning" className="mb-3">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[#C7654C]/80 mb-0.5">Meaning</h4>
            <p className="text-base font-medium leading-6 text-white">{state.explanation.naturalMeaning}</p>
          </section>

          {/* Meaningful phrase-first breakdown */}
          <section aria-label="Breakdown" className="border-t border-slate-800/60 pt-3 mb-3">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Phrases</h4>
            <dl className="space-y-2">
              {state.explanation.breakdown.map((item) => (
                <div key={`${item.text}-${item.meaning}`} className="grid grid-cols-[auto_1fr] items-baseline gap-x-2">
                  <dt lang="ko" className="text-[15px] font-medium text-slate-100">
                    {onWordClick ? (
                      <button
                        type="button"
                        onClick={() => onWordClick(item.text)}
                        className="rounded font-medium text-slate-100 underline decoration-slate-700 underline-offset-4 transition-colors hover:text-sky-300 hover:decoration-sky-400"
                      >
                        {item.text}
                      </button>
                    ) : (
                      item.text
                    )}
                  </dt>
                  <dd className="text-sm leading-5 text-slate-400">
                    {item.meaning}
                    {item.role ? <span className="text-slate-600 text-xs"> · {item.role}</span> : null}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Progressive disclosure controls */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-slate-800/60 pt-2 text-xs">
            {state.explanation.grammar && state.explanation.grammar.length > 0 && (
              <button
                type="button"
                onClick={() => setShowGrammar(!showGrammar)}
                className={`font-semibold hover:text-white transition-colors ${showGrammar ? "text-[#C7654C]" : "text-slate-400"}`}
              >
                {showGrammar ? "Hide Grammar" : "Grammar"}
              </button>
            )}
            {state.explanation.nuance && (
              <button
                type="button"
                onClick={() => setShowNuance(!showNuance)}
                className={`font-semibold hover:text-white transition-colors ${showNuance ? "text-[#C7654C]" : "text-slate-400"}`}
              >
                {showNuance ? "Hide Nuance" : "Nuance"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowExamples(!showExamples)}
              className={`font-semibold hover:text-white transition-colors ${showExamples ? "text-[#C7654C]" : "text-slate-400"}`}
            >
              {showExamples ? "Hide Examples" : "Examples"}
            </button>
          </div>

          {/* Collapsible Grammar Detail */}
          {showGrammar && state.explanation.grammar && state.explanation.grammar.length > 0 && (
            <div className="mt-2 bg-slate-900/60 rounded-lg p-2.5 text-xs text-slate-300 border border-slate-800/40">
              <ul className="space-y-2">
                {state.explanation.grammar.map((item, idx) => (
                  <li key={idx} className="leading-relaxed">
                    <span lang="ko" className="font-semibold text-[#C7654C]">{item.form}</span>
                    <span className="text-slate-500"> — </span>
                    {item.explanation}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Collapsible Nuance Detail */}
          {showNuance && state.explanation.nuance && (
            <div className="mt-2 bg-slate-900/60 rounded-lg p-2.5 text-xs text-slate-300 border border-slate-800/40 leading-relaxed">
              <p>{state.explanation.nuance}</p>
            </div>
          )}

          {/* Collapsible Examples Detail */}
          {showExamples && (
            <div className="mt-2 bg-slate-900/60 rounded-lg p-2.5 text-xs text-slate-300 border border-slate-800/40 leading-relaxed">
              <p className="text-slate-400 italic mb-1.5">Spoken usage examples:</p>
              <ul className="space-y-2 list-disc pl-4 text-[11px] text-slate-300">
                {state.explanation.grammar.map((g, idx) => (
                  <li key={idx}>
                    Focusing on <span className="font-semibold text-slate-200">{g.form}</span>:
                    <br />
                    Discover and practice similar patterns interactively in Study mode.
                  </li>
                ))}
                {state.explanation.grammar.length === 0 && (
                  <li>Full dialogue practice and sample contextual usage can be pursued in Study mode.</li>
                )}
              </ul>
            </div>
          )}
        </div>
      ) : null}

      {/* Inline Word Lookup Area */}
      {wordState && wordState.status !== "idle" && (
        <div className="mt-3 border-t border-slate-800/60 pt-3">
          <WordCard
            state={wordState}
            learnerState={learnerState}
            onMarkKnown={onMarkKnown}
            onMarkLearning={onMarkLearning}
            onUndo={onUndo}
          />
        </div>
      )}
    </section>
  );
}

function WordCard({
  state,
  learnerState,
  onMarkKnown,
  onMarkLearning,
  onUndo
}: {
  state: WordExplanationState;
  learnerState?: LearnerItemState;
  onMarkKnown?: () => void;
  onMarkLearning?: () => void;
  onUndo?: () => void;
}) {
  if (state.status === "loading") {
    return (
      <aside
        role="status"
        aria-live="polite"
        aria-label="Word explanation"
        className="rounded-xl border border-slate-800 bg-slate-900/40 p-2.5"
      >
        <p className="animate-pulse text-xs font-medium text-sky-300">
          Looking up <span lang="ko">{state.word}</span>…
        </p>
      </aside>
    );
  }

  if (state.status === "error") {
    return (
      <aside
        role="alert"
        aria-label="Word explanation"
        className="rounded-xl border border-slate-800 bg-slate-900/40 p-2.5"
      >
        <p className="text-xs leading-5 text-rose-300">{state.error}</p>
      </aside>
    );
  }

  const explanation = state.explanation;
  if (!explanation) return null;

  return (
    <aside aria-label="Word explanation" className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
      <p lang="ko" className="text-sm font-semibold text-white">{explanation.word}</p>
      <p className="mt-1 text-xs leading-5 text-slate-200">{explanation.meaning}</p>
      {explanation.dictionaryForm ? (
        <p className="mt-1 text-[11px] text-slate-500">
          Dictionary form: <span lang="ko" className="text-slate-400">{explanation.dictionaryForm}</span>
        </p>
      ) : null}
      {explanation.nuance ? (
        <p className="mt-1 text-[11px] leading-4 text-slate-500">{explanation.nuance}</p>
      ) : null}
      <LearnerAction
        learnerState={learnerState}
        onMarkKnown={onMarkKnown}
        onMarkLearning={onMarkLearning}
        onUndo={onUndo}
      />
    </aside>
  );
}

function LearnerAction({
  learnerState,
  onMarkKnown,
  onMarkLearning,
  onUndo
}: {
  learnerState?: LearnerItemState;
  onMarkKnown?: () => void;
  onMarkLearning?: () => void;
  onUndo?: () => void;
}) {
  if (learnerState?.status !== "ready") return null;

  if (learnerState.saved) {
    const savedAsLearning = learnerState.saved.action === "learning";
    return (
      <div
        role="status"
        className="mt-2.5 flex items-center justify-between gap-3 rounded-lg bg-emerald-400/10 px-2.5 py-1.5"
      >
        <p className="text-[11px] font-medium text-emerald-300">
          {savedAsLearning ? "✓ Added to review" : "✓ Marked as known"}
        </p>
        {onUndo ? (
          <button
            type="button"
            onClick={onUndo}
            className="rounded text-[11px] text-slate-400 underline decoration-slate-600 underline-offset-2 transition-colors hover:text-white hover:decoration-slate-300"
          >
            Undo
          </button>
        ) : null}
      </div>
    );
  }

  if (learnerState.item?.state === "known") {
    if (!onMarkLearning) return <p className="mt-2.5 text-[11px] text-slate-500">You marked this as known.</p>;
    return (
      <button
        type="button"
        onClick={onMarkLearning}
        className="mt-2.5 w-full rounded-lg border border-sky-500/40 px-2.5 py-1 text-xs text-sky-300 transition-colors hover:border-sky-400 hover:bg-sky-400/10 hover:text-sky-200"
      >
        Learn this again
      </button>
    );
  }

  if (learnerState.item?.state === "learning") {
    if (!onMarkKnown) return null;
    return (
      <button
        type="button"
        onClick={onMarkKnown}
        className="mt-2.5 w-full rounded-lg border border-emerald-500/40 px-2.5 py-1 text-xs text-emerald-300 transition-colors hover:border-emerald-400 hover:bg-emerald-400/10 hover:text-emerald-200"
      >
        I know this
      </button>
    );
  }

  return (
    <div className="mt-2.5 grid grid-cols-2 gap-2">
      {onMarkKnown ? (
        <button
          type="button"
          onClick={onMarkKnown}
          className="rounded-lg border border-emerald-500/40 px-2 py-1 text-xs text-emerald-300 transition-colors hover:border-emerald-400 hover:bg-emerald-400/10 hover:text-emerald-200"
        >
          I know this
        </button>
      ) : null}
      {onMarkLearning ? (
        <button
          type="button"
          onClick={onMarkLearning}
          className="rounded-lg border border-sky-500/40 px-2 py-1 text-xs text-sky-300 transition-colors hover:border-sky-400 hover:bg-sky-400/10 hover:text-sky-200"
        >
          Learn this
        </button>
      ) : null}
    </div>
  );
}
