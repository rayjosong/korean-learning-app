"use client";

import { useEffect, useState } from "react";

import { loadProgressSnapshot, type ProgressSnapshotLoadResult } from "@/lib/load-progress-snapshot";
import type { ProgressSnapshot } from "@korean-learning/learning-engine/progress";
import type { ExplanationDatabase } from "@korean-learning/storage";

export type ProgressDashboardState =
  | { status: "loading" }
  | ProgressSnapshotLoadResult;

const EMPTY_SNAPSHOT: ProgressSnapshot = {
  knownItems: 0,
  learningItems: 0,
  reviewSuccess: { successful: 0, total: 0, percentage: null },
  explanationFrequency: { count: 0, windowDays: 7 },
  contentStudied: 0
};

export function ProgressDashboardView({ state }: { state: ProgressDashboardState }) {
  if (state.status === "loading") return <p role="status" className="text-sm text-ink-muted">Loading progress…</p>;
  if (state.status === "error") return <p role="alert" className="rounded-lg border border-error/30 bg-surface-elevated px-3 py-2 text-sm text-error">Progress unavailable: {state.message}</p>;

  const { snapshot } = state;
  const reviewText = snapshot.reviewSuccess.percentage === null
    ? "No reviews yet"
    : `${snapshot.reviewSuccess.successful}/${snapshot.reviewSuccess.total} successful (${snapshot.reviewSuccess.percentage}%)`;

  return (
    <div className="grid grid-cols-2 gap-3" aria-label="Progress metrics">
      <Metric label="Known items" value={snapshot.knownItems} />
      <Metric label="Learning items" value={snapshot.learningItems} />
      <Metric label="Review success" value={reviewText} />
      <Metric label="Content studied" value={snapshot.contentStudied} />
      <div className="col-span-2 rounded-lg bg-surface-subtle p-3">
        <p className="text-xs uppercase tracking-wide text-ink-secondary">Explanation activity</p>
        <p className="mt-1 text-sm text-ink">{snapshot.explanationFrequency.count} in the last {snapshot.explanationFrequency.windowDays} days</p>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-lg bg-surface-subtle p-3"><p className="text-xs uppercase tracking-wide text-ink-secondary">{label}</p><p className="mt-1 text-lg font-semibold text-ink">{value}</p></div>;
}

export function ProgressDashboard({ database, refreshKey }: { database?: ExplanationDatabase; refreshKey: number }) {
  const [state, setState] = useState<ProgressDashboardState>({ status: "ready", snapshot: EMPTY_SNAPSHOT });

  useEffect(() => {
    if (!database) return;
    let cancelled = false;
    setState({ status: "loading" });
    void loadProgressSnapshot(database).then((result) => {
      if (!cancelled) setState(result);
    });
    return () => { cancelled = true; };
  }, [database, refreshKey]);

  return (
    <section className="rounded-xl border border-hairline bg-surface-elevated p-4" aria-label="Progress dashboard">
      <h2 className="font-semibold text-ink">Progress</h2>
      <p className="mb-4 mt-1 text-xs leading-5 text-ink-muted">Activity from this device. Review success includes its denominator.</p>
      <ProgressDashboardView state={state} />
    </section>
  );
}
