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
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl" aria-label="Review queue">
      <h2 className="font-semibold text-white">Review queue</h2>
      <p className="mt-1 text-xs leading-5 text-slate-500">Up to {sessionLimit} due items, starting with the oldest review.</p>
      {state.status === "loading" ? <p role="status" className="mt-4 text-sm text-slate-400">Loading due reviews…</p> : null}
      {state.status === "error" ? <p role="alert" className="mt-4 text-sm text-rose-300">Due reviews could not be loaded.</p> : null}
      {state.status === "ready" && state.items.length === 0 ? <p className="mt-4 text-sm leading-6 text-slate-400">Nothing is due right now. Keep learning from real Korean content.</p> : null}
      {state.status === "ready" && state.items.length > 0 ? (
        <ol className="mt-4 space-y-3">
          {state.items.map(({ item, context }) => (
            <li key={item.id} className="rounded-lg bg-slate-950/60 p-3">
              <p lang="ko" className="text-base font-medium text-slate-100">{item.text}</p>
              {context ? (
                <p lang="ko" className="mt-2 text-sm leading-6 text-slate-300">{context.sentence}</p>
              ) : (
                <p className="mt-2 text-sm text-slate-500">No source sentence is available for this item.</p>
              )}
              {context ? <p className="mt-2 text-xs text-slate-500">{context.videoId} · {formatTimestamp(context.startTimeMs)}</p> : null}
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
