"use client";

import { useEffect, useState } from "react";

import {
  getDueReviewItems,
  type DueReviewItem,
  type ExplanationDatabase
} from "@korean-learning/storage";

export interface ReviewQueuePanelProps {
  database?: ExplanationDatabase;
  /** Increment after learner-state changes so newly due items are reflected. */
  refreshKey: number;
  /** Maximum cards shown in one session. */
  sessionLimit?: number;
}

interface ReviewQueueState {
  status: "loading" | "ready" | "error";
  items: DueReviewItem[];
}

const INITIAL_STATE: ReviewQueueState = { status: "loading", items: [] };

/** Displays a bounded, context-first queue without owning scheduling rules. */
export function ReviewQueuePanel({
  database,
  refreshKey,
  sessionLimit = 5
}: ReviewQueuePanelProps) {
  const [state, setState] = useState<ReviewQueueState>(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;
    if (!database) {
      setState({ status: "error", items: [] });
      return () => { cancelled = true; };
    }

    setState((current) => ({ ...current, status: "loading" }));
    void getDueReviewItems(database, { now: new Date().toISOString(), limit: sessionLimit })
      .then((items) => {
        if (!cancelled) setState({ status: "ready", items });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error", items: [] });
      });

    return () => { cancelled = true; };
  }, [database, refreshKey, sessionLimit]);

  return (
    <section className="rounded-xl border border-hairline bg-surface-elevated p-4" aria-label="Review queue">
      <h2 className="font-semibold text-ink">Review queue</h2>
      <p className="mt-1 text-xs leading-5 text-ink-muted">Up to {sessionLimit} due items, starting with the oldest review.</p>
      {state.status === "loading" ? <p role="status" className="mt-4 text-sm text-ink-muted">Loading due reviews…</p> : null}
      {state.status === "error" ? <p role="alert" className="mt-4 text-sm text-error">Due reviews could not be loaded.</p> : null}
      {state.status === "ready" && state.items.length === 0 ? <p className="mt-4 text-sm leading-6 text-ink-muted">Nothing is due right now. Keep learning from real Korean content.</p> : null}
      {state.status === "ready" && state.items.length > 0 ? (
        <ol className="mt-4 space-y-3">
          {state.items.map(({ item, context }) => (
            <li key={item.id} className="rounded-lg bg-surface-subtle p-3">
              <p lang="ko" className="text-base font-medium text-ink">{item.text}</p>
              {context ? (
                <p lang="ko" className="mt-2 text-sm leading-6 text-ink-secondary">{context.sentence}</p>
              ) : (
                <p className="mt-2 text-sm text-ink-secondary">No source sentence is available for this item.</p>
              )}
              {context ? <p className="mt-2 text-xs text-ink-secondary">{context.videoId} · {formatTimestamp(context.startTimeMs)}</p> : null}
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

function formatTimestamp(timeMs: number): string {
  const seconds = Math.max(0, Math.floor(timeMs / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
