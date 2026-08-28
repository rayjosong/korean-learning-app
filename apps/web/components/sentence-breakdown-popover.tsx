"use client";

import { useEffect, useState } from "react";
import type { SentenceExplanation } from "@korean-learning/ai";

import type { TranscriptSegment } from "@/lib/transcript";
import type { SentenceExplanationState } from "@/lib/use-sentence-explanation";
import type { LearnerItemState } from "@/lib/use-learner-item";
import type { WordExplanationState } from "@/lib/use-word-explanation";
import type { AssistancePresentation } from "@/lib/assistance-presentation";

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
  assistancePresentation?: AssistancePresentation;
  englishHelpRevealed?: boolean;
  onShowEnglishHelp?: () => void;
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
  onClose,
  assistancePresentation,
  englishHelpRevealed = false,
  onShowEnglishHelp
}: SentenceBreakdownPopoverProps) {
  const [showGrammar, setShowGrammar] = useState(false);
  const [showNuance, setShowNuance] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  useEffect(() => {
    if (assistancePresentation?.expandGrammarByDefault) setShowGrammar(true);
    if (assistancePresentation?.expandNuanceByDefault) setShowNuance(true);
  }, [assistancePresentation?.expandGrammarByDefault, assistancePresentation?.expandNuanceByDefault]);

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
      className="relative mr-1 mb-3 rounded-lg border border-hairline-strong bg-surface-elevated p-5 shadow-lg"
      aria-label="Sentence explanation popover"
    >
      <button
        type="button"
        onClick={handleClose}
        className="absolute right-3 top-3 rounded text-ink-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="Close explanation popover"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {state.status === "loading" ? (
        <div role="status" aria-live="polite" className="pr-6">
          <p className="animate-pulse text-sm font-medium text-primary-deep">Explaining the sentence…</p>
          <div className="mt-4 space-y-2">
            <div className="h-3.5 w-11/12 animate-pulse rounded bg-surface" />
            <div className="h-3.5 w-9/12 animate-pulse rounded bg-surface" />
          </div>
        </div>
      ) : null}

      {state.status === "error" ? (
        <div role="alert" className="pr-6">
          <p className="text-sm leading-6 text-error">{state.error}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 rounded-lg border border-hairline-strong px-3 py-1.5 text-sm text-ink-secondary transition-colors hover:border-primary hover:text-ink focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : null}

      {state.status === "ready" && state.explanation ? (
        !assistancePresentation?.showEnglishMeaning ? (
          <div className="pr-6"><p lang="ko" className="text-lg font-medium text-ink">{state.explanation.sentence}</p><button type="button" aria-expanded={englishHelpRevealed} onClick={onShowEnglishHelp} className="mt-3 rounded-lg border border-primary/40 px-3 py-1.5 text-sm text-primary-deep focus-visible:ring-2 focus-visible:ring-primary">Show English help</button></div>
        ) : (
        <div className="pr-6">
          {/* Natural meaning prioritized */}
          <section aria-label="Natural meaning" className="mb-3">
            <h3 className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-deep">Meaning</h3>
            <p className="text-base font-medium leading-6 text-ink">{state.explanation.naturalMeaning}</p>
          </section>

          {/* Meaningful phrase-first breakdown */}
          <section aria-label="Breakdown" className="mb-3 border-t border-hairline pt-3">
            <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Phrases</h3>
            <dl className="space-y-2">
              {state.explanation.breakdown.map((item) => (
                <div key={`${item.text}-${item.meaning}`} className="grid grid-cols-[auto_1fr] items-baseline gap-x-2">
                  <dt lang="ko" className="text-[15px] font-medium text-ink">
                    {onWordClick ? (
                      <button
                        type="button"
                        onClick={() => onWordClick(item.text)}
                        className="rounded font-medium text-ink underline decoration-hairline-strong underline-offset-4 transition-colors hover:text-primary-deep focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        {item.text}
                      </button>
                    ) : (
                      item.text
                    )}
                  </dt>
                  <dd className="text-sm leading-5 text-ink-secondary">
                    {item.meaning}
                    {item.role ? <span className="text-xs text-ink-muted"> · {item.role}</span> : null}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Progressive disclosure controls */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-hairline pt-2 text-xs">
            {state.explanation.grammar && state.explanation.grammar.length > 0 && (
              <button
                type="button"
                onClick={() => setShowGrammar(!showGrammar)}
                className={`font-medium transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-primary ${showGrammar ? "text-primary-deep" : "text-ink-muted"}`}
              >
                {showGrammar ? "Hide Grammar" : "Grammar"}
              </button>
            )}
            {state.explanation.nuance && (
              <button
                type="button"
                onClick={() => setShowNuance(!showNuance)}
                className={`font-medium transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-primary ${showNuance ? "text-primary-deep" : "text-ink-muted"}`}
              >
                {showNuance ? "Hide Nuance" : "Nuance"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowExamples(!showExamples)}
              className={`font-medium transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-primary ${showExamples ? "text-primary-deep" : "text-ink-muted"}`}
            >
              {showExamples ? "Hide Examples" : "Examples"}
            </button>
          </div>

          {/* Collapsible Grammar Detail */}
          {showGrammar && state.explanation.grammar && state.explanation.grammar.length > 0 && (
            <div className="mt-2 rounded-lg border border-hairline bg-surface-subtle p-2.5 text-xs text-ink-secondary">
              <ul className="space-y-2">
                {state.explanation.grammar.map((item, idx) => (
                  <li key={idx} className="leading-relaxed">
                    <span lang="ko" className="font-semibold text-primary-deep">{item.form}</span>
                    <span className="text-ink-muted"> — </span>
                    {item.explanation}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Collapsible Nuance Detail */}
          {showNuance && state.explanation.nuance && (
            <div className="mt-2 rounded-lg border border-hairline bg-surface-subtle p-2.5 text-xs leading-relaxed text-ink-secondary">
              <p>{state.explanation.nuance}</p>
            </div>
          )}

          {/* Collapsible Examples Detail */}
          {showExamples && (
            <div className="mt-2 rounded-lg border border-hairline bg-surface-subtle p-2.5 text-xs leading-relaxed text-ink-secondary">
              <p className="mb-1.5 italic text-ink-muted">Spoken usage examples:</p>
              <ul className="list-disc space-y-2 pl-4 text-[11px] text-ink-secondary">
                {state.explanation.grammar.map((g, idx) => (
                  <li key={idx}>
                    Focusing on <span className="font-semibold text-ink">{g.form}</span>:
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
        )
      ) : null}

      {/* Inline Word Lookup Area */}
      {wordState && wordState.status !== "idle" && (
        <div className="mt-3 border-t border-hairline pt-3">
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
        className="rounded-lg border border-hairline bg-surface-subtle p-2.5"
      >
        <p className="animate-pulse text-xs font-medium text-primary-deep">
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
        className="rounded-lg border border-hairline bg-surface-subtle p-2.5"
      >
        <p className="text-xs leading-5 text-error">{state.error}</p>
      </aside>
    );
  }

  const explanation = state.explanation;
  if (!explanation) return null;

  return (
    <aside aria-label="Word explanation" className="rounded-lg border border-hairline bg-surface-subtle p-3">
      <p lang="ko" className="text-sm font-semibold text-ink">{explanation.word}</p>
      <p className="mt-1 text-xs leading-5 text-ink-secondary">{explanation.meaning}</p>
      {explanation.dictionaryForm ? (
        <p className="mt-1 text-[11px] text-ink-secondary">
          Dictionary form: <span lang="ko" className="text-ink-secondary">{explanation.dictionaryForm}</span>
        </p>
      ) : null}
      {explanation.nuance ? (
        <p className="mt-1 text-[11px] leading-4 text-ink-secondary">{explanation.nuance}</p>
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
        className="mt-2.5 flex items-center justify-between gap-3 rounded-md bg-jade-soft px-2.5 py-1.5"
      >
        <p className="text-[11px] font-medium text-jade-deep">
          {savedAsLearning ? "✓ Added to review" : "✓ Marked as known"}
        </p>
        {onUndo ? (
          <button
            type="button"
            onClick={onUndo}
            className="rounded text-[11px] text-ink-secondary underline decoration-hairline-strong underline-offset-2 transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-primary"
          >
            Undo
          </button>
        ) : null}
      </div>
    );
  }

  if (learnerState.item?.state === "known") {
    if (!onMarkLearning) return <p className="mt-2.5 text-[11px] text-ink-secondary">You marked this as known.</p>;
    return (
      <button
        type="button"
        onClick={onMarkLearning}
        className="mt-2.5 w-full rounded-lg border border-primary/40 px-2.5 py-1 text-xs text-primary-deep transition-colors hover:border-primary hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-primary"
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
        className="mt-2.5 w-full rounded-lg border border-jade/50 px-2.5 py-1 text-xs text-jade-deep transition-colors hover:border-jade hover:bg-jade-soft focus-visible:ring-2 focus-visible:ring-primary"
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
          className="rounded-lg border border-jade/50 px-2 py-1 text-xs text-jade-deep transition-colors hover:border-jade hover:bg-jade-soft focus-visible:ring-2 focus-visible:ring-primary"
        >
          I know this
        </button>
      ) : null}
      {onMarkLearning ? (
        <button
          type="button"
          onClick={onMarkLearning}
          className="rounded-lg bg-primary-hover px-2 py-1 text-xs font-medium text-on-primary transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-primary"
        >
          Learn this
        </button>
      ) : null}
    </div>
  );
}
