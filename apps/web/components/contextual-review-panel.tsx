"use client";

import { useEffect, useState } from "react";

import {
  completeContextualReview,
  loadNextContextualReview,
  revealReviewAnswer,
  type ContextualReviewSession
} from "@/lib/review-session";
import { reviewClipWindow } from "@/lib/review-context";
import type { ReviewClipAdapter, ReviewClipStatus } from "@/lib/review-clip-adapter";
import type { ExplanationDatabase, LearningContextRecord } from "@korean-learning/storage";
import type { ReviewOutcome } from "@korean-learning/learning-engine";

export interface ContextualReviewPanelProps {
  database?: ExplanationDatabase;
  refreshKey: number;
  clipAdapter?: ReviewClipAdapter;
  onReviewComplete: () => void;
  onReturnToSource?: (context: LearningContextRecord) => void;
}

export function ContextualReviewPanel({
  database,
  refreshKey,
  clipAdapter,
  onReviewComplete,
  onReturnToSource
}: ContextualReviewPanelProps) {
  const [session, setSession] = useState<ContextualReviewSession>();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [revealed, setRevealed] = useState(false);
  const [clipStatus, setClipStatus] = useState<ReviewClipStatus>("unavailable");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setSession(undefined);
    setRevealed(false);
    setClipStatus("unavailable");
    if (!database) {
      setStatus("error");
      return () => { cancelled = true; };
    }
    void loadNextContextualReview(database, new Date().toISOString())
      .then((next) => {
        if (cancelled) return;
        setSession(next);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => { cancelled = true; };
  }, [database, refreshKey]);

  useEffect(() => {
    if (!session?.context || !clipAdapter) return;
    try {
      setClipStatus(clipAdapter.loadClip({
        videoId: session.context.videoId,
        window: reviewClipWindow(session.context)
      }));
    } catch {
      setClipStatus("unavailable");
    }
  }, [session?.context?.id]);

  async function finish(outcome: ReviewOutcome) {
    if (!database || !session || saving) return;
    setSaving(true);
    try {
      await completeContextualReview(database, {
        review: session.review,
        outcome,
        now: new Date().toISOString()
      });
      onReviewComplete();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-hairline bg-surface-elevated p-5" aria-label="Contextual review">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">Review in context</p>
          <h2 className="mt-1 font-semibold text-ink">Recall from the original video</h2>
        </div>
      </div>

      {status === "loading" ? <p role="status" className="mt-4 text-sm text-ink-muted">Loading your next review...</p> : null}
      {status === "error" ? <p role="alert" className="mt-4 text-sm text-error">Your next review could not be loaded.</p> : null}
      {status === "ready" && !session ? <p className="mt-4 text-sm leading-6 text-ink-muted">Nothing is due right now. Keep learning from real Korean content.</p> : null}

      {status === "ready" && session && !session.context ? (
        <div className="mt-4 rounded-lg border border-hairline bg-surface-subtle p-4">
          <p lang="ko" className="text-lg leading-8 text-ink">{session.review.item.text}</p>
          <p className="mt-2 text-sm leading-6 text-ink-secondary">This item has no playable source context. Continue with the compatible mixed review below.</p>
        </div>
      ) : null}

      {status === "ready" && session?.context ? (
        <div className="mt-5">
          <div className="rounded-lg border border-hairline bg-surface-subtle p-4">
            <p lang="ko" className="text-xl leading-9 text-ink">{session.context.sentence}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
              <span>{formatTimestamp(session.context.startTimeMs)}</span>
              <span aria-hidden="true">·</span>
              <span className="text-ink-secondary">Source video</span>
              <button
                type="button"
                onClick={() => onReturnToSource?.(session.context!)}
                className="rounded-md px-1 text-primary-deep underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-primary"
              >
                Return to source
              </button>
            </div>
            {clipStatus === "available" ? (
              <button type="button" onClick={() => {
                  if (!clipAdapter) return;
                  const context = session.context;
                  if (!context) return;
                  clipAdapter.loadClip({
                    videoId: context.videoId,
                    window: reviewClipWindow(context)
                  });
                  clipAdapter.play();
                }} className="mt-4 rounded-lg border border-hairline-strong px-3 py-2 text-sm text-ink-secondary hover:border-primary hover:text-ink focus-visible:ring-2 focus-visible:ring-primary">
                Play source clip
              </button>
            ) : (
              <p role="status" className="mt-4 text-sm leading-6 text-ink-secondary">The source clip is unavailable. You can still review this sentence and return to its timestamp.</p>
            )}
          </div>

          {!revealed ? (
            <button
              type="button"
              onClick={() => {
                revealReviewAnswer(session);
                setRevealed(true);
              }}
              className="mt-5 rounded-lg bg-primary-hover px-4 py-2 text-sm font-medium text-on-primary transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-primary"
            >
              Reveal meaning
            </button>
          ) : (
            <div className="mt-5" aria-live="polite">
              <p className="rounded-lg border border-hairline bg-surface-elevated px-4 py-3 text-sm leading-6 text-ink-secondary">
                {session.naturalMeaning ?? "Return to the source context to reinforce the meaning of this learned phrase."}
              </p>
              <div className="mt-4 flex gap-2">
                <button type="button" disabled={saving} onClick={() => void finish("failure")} className="rounded-lg border border-error/40 px-3 py-2 text-sm text-error hover:border-error disabled:opacity-50">Again</button>
                <button type="button" disabled={saving} onClick={() => void finish("success")} className="rounded-lg bg-primary-hover px-3 py-2 text-sm font-medium text-on-primary hover:brightness-95 disabled:opacity-50">Got it</button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

function formatTimestamp(timeMs: number): string {
  const seconds = Math.max(0, Math.floor(timeMs / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
