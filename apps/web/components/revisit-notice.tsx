"use client";

import { useEffect, useState } from "react";

import { loadRevisitProgress, type RevisitProgressLoadResult } from "@/lib/load-revisit-progress";
import type { ContentProgressComparison } from "@korean-learning/learning-engine/revisit";
import type { ExplanationDatabase } from "@korean-learning/storage";

function dateLabel(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "an earlier visit" : date.toLocaleDateString();
}

export function RevisitNoticeView({
  state,
  onReplay
}: {
  state: RevisitProgressLoadResult | { status: "loading" };
  onReplay?: () => void;
}) {
  if (state.status === "loading") return <p role="status" className="text-sm text-ink-muted">Checking your study history…</p>;
  if (state.status === "error") return <p role="alert" className="text-sm text-error">Revisit history unavailable: {state.message}</p>;

  const comparison = state.comparison;
  const { current, previous } = comparison;
  const comparisonText = comparison.status === "insufficient-history"
    ? "This visit is saved. Study it again later to compare your comprehension."
    : comparison.status === "improved"
      ? "Your estimated comprehension is higher than before."
      : comparison.status === "lower"
        ? "Your estimate is lower this time—no improvement is claimed."
        : "Your estimated comprehension is unchanged so far.";

  return (
    <section className="rounded-xl border border-jade/30 bg-jade-soft/50 p-4" aria-label="Revisit progress">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-ink">
            {previous ? "You studied this video before" : "Study history saved"}
          </h2>
          <p className="mt-1 text-sm text-ink-secondary">{comparisonText}</p>
        </div>
        {onReplay ? (
          <button type="button" onClick={onReplay} className="rounded-lg border border-jade/50 px-3 py-2 text-sm font-semibold text-jade-deep transition-colors hover:bg-jade-soft focus-visible:ring-2 focus-visible:ring-primary">
            Replay video
          </button>
        ) : null}
      </div>
      {previous ? (
        <div className="mt-3 grid gap-2 text-sm text-ink sm:grid-cols-3">
          <p><span className="text-ink-secondary">Then</span> {previous.likelyComprehension.min}–{previous.likelyComprehension.max}% · {dateLabel(previous.capturedAt)}</p>
          <p><span className="text-ink-secondary">Now</span> {current.likelyComprehension.min}–{current.likelyComprehension.max}%</p>
          <p><span className="text-ink-secondary">Elapsed</span> {formatElapsed(comparison)}</p>
        </div>
      ) : null}
    </section>
  );
}

function formatElapsed(comparison: ContentProgressComparison): string {
  if (comparison.elapsedDays === undefined) return "unknown";
  return comparison.elapsedDays === 1 ? "1 day" : String(comparison.elapsedDays) + " days";
}

export function RevisitNotice({
  database,
  videoId,
  segments,
  sessionId,
  onReplay
}: {
  database?: ExplanationDatabase;
  videoId: string;
  segments: readonly { text: string }[];
  sessionId: string;
  onReplay?: () => void;
}) {
  const [state, setState] = useState<RevisitProgressLoadResult | { status: "loading" }>({ status: "loading" });
  useEffect(() => {
    if (!database) return;
    let cancelled = false;
    setState({ status: "loading" });
    void loadRevisitProgress({ database, videoId, segments, sessionId }).then((result) => {
      if (!cancelled) setState(result);
    });
    return () => { cancelled = true; };
  }, [database, videoId, segments, sessionId]);
  return <RevisitNoticeView state={state} onReplay={onReplay} />;
}
