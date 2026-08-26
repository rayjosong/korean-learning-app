"use client";

import { useEffect, useState } from "react";

import {
  getRecentExplanationRecords,
  getRecentLearningItems,
  type ExplanationDatabase,
  type ExplanationRecord,
  type RecentLearningItem
} from "@korean-learning/storage";

export interface LearningHistoryPanelProps {
  database?: ExplanationDatabase;
  /** Increment after a save so the panel reflects the learner's latest action. */
  refreshKey: number;
}

interface LearningHistoryState {
  status: "loading" | "ready" | "error";
  explanations: ExplanationRecord[];
  items: RecentLearningItem[];
}

const INITIAL_STATE: LearningHistoryState = {
  status: "loading",
  explanations: [],
  items: []
};

export function LearningHistoryPanel({ database, refreshKey }: LearningHistoryPanelProps) {
  const [state, setState] = useState<LearningHistoryState>(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;

    if (!database) {
      setState({ status: "error", explanations: [], items: [] });
      return () => {
        cancelled = true;
      };
    }

    setState((current) => ({ ...current, status: "loading" }));
    void Promise.all([
      getRecentExplanationRecords(database),
      getRecentLearningItems(database)
    ])
      .then(([explanations, items]) => {
        if (!cancelled) setState({ status: "ready", explanations, items });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error", explanations: [], items: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [database, refreshKey]);

  return (
    <section className="rounded-xl border border-hairline bg-surface-elevated p-4" aria-label="Learning history">
      <h2 className="font-semibold text-ink">Learning history</h2>
      <p className="mt-1 text-xs leading-5 text-ink-muted">
        Your latest explanations and words, stored only on this device.
      </p>

      {state.status === "loading" ? (
        <p role="status" className="mt-4 text-sm text-ink-muted">Loading recent activity…</p>
      ) : null}
      {state.status === "error" ? (
        <p role="alert" className="mt-4 text-sm text-error">Recent learning activity could not be loaded.</p>
      ) : null}
      {state.status === "ready" ? <HistoryContent explanations={state.explanations} items={state.items} /> : null}
    </section>
  );
}

function HistoryContent({
  explanations,
  items
}: {
  explanations: readonly ExplanationRecord[];
  items: readonly RecentLearningItem[];
}) {
  return (
    <div className="mt-4 space-y-5">
      <section aria-label="Recent explained sentences">
        <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-ink-muted">Recent explanations</h3>
        {explanations.length === 0 ? (
          <p className="mt-2 text-sm leading-6 text-ink-muted">Explain a sentence to see it here.</p>
        ) : (
          <ol className="mt-2 space-y-2">
            {explanations.map((record) => (
              <li key={record.key} className="rounded-lg bg-surface-subtle p-3">
                <p lang="ko" className="text-sm font-medium text-ink">{record.sentence}</p>
                <p className="mt-1 text-sm leading-5 text-ink-secondary">{record.explanation.naturalMeaning}</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-label="Recent learning items">
        <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-ink-muted">Recent learning items</h3>
        {items.length === 0 ? (
          <p className="mt-2 text-sm leading-6 text-ink-muted">Save a word or phrase to start your learning history.</p>
        ) : (
          <ol className="mt-2 space-y-2">
            {items.map(({ item, context }) => (
              <li key={item.id} className="rounded-lg bg-surface-subtle p-3">
                <div className="flex items-baseline justify-between gap-3">
                  <p lang="ko" className="text-sm font-medium text-ink">{item.text}</p>
                  <span className="text-xs capitalize text-ink-secondary">{item.state}</span>
                </div>
                {item.dictionaryForm ? (
                  <p className="mt-1 text-xs text-ink-secondary">
                    Dictionary form: <span lang="ko" className="text-ink-secondary">{item.dictionaryForm}</span>
                  </p>
                ) : null}
                {context ? (
                  <p className="mt-2 text-xs leading-5 text-ink-secondary">
                    <span className="text-ink-secondary">{context.videoId}</span>
                    <span className="text-ink-muted"> · </span>
                    {formatTimestamp(context.startTimeMs)}
                    <span className="text-ink-muted"> · </span>
                    <span lang="ko">{context.sentence}</span>
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function formatTimestamp(timeMs: number): string {
  const seconds = Math.max(0, Math.floor(timeMs / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}
