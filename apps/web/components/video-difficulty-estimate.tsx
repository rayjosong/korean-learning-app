"use client";

import { useEffect, useState } from "react";

import { loadVideoDifficulty, type VideoDifficultyLoadResult } from "@/lib/load-video-difficulty";
import { shouldShowDifficultyWarning, type DifficultyEstimate } from "@korean-learning/learning-engine/video-difficulty";
import type { ExplanationDatabase } from "@korean-learning/storage";

import { DifficultContentWarning } from "./difficult-content-warning";

export type VideoDifficultyEstimateState =
  | { status: "loading" }
  | VideoDifficultyLoadResult;

function bandLabel(band: DifficultyEstimate["band"]): string {
  if (band === "beginner-friendly") return "Beginner-friendly";
  if (band === "intermediate") return "Intermediate";
  return "Challenging";
}

function reasonLabel(reason: string): string {
  if (reason === "known-coverage") return "matched against your saved learning state";
  if (reason === "long-segments") return "some segments are long";
  if (reason === "repetition") return "repeated phrases may help";
  return "based on transcript signals only";
}

export function VideoDifficultyEstimateView({ state }: { state: VideoDifficultyEstimateState }) {
  if (state.status === "loading") return <p className="text-sm text-ink-muted">Estimating difficulty…</p>;
  if (state.status === "error") return <p role="alert" className="text-sm text-error">Estimate unavailable: {state.message}</p>;

  const { estimate } = state;
  const sourceText = estimate.source === "personalized"
    ? "Personalized from your saved learning state."
    : "Starter estimate—learn a few items to personalize it.";
  return (
    <section className="rounded-xl border border-hairline bg-surface-elevated p-4" aria-label="Video difficulty estimate">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold text-ink">Video difficulty: {bandLabel(estimate.band)}</h2>
        <span className="text-sm text-ink-secondary">
          Likely comprehension: {estimate.likelyComprehension.min}–{estimate.likelyComprehension.max}%
        </span>
      </div>
      <p className="mt-1 text-xs leading-5 text-ink-muted">{sourceText}</p>
      <ul className="mt-2 flex flex-wrap gap-2 text-xs text-ink-secondary">
        {estimate.reasonCodes.map((reason) => <li key={reason} className="rounded-full bg-surface-subtle px-2 py-1">{reasonLabel(reason)}</li>)}
      </ul>
      <p className="mt-3 text-xs text-ink-muted">This is guidance only. The full video and transcript remain available for study.</p>
    </section>
  );
}

export function VideoDifficultyEstimate({
  database,
  segments,
  refreshKey
}: {
  database?: ExplanationDatabase;
  segments: readonly { text: string }[];
  refreshKey: number;
}) {
  const [state, setState] = useState<VideoDifficultyEstimateState>({ status: "loading" });
  const [warningDismissed, setWarningDismissed] = useState(false);

  useEffect(() => {
    if (!database) return;
    let cancelled = false;
    setState({ status: "loading" });
    void loadVideoDifficulty(database, segments).then((result) => {
      if (!cancelled) setState(result);
    });
    return () => { cancelled = true; };
  }, [database, segments, refreshKey]);

  return (
    <div className="flex flex-col gap-4">
      <VideoDifficultyEstimateView state={state} />
      {state.status === "ready" && shouldShowDifficultyWarning(state.estimate) && !warningDismissed ? (
        <DifficultContentWarning
          estimate={state.estimate}
          onContinue={() => setWarningDismissed(true)}
          onDismiss={() => setWarningDismissed(true)}
        />
      ) : null}
    </div>
  );
}
