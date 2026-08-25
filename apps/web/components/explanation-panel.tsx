import type { SentenceExplanation } from "@korean-learning/ai";

import type { TranscriptSegment } from "@/lib/transcript";
import type { SentenceExplanationState } from "@/lib/use-sentence-explanation";

export interface ExplanationPanelProps {
  segment?: TranscriptSegment;
  state: SentenceExplanationState;
  onRetry?: () => void;
}

export function ExplanationPanel({ segment, state, onRetry }: ExplanationPanelProps) {
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
        <ExplanationContent explanation={state.explanation} />
      ) : null}
    </section>
  );
}

function ExplanationContent({ explanation }: { explanation: SentenceExplanation }) {
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
              <dt lang="ko" className="text-sm font-medium text-slate-100">{item.text}</dt>
              <dd className="text-sm leading-6 text-slate-400">
                {item.meaning}
                {item.role ? <span className="text-slate-500"> · {item.role}</span> : null}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {explanation.grammar.length > 0 ? (
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

      {explanation.nuance ? (
        <section className="mt-4" aria-label="Nuance">
          <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-slate-500">Nuance</h3>
          <p className="mt-1.5 text-sm leading-6 text-slate-300">{explanation.nuance}</p>
        </section>
      ) : null}
    </article>
  );
}
