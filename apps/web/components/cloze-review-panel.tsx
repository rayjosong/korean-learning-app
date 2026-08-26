"use client";

import { useEffect, useState } from "react";

import { completeReview } from "@/lib/complete-cloze-review";
import type { ReviewMode } from "@korean-learning/learning-engine";
import {
  getDueReviewItems,
  type DueReviewItem,
  type ExplanationDatabase
} from "@korean-learning/storage";

export interface ClozeReviewPanelProps {
  database?: ExplanationDatabase;
  refreshKey: number;
  sessionLimit?: number;
  onReviewComplete: () => void;
}

export function ClozeReviewPanel({ database, refreshKey, sessionLimit = 5, onReviewComplete }: ClozeReviewPanelProps) {
  const [items, setItems] = useState<DueReviewItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [revealed, setRevealed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState<ReviewMode>("cloze");

  useEffect(() => {
    let cancelled = false;
    setRevealed(false);
    if (!database) { setStatus("error"); return () => { cancelled = true; }; }
    setStatus("loading");
    void getDueReviewItems(database, { now: new Date().toISOString(), limit: sessionLimit })
      .then((due) => { if (!cancelled) { setItems(due); setStatus("ready"); } })
      .catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; };
  }, [database, refreshKey, sessionLimit]);

  const review = items[0];
  async function finish(outcome: "success" | "failure") {
    if (!database || !review) return;
    setIsSaving(true);
    try { await completeReview({ database, review, outcome, mode }); onReviewComplete(); }
    finally { setIsSaving(false); }
  }

  const prompt = mode === "production" ? "Produce the highlighted Korean from its meaning and context, then grade yourself." : mode === "recognition" ? "Recognize the Korean item from a real sentence, then grade yourself." : "Recall the missing word from a real sentence, then grade your answer.";
  return <section className="rounded-xl border border-hairline bg-surface-elevated p-4" aria-label="Mixed review">
    <h2 className="font-semibold text-ink">Mixed review</h2>
    <fieldset className="mt-3 flex gap-2" aria-label="Review mode">
      {(["recognition", "production", "cloze"] as const).map((reviewMode) => <button key={reviewMode} type="button" aria-pressed={mode === reviewMode} onClick={() => { setMode(reviewMode); setRevealed(false); }} className={`rounded-lg border px-2 py-1 text-xs capitalize transition-colors focus-visible:ring-2 focus-visible:ring-primary ${mode === reviewMode ? "border-primary/50 bg-primary-soft font-semibold text-primary-deep" : "border-hairline-strong text-ink-secondary hover:border-primary hover:text-ink"}`}>{reviewMode}</button>)}
    </fieldset>
    <p className="mt-2 text-xs leading-5 text-ink-muted">{prompt}</p>
    {status === "loading" ? <p role="status" className="mt-4 text-sm text-ink-muted">Loading due reviews…</p> : null}
    {status === "error" ? <p role="alert" className="mt-4 text-sm text-error">Due reviews could not be loaded.</p> : null}
    {status === "ready" && !review ? <p className="mt-4 text-sm text-ink-muted">Nothing is due right now. Keep learning from real Korean content.</p> : null}
    {status === "ready" && review ? <div className="mt-4 rounded-lg bg-surface-subtle p-4">
      {review.context ? <p lang="ko" className="text-lg leading-8 text-ink">{mode === "cloze" ? maskAnswer(review.context.sentence, review.item.text) : review.context.sentence}</p> : <p className="text-sm text-ink-secondary">No source sentence is available. Reveal the item to review it.</p>}
      {revealed ? <p lang="ko" className="mt-4 rounded-md border border-hairline bg-surface-elevated px-3 py-2 text-base text-ink">{mode === "production" ? "Produce" : "Answer"}: {review.item.text}</p> : <button type="button" onClick={() => setRevealed(true)} className="mt-4 rounded-lg border border-hairline-strong px-3 py-2 text-sm text-ink-secondary transition-colors hover:border-primary hover:text-ink focus-visible:ring-2 focus-visible:ring-primary">Reveal answer</button>}
      {revealed ? <div className="mt-4 flex gap-2"><button type="button" disabled={isSaving} onClick={() => void finish("failure")} className="rounded-lg border border-error/40 px-3 py-2 text-sm text-error transition-colors hover:border-error disabled:opacity-50">I missed it</button><button type="button" disabled={isSaving} onClick={() => void finish("success")} className="rounded-lg bg-primary-hover px-3 py-2 text-sm font-medium text-on-primary transition hover:brightness-95 disabled:opacity-50">I got it</button></div> : null}
    </div> : null}
  </section>;
}

export function maskAnswer(sentence: string, answer: string): string {
  const normalized = answer.trim();
  if (!normalized) return sentence;
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return sentence.replace(new RegExp(escaped), "____");
}
