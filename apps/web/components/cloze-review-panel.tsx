"use client";

import { useEffect, useState } from "react";

import { completeClozeReview } from "@/lib/complete-cloze-review";
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
    try { await completeClozeReview({ database, review, outcome }); onReviewComplete(); }
    finally { setIsSaving(false); }
  }

  return <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl" aria-label="Cloze review">
    <h2 className="font-semibold text-white">Cloze review</h2>
    <p className="mt-1 text-xs leading-5 text-slate-500">Recall the missing word from a real sentence, then grade your answer.</p>
    {status === "loading" ? <p role="status" className="mt-4 text-sm text-slate-400">Loading due reviews…</p> : null}
    {status === "error" ? <p role="alert" className="mt-4 text-sm text-rose-300">Due reviews could not be loaded.</p> : null}
    {status === "ready" && !review ? <p className="mt-4 text-sm text-slate-400">Nothing is due right now. Keep learning from real Korean content.</p> : null}
    {status === "ready" && review ? <div className="mt-4 rounded-lg bg-slate-950/60 p-4">
      {review.context ? <p lang="ko" className="text-lg leading-8 text-slate-100">{maskAnswer(review.context.sentence, review.item.text)}</p> : <p className="text-sm text-slate-400">No source sentence is available. Reveal the item to review it.</p>}
      {revealed ? <p lang="ko" className="mt-4 rounded-md border border-sky-900/70 bg-sky-950/30 px-3 py-2 text-base text-sky-100">Answer: {review.item.text}</p> : <button type="button" onClick={() => setRevealed(true)} className="mt-4 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-sky-400">Reveal answer</button>}
      {revealed ? <div className="mt-4 flex gap-2"><button type="button" disabled={isSaving} onClick={() => void finish("failure")} className="rounded-lg border border-rose-800 px-3 py-2 text-sm text-rose-200 disabled:opacity-50">I missed it</button><button type="button" disabled={isSaving} onClick={() => void finish("success")} className="rounded-lg bg-sky-400 px-3 py-2 text-sm font-medium text-slate-950 disabled:opacity-50">I got it</button></div> : null}
    </div> : null}
  </section>;
}

export function maskAnswer(sentence: string, answer: string): string {
  const normalized = answer.trim();
  if (!normalized) return sentence;
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return sentence.replace(new RegExp(escaped), "____");
}
