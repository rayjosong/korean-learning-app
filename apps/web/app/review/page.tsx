"use client";

import { useEffect, useState } from "react";
import { ExplanationDatabase, getDueReviewCount } from "@korean-learning/storage";
import { ContextualReviewPanel } from "@/components/contextual-review-panel";

export default function ReviewPage() {
  const [database] = useState(() => (typeof window === "undefined" ? undefined : new ExplanationDatabase()));
  const [dueCount, setDueCount] = useState<number>(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!database) return;
    void getDueReviewCount(database, new Date().toISOString()).then((count) => {
      setDueCount(count);
    });
  }, [database, refreshKey]);

  return (
    <div className="max-w-[780px]" data-od-id="review-surface">
      <header className="mb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-primary-deep">
          Review in context
        </p>
        <h1 className="mt-2.5 text-4xl font-semibold tracking-[-0.04em] text-ink sm:text-5xl">
          {dueCount > 0
            ? `${dueCount} ${dueCount === 1 ? "phrase is" : "phrases are"} ready.`
            : "Review is clear."}
        </h1>
        <p className="mt-3 text-[17px] text-ink-muted">
          No streak to protect. Just another look at something you chose to keep.
        </p>
      </header>

      <div className="rounded-xl border border-hairline bg-surface p-7 shadow-editorial">
        <ContextualReviewPanel
          database={database}
          refreshKey={refreshKey}
          onReviewComplete={() => setRefreshKey((k) => k + 1)}
        />
      </div>
    </div>
  );
}
