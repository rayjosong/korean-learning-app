"use client";

import { useEffect, useState } from "react";

import { loadProgressSnapshot, type ProgressSnapshotLoadResult } from "@/lib/load-progress-snapshot";
import type { ProgressSnapshot } from "@korean-learning/learning-engine/progress";
import { ExplanationDatabase, type ExplanationDatabase as ExplanationDatabaseType } from "@korean-learning/storage";

export type ProgressDashboardState =
  | { status: "loading" }
  | ProgressSnapshotLoadResult;

const EMPTY_SNAPSHOT: ProgressSnapshot = {
  knownItems: 0,
  learningItems: 0,
  reviewSuccess: { successful: 0, total: 0, percentage: null, windowDays: 30 },
  explanationFrequency: { count: 0, windowDays: 7 },
  contentStudied: 0
};

function isFullyEmpty(snapshot: ProgressSnapshot): boolean {
  return snapshot.knownItems === 0 &&
    snapshot.learningItems === 0 &&
    snapshot.reviewSuccess.total === 0 &&
    snapshot.explanationFrequency.count === 0 &&
    snapshot.contentStudied === 0;
}

export function ProgressDashboardView({ state }: { state: ProgressDashboardState }) {
  if (state.status === "loading") {
    return <p role="status" className="border-y border-hairline py-8 text-sm text-ink-muted">Loading local learning evidence...</p>;
  }

  if (state.status === "error") {
    return <p role="alert" className="rounded-lg border border-error/30 bg-surface-elevated px-4 py-3 text-sm text-error">Progress unavailable: {state.message}</p>;
  }

  const { snapshot } = state;
  if (isFullyEmpty(snapshot)) {
    return (
      <section className="border-y border-hairline py-10" aria-labelledby="progress-empty-title">
        <h2 id="progress-empty-title" className="text-xl font-semibold tracking-tight text-ink">Your learning evidence will build here.</h2>
        <p className="mt-3 max-w-xl leading-7 text-ink-secondary">Study Korean content, save phrases, request explanations, and complete reviews. This page stays local to this browser and shows the evidence those actions create.</p>
        <a href="/" className="mt-6 inline-flex rounded-lg bg-primary-hover px-4 py-2 text-sm font-semibold text-on-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">Start learning</a>
      </section>
    );
  }

  const review = snapshot.reviewSuccess;
  const reviewText = review.percentage === null
    ? "No recent reviews"
    : `${review.successful} of ${review.total} recalled (${review.percentage}%)`;

  return (
    <div className="space-y-10">
      <section className="border-y border-hairline py-7" aria-labelledby="recent-recall-title">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary-deep">Recent improvement</p>
        <h2 id="recent-recall-title" className="mt-2 text-2xl font-semibold tracking-tight text-ink">Review recall</h2>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">{reviewText}</p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-secondary">
          {review.percentage === null
            ? `Complete reviews to create recall evidence for this ${review.windowDays}-day window.`
            : `Successful reviews out of all completed reviews in the last ${review.windowDays} days. This is recall evidence, not a measure of total Korean comprehension.`}
        </p>
      </section>

      <section aria-labelledby="learning-state-title">
        <h2 id="learning-state-title" className="text-lg font-semibold text-ink">Learning state</h2>
        <dl className="mt-4 grid gap-6 sm:grid-cols-2">
          <EvidenceTerm label="Known phrases and words" value={snapshot.knownItems} tone="known" />
          <EvidenceTerm label="Learning phrases and words" value={snapshot.learningItems} />
        </dl>
      </section>

      <section className="border-t border-hairline pt-8" aria-labelledby="activity-title">
        <h2 id="activity-title" className="text-lg font-semibold text-ink">Learning activity</h2>
        <dl className="mt-4 grid gap-6 sm:grid-cols-2">
          <EvidenceTerm label={`Explanations in the last ${snapshot.explanationFrequency.windowDays} days`} value={snapshot.explanationFrequency.count} />
          <EvidenceTerm label="Distinct content studied" value={snapshot.contentStudied} />
        </dl>
        <p className="mt-6 max-w-2xl text-sm leading-6 text-ink-muted">Content-level Then vs Now comparisons need revisit evidence and will appear separately when they are meaningful.</p>
      </section>
    </div>
  );
}

function EvidenceTerm({ label, value, tone }: { label: string; value: number; tone?: "known" }) {
  return (
    <div className="border-l-2 border-hairline-strong pl-4">
      <dt className="text-sm text-ink-secondary">{label}</dt>
      <dd className={`mt-1 text-2xl font-semibold tracking-tight ${tone === "known" ? "text-jade-deep" : "text-ink"}`}>{value}</dd>
    </div>
  );
}

export function ProgressDashboard({ database, refreshKey }: { database?: ExplanationDatabaseType; refreshKey?: number }) {
  const [ownedDatabase] = useState(() => typeof window === "undefined" ? undefined : new ExplanationDatabase());
  const activeDatabase = database ?? ownedDatabase;
  const [state, setState] = useState<ProgressDashboardState>({ status: "loading" });
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!activeDatabase) return;
    let cancelled = false;
    setState({ status: "loading" });
    void loadProgressSnapshot(activeDatabase).then((result) => {
      if (!cancelled) setState(result);
    });
    return () => { cancelled = true; };
  }, [activeDatabase, refreshKey, retryKey]);

  return (
    <section aria-label="Progress dashboard">
      <ProgressDashboardView state={state} />
      {state.status === "error" ? (
        <button type="button" onClick={() => setRetryKey((value) => value + 1)} className="mt-4 rounded-lg border border-hairline-strong px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">Retry</button>
      ) : null}
    </section>
  );
}
