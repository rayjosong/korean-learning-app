import { useState } from "react";
import type { SentenceExplanation } from "@korean-learning/ai";

import type { TranscriptSegment } from "@/lib/transcript";
import type { SentenceExplanationState } from "@/lib/use-sentence-explanation";
import type { LearnerItemState } from "@/lib/use-learner-item";
import type { WordExplanationState } from "@/lib/use-word-explanation";

export interface ExplanationPanelProps {
  segment?: TranscriptSegment;
  state: SentenceExplanationState;
  onRetry?: () => void;
  wordState?: WordExplanationState;
  onWordClick?: (word: string) => void;
  learnerState?: LearnerItemState;
  onMarkKnown?: () => void;
  onMarkLearning?: () => void;
  onUndo?: () => void;
  progressive?: boolean;
}

export function ExplanationPanel({
  segment,
  state,
  onRetry,
  wordState,
  onWordClick,
  learnerState,
  onMarkKnown,
  onMarkLearning,
  onUndo,
  progressive = false
}: ExplanationPanelProps) {
  const [openSection, setOpenSection] = useState<"grammar" | "nuance" | "examples">();
  return (
    <section className="rounded-xl border border-hairline bg-surface-elevated p-5" aria-label="Sentence explanation">
      <h2 className="mb-3 font-semibold text-ink">Explanation</h2>

      {state.status === "idle" ? (
        <p className="text-sm leading-6 text-ink-muted">
          Click a Korean sentence in the transcript to see its natural meaning, breakdown, and grammar.
        </p>
      ) : null}

      {state.status === "loading" ? (
        <div role="status" aria-live="polite">
          <p className="animate-pulse text-sm font-medium text-primary-deep">Explaining the sentence…</p>
          {segment ? <p lang="ko" className="mt-3 text-[26px] font-[550] leading-[1.6] text-ink-secondary">{segment.text}</p> : null}
          <div className="mt-4 space-y-2">
            <div className="h-4 w-11/12 animate-pulse rounded bg-surface" />
            <div className="h-4 w-9/12 animate-pulse rounded bg-surface" />
            <div className="h-4 w-10/12 animate-pulse rounded bg-surface" />
          </div>
        </div>
      ) : null}

      {state.status === "error" ? (
        <div role="alert">
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
        <ExplanationContent
          explanation={state.explanation}
          onWordClick={onWordClick}
          progressive={progressive}
          openSection={openSection}
          onToggleSection={(section) => setOpenSection((current) => current === section ? undefined : section)}
        />
      ) : null}

      {wordState && wordState.status !== "idle" ? (
        <WordCard state={wordState} learnerState={learnerState} onMarkKnown={onMarkKnown} onMarkLearning={onMarkLearning} onUndo={onUndo} />
      ) : null}
    </section>
  );
}

