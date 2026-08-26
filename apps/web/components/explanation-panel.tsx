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
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl" aria-label="Sentence explanation">
      <h2 className="mb-3 font-semibold text-white">Explanation</h2>

      {state.status === "idle" ? (
        <p className="text-sm leading-6 text-slate-400">
          Click a Korean sentence in the transcript to see its natural meaning, breakdown, and grammar.
        </p>
      ) : null}

      {state.status === "loading" ? (
        <div role="status" aria-live="polite">
          <p className="animate-pulse text-sm font-medium text-sky-300">Explaining the sentence…</p>
          {segment ? <p lang="ko" className="mt-3 text-sm leading-6 text-slate-300">{segment.text}</p> : null}
          <div className="mt-4 space-y-2">
            <div className="h-4 w-11/12 animate-pulse rounded bg-slate-800" />
            <div className="h-4 w-9/12 animate-pulse rounded bg-slate-800" />
            <div className="h-4 w-10/12 animate-pulse rounded bg-slate-800" />
          </div>
        </div>
      ) : null}

      {state.status === "error" ? (
        <div role="alert">
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
      <p lang="ko" className="text-base font-semibold leading-7 text-white">{explanation.sentence}</p>
      {explanation.speechLevel ? (
        <p className="mt-1 inline-block rounded-full bg-sky-400/15 px-2.5 py-0.5 text-xs text-sky-300">{explanation.speechLevel}</p>
      ) : null}

      <section className="mt-4" aria-label="Natural meaning">
        <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-sky-300">Natural meaning</h3>
        <p className="mt-1.5 text-lg font-medium leading-7 text-white">{explanation.naturalMeaning}</p>
      </section>

      <section className="mt-4" aria-label="Breakdown">
        <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-slate-500">Breakdown</h3>
        <dl className="mt-1.5 space-y-1.5">
          {explanation.breakdown.map((item) => (
            <div key={`${item.text}-${item.meaning}`} className="grid grid-cols-[auto_1fr] items-baseline gap-x-3">
              <dt lang="ko" className="text-sm font-medium text-slate-100">
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
              <dd className="text-sm leading-6 text-slate-400">
                {item.meaning}
                {item.role ? <span className="text-slate-500"> · {item.role}</span> : null}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {progressive ? (
        <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-800 pt-3 text-xs">
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
          <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-slate-500">Grammar</h3>
          <ul className="mt-1.5 space-y-1.5">
            {explanation.grammar.map((item) => (
              <li key={`${item.form}-${item.explanation}`} className="text-sm leading-6 text-slate-300">
                <span lang="ko" className="font-medium text-slate-100">{item.form}</span>
                <span className="text-slate-500"> — </span>
                {item.explanation}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!progressive && explanation.nuance ? (
        <section className="mt-4" aria-label="Nuance">
          <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-slate-500">Nuance</h3>
          <p className="mt-1.5 text-sm leading-6 text-slate-300">{explanation.nuance}</p>
        </section>
      ) : null}

      {progressive && openSection === "grammar" && explanation.grammar.length > 0 ? (
        <section className="mt-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3" aria-label="Grammar">
          <ul className="space-y-1.5">
            {explanation.grammar.map((item) => <li key={`${item.form}-${item.explanation}`} className="text-sm leading-6 text-slate-300"><span lang="ko" className="font-medium text-slate-100">{item.form}</span><span className="text-slate-500"> — </span>{item.explanation}</li>)}
          </ul>
        </section>
      ) : null}
      {progressive && openSection === "nuance" && explanation.nuance ? (
        <section className="mt-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3" aria-label="Nuance"><p className="text-sm leading-6 text-slate-300">{explanation.nuance}</p></section>
      ) : null}
      {progressive && openSection === "examples" ? (
        <section className="mt-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3" aria-label="More examples"><p className="text-sm leading-6 text-slate-400">More examples will stay tied to this sentence and its spoken patterns.</p></section>
      ) : null}
    </article>
  );
}

function DisclosureButton({ label, open, onClick }: { label: string; open: boolean; onClick: () => void }) {
  return <button type="button" aria-expanded={open} onClick={onClick} className={`font-semibold transition-colors hover:text-white ${open ? "text-[#C7654C]" : "text-slate-400"}`}>{open ? `Hide ${label}` : label}</button>;
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
        className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3"
      >
        <p className="animate-pulse text-sm font-medium text-sky-300">
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
        className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3"
      >
        <p className="text-sm leading-6 text-rose-300">{state.error}</p>
      </aside>
    );
  }

  const explanation = state.explanation;
  if (!explanation) return null;

  return (
    <aside aria-label="Word explanation" className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
      <p lang="ko" className="text-sm font-semibold text-white">{explanation.word}</p>
      <p className="mt-1 text-sm leading-6 text-slate-200">{explanation.meaning}</p>
      {explanation.dictionaryForm ? (
        <p className="mt-1 text-xs text-slate-500">
          Dictionary form: <span lang="ko" className="text-slate-400">{explanation.dictionaryForm}</span>
        </p>
      ) : null}
      {explanation.nuance ? (
        <p className="mt-1 text-xs leading-5 text-slate-500">{explanation.nuance}</p>
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
        className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-emerald-400/10 px-3 py-2"
      >
        <p className="text-xs text-emerald-300">{savedAsLearning ? "Added to learning" : "Marked as known"}</p>
        {onUndo ? (
          <button
            type="button"
            onClick={onUndo}
            className="rounded text-xs text-slate-400 underline decoration-slate-600 underline-offset-4 transition-colors hover:text-white hover:decoration-slate-300"
          >
            Undo
          </button>
        ) : null}
      </div>
    );
  }

  if (learnerState.item?.state === "known") {
    if (!onMarkLearning) return <p className="mt-3 text-xs text-slate-500">You already marked this as known.</p>;
    return (
      <button
        type="button"
        onClick={onMarkLearning}
        className="mt-3 w-full rounded-lg border border-sky-500/40 px-3 py-1.5 text-sm text-sky-300 transition-colors hover:border-sky-400 hover:bg-sky-400/10 hover:text-sky-200"
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
        className="mt-3 w-full rounded-lg border border-emerald-500/40 px-3 py-1.5 text-sm text-emerald-300 transition-colors hover:border-emerald-400 hover:bg-emerald-400/10 hover:text-emerald-200"
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
          className="rounded-lg border border-emerald-500/40 px-3 py-1.5 text-sm text-emerald-300 transition-colors hover:border-emerald-400 hover:bg-emerald-400/10 hover:text-emerald-200"
        >
          I know this
        </button>
      ) : null}
      {onMarkLearning ? (
        <button
          type="button"
          onClick={onMarkLearning}
          className="rounded-lg border border-sky-500/40 px-3 py-1.5 text-sm text-sky-300 transition-colors hover:border-sky-400 hover:bg-sky-400/10 hover:text-sky-200"
        >
          Learn this
        </button>
      ) : null}
    </div>
  );
}