function ExplanationContent({
  explanation,
  onWordClick,
  progressive,
  openSection,
  onToggleSection
}: {
  explanation: SentenceExplanation;
  onWordClick?: (word: string) => void;
  progressive: boolean;
  openSection?: "grammar" | "nuance" | "examples";
  onToggleSection: (section: "grammar" | "nuance" | "examples") => void;
}) {
  return (
    <article>
      <p lang="ko" className="text-[26px] font-[550] leading-[1.6] text-ink">{explanation.sentence}</p>
      {explanation.speechLevel ? (
        <p className="mt-1.5 inline-block rounded-full bg-primary-soft px-2.5 py-0.5 text-xs text-primary-deep">{explanation.speechLevel}</p>
      ) : null}

      <section className="mt-4" aria-label="Natural meaning">
        <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-primary-deep">Natural meaning</h3>
        <p className="mt-1.5 text-base font-medium leading-7 text-ink">{explanation.naturalMeaning}</p>
      </section>

      <section className="mt-4" aria-label="Breakdown">
        <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-ink-muted">Breakdown</h3>
        <dl className="mt-1.5 space-y-1.5">
          {explanation.breakdown.map((item) => (
            <div key={`${item.text}-${item.meaning}`} className="grid grid-cols-[auto_1fr] items-baseline gap-x-3">
              <dt lang="ko" className="text-sm font-medium text-ink">
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
              <dd className="text-sm leading-6 text-ink-secondary">
                {item.meaning}
                {item.role ? <span className="text-ink-muted"> · {item.role}</span> : null}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {progressive ? (
        <div className="mt-4 flex flex-wrap gap-3 border-t border-hairline pt-3 text-xs">
          {explanation.grammar.length > 0 ? (
            <DisclosureButton label="Grammar" open={openSection === "grammar"} onClick={() => onToggleSection("grammar")} />
          ) : null}
          {explanation.nuance ? (
            <DisclosureButton label="Nuance" open={openSection === "nuance"} onClick={() => onToggleSection("nuance")} />
          ) : null}
          <DisclosureButton label="More examples" open={openSection === "examples"} onClick={() => onToggleSection("examples")} />
        </div>
      ) : null}

      {!progressive && explanation.grammar.length > 0 ? (
        <section className="mt-4" aria-label="Grammar">
          <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-ink-muted">Grammar</h3>
          <ul className="mt-1.5 space-y-1.5">
            {explanation.grammar.map((item) => (
              <li key={`${item.form}-${item.explanation}`} className="text-sm leading-6 text-ink-secondary">
                <span lang="ko" className="font-medium text-ink">{item.form}</span>
                <span className="text-ink-muted"> — </span>
                {item.explanation}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!progressive && explanation.nuance ? (
        <section className="mt-4" aria-label="Nuance">
          <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-ink-muted">Nuance</h3>
          <p className="mt-1.5 text-sm leading-6 text-ink-secondary">{explanation.nuance}</p>
        </section>
      ) : null}

      {progressive && openSection === "grammar" && explanation.grammar.length > 0 ? (
        <section className="mt-3 rounded-lg border border-hairline bg-surface-subtle p-3" aria-label="Grammar">
          <ul className="space-y-1.5">
            {explanation.grammar.map((item) => <li key={`${item.form}-${item.explanation}`} className="text-sm leading-6 text-ink-secondary"><span lang="ko" className="font-medium text-ink">{item.form}</span><span className="text-ink-muted"> — </span>{item.explanation}</li>)}
          </ul>
        </section>
      ) : null}
      {progressive && openSection === "nuance" && explanation.nuance ? (
        <section className="mt-3 rounded-lg border border-hairline bg-surface-subtle p-3" aria-label="Nuance"><p className="text-sm leading-6 text-ink-secondary">{explanation.nuance}</p></section>
      ) : null}
      {progressive && openSection === "examples" ? (
        <section className="mt-3 rounded-lg border border-hairline bg-surface-subtle p-3" aria-label="More examples"><p className="text-sm leading-6 text-ink-muted">More examples will stay tied to this sentence and its spoken patterns.</p></section>
      ) : null}
    </article>
  );
}

function DisclosureButton({ label, open, onClick }: { label: string; open: boolean; onClick: () => void }) {
  return <button type="button" aria-expanded={open} onClick={onClick} className={`font-semibold transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-primary ${open ? "text-primary-deep" : "text-ink-muted"}`}>{open ? `Hide ${label}` : label}</button>;
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
        className="mt-4 rounded-lg border border-hairline bg-surface-subtle p-3"
      >
        <p className="animate-pulse text-sm font-medium text-primary-deep">
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
        className="mt-4 rounded-lg border border-hairline bg-surface-subtle p-3"
      >
        <p className="text-sm leading-6 text-error">{state.error}</p>
      </aside>
    );
  }

  const explanation = state.explanation;
  if (!explanation) return null;

  return (
    <aside aria-label="Word explanation" className="mt-4 rounded-lg border border-hairline bg-surface-subtle p-3">
      <p lang="ko" className="text-sm font-semibold text-ink">{explanation.word}</p>
      <p className="mt-1 text-sm leading-6 text-ink-secondary">{explanation.meaning}</p>
      {explanation.dictionaryForm ? (
        <p className="mt-1 text-xs text-ink-secondary">
          Dictionary form: <span lang="ko" className="text-ink-secondary">{explanation.dictionaryForm}</span>
        </p>
      ) : null}
      {explanation.nuance ? (
        <p className="mt-1 text-xs leading-5 text-ink-secondary">{explanation.nuance}</p>
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
        className="mt-3 flex items-center justify-between gap-3 rounded-md bg-jade-soft px-3 py-2"
      >
        <p className="text-xs text-jade-deep">{savedAsLearning ? "Added to learning" : "Marked as known"}</p>
        {onUndo ? (
          <button
            type="button"
            onClick={onUndo}
            className="rounded text-xs text-ink-secondary underline decoration-hairline-strong underline-offset-4 transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-primary"
          >
            Undo
          </button>
        ) : null}
      </div>
    );
  }

  if (learnerState.item?.state === "known") {
    if (!onMarkLearning) return <p className="mt-3 text-xs text-ink-secondary">You already marked this as known.</p>;
    return (
      <button
        type="button"
        onClick={onMarkLearning}
        className="mt-3 w-full rounded-lg border border-primary/40 px-3 py-1.5 text-sm text-primary-deep transition-colors hover:border-primary hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-primary"
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
        className="mt-3 w-full rounded-lg border border-jade/50 px-3 py-1.5 text-sm text-jade-deep transition-colors hover:border-jade hover:bg-jade-soft focus-visible:ring-2 focus-visible:ring-primary"
      >
        I know this
      </button>
    );
  }

  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {onMarkKnown ? (
        <button
          type="button"
          onClick={onMarkKnown}
          className="rounded-lg border border-jade/50 px-3 py-1.5 text-sm text-jade-deep transition-colors hover:border-jade hover:bg-jade-soft focus-visible:ring-2 focus-visible:ring-primary"
        >
          I know this
        </button>
      ) : null}
      {onMarkLearning ? (
        <button
          type="button"
          onClick={onMarkLearning}
          className="rounded-lg bg-primary-hover px-3 py-1.5 text-sm font-medium text-on-primary transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-primary"
        >
          Learn this
        </button>
      ) : null}
    </div>
  );
}
