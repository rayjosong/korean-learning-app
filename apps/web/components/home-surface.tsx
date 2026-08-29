"use client";

import { useEffect, useState, type FormEvent } from "react";

import {
  dismissHomeRecommendation,
  loadHomeSnapshot,
  type HomeContent,
  type HomeSnapshot
} from "@/lib/home";
import { formatTimestamp } from "@/lib/transcript";
import { ContextualReviewPanel } from "@/components/contextual-review-panel";
import { ClozeReviewPanel } from "@/components/cloze-review-panel";
import { ExplanationDatabase } from "@korean-learning/storage";

export interface HomeSurfaceProps {
  videoUrl: string;
  onVideoUrlChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onOpenContent: (content: HomeContent, positionMs?: number) => void;
  isLoading: boolean;
  error?: string;
  ready?: boolean;
}

export function HomeSurface({
  videoUrl,
  onVideoUrlChange,
  onSubmit,
  onOpenContent,
  isLoading,
  error,
  ready = true
}: HomeSurfaceProps) {
  const [database] = useState(() => (typeof window === "undefined" ? undefined : new ExplanationDatabase()));
  const [snapshot, setSnapshot] = useState<HomeSnapshot>();
  const [snapshotError, setSnapshotError] = useState<string>();
  const [isSnapshotLoading, setIsSnapshotLoading] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDismissing, setIsDismissing] = useState(false);
  const [dismissError, setDismissError] = useState<string>();

  useEffect(() => {
    if (!ready || !database) return;
    let cancelled = false;
    setIsSnapshotLoading(true);
    void loadHomeSnapshot(database)
      .then((result) => {
        if (cancelled) return;
        if (result.status === "error") {
          setSnapshot(undefined);
          setSnapshotError(result.message);
        } else {
          setSnapshot(result.snapshot);
          setSnapshotError(undefined);
          setDismissError(undefined);
        }
      })
      .finally(() => {
        if (!cancelled) setIsSnapshotLoading(false);
      });
    return () => { cancelled = true; };
  }, [database, ready, refreshKey]);

  const loadError = error ?? snapshotError;
  const recommendation = snapshot?.recommendation;
  const isRecommended = (type: string) => recommendation?.action.type === type;

  async function dismissRecommendation() {
    if (!database || !recommendation || isDismissing) return;
    setIsDismissing(true);
    setDismissError(undefined);
    try {
      await dismissHomeRecommendation(database, recommendation.fingerprint);
      setRefreshKey((value) => value + 1);
    } catch (caught) {
      setDismissError(caught instanceof Error ? caught.message : "The recommendation could not be dismissed.");
    } finally {
      setIsDismissing(false);
    }
  }

  function reviewAction() {
    setReviewOpen((open) => !open);
    window.setTimeout(() => document.getElementById("home-review-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  const revisitContent: HomeContent | undefined = recommendation?.action.type === "revisit"
    ? {
        videoId: recommendation.action.videoId,
        sourceUrl: recommendation.action.sourceUrl,
        ...(recommendation.reason.code === "revisit-ready" && recommendation.reason.title
          ? { title: recommendation.reason.title }
          : {})
      }
    : undefined;
  const contentItems = [
    ...(revisitContent ? [revisitContent] : []),
    ...(snapshot?.recommendedContent ?? []),
    ...(snapshot?.recentContent ?? [])
  ].filter((content, index, all) => all.findIndex((item) => item.videoId === content.videoId) === index).slice(0, 3);

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-10 max-w-2xl">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-primary-deep">Home</p>
        <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">안녕하세요.</h1>
        <p className="mt-4 text-lg leading-8 text-ink-secondary">Choose the next useful step in your Korean.</p>
      </header>

      {isSnapshotLoading ? <p role="status" className="mb-8 text-sm text-ink-muted">Loading your learning space...</p> : null}
      {loadError ? <p className="mb-8 rounded-lg border border-error/30 bg-surface-elevated px-4 py-3 text-sm text-error" role="alert">{loadError}</p> : null}
      {dismissError ? <p className="mb-8 rounded-lg border border-error/30 bg-surface-elevated px-4 py-3 text-sm text-error" role="alert">{dismissError}</p> : null}

      {!isSnapshotLoading && snapshot?.resume ? (
        <section aria-labelledby="continue-heading" className="mb-10">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-ink-muted">{isRecommended("resume") ? "Recommended next step" : "Next step"}</p>
          <h2 id="continue-heading" className="mb-3 text-2xl font-semibold tracking-tight text-ink">Continue learning</h2>
          <article className="flex flex-col gap-5 rounded-xl border border-hairline bg-surface-elevated p-5 shadow-[0_8px_30px_rgba(48,39,29,0.06)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xl font-medium text-ink">{snapshot.resume.title ?? "Your recent Korean video"}</p>
              <p id="continue-reason" className="mt-2 text-sm text-ink-secondary">
                {isRecommended("resume") ? recommendation?.reasonText : `Resume at ${formatTimestamp(snapshot.resume.lastPositionMs)}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onOpenContent(snapshot.resume!, snapshot.resume!.lastPositionMs)}
                aria-describedby={isRecommended("resume") ? "continue-reason" : undefined}
                className="rounded-lg bg-primary-hover px-5 py-3 text-sm font-semibold text-on-primary transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Continue <span aria-hidden="true">-&gt;</span>
              </button>
              {isRecommended("resume") ? (
                <button type="button" onClick={() => void dismissRecommendation()} disabled={isDismissing} aria-label="Dismiss resume recommendation" className="text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline disabled:opacity-50">
                  {isDismissing ? "Dismissing..." : "Dismiss"}
                </button>
              ) : null}
            </div>
          </article>
        </section>
      ) : null}

      {!isSnapshotLoading && snapshot && snapshot.dueReviewCount > 0 ? (
        <section aria-labelledby="review-heading" className="mb-10 border-y border-hairline py-5">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center justify-between gap-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
              onClick={reviewAction}
              aria-expanded={reviewOpen}
              aria-controls="home-review-panel"
            >
              <span>
                <span id="review-heading" className="block text-lg font-semibold text-ink">{snapshot.dueReviewCount} {snapshot.dueReviewCount === 1 ? "phrase" : "phrases"} ready for review</span>
                <span id="review-reason" className="mt-1 block text-sm text-ink-secondary">{isRecommended("review") ? recommendation?.reasonText : "Review them in the videos where you found them."}</span>
              </span>
              <span className="shrink-0 text-sm font-semibold text-primary-deep">{reviewOpen ? "Close" : "Review ->"}</span>
            </button>
            {isRecommended("review") ? (
              <button type="button" onClick={() => void dismissRecommendation()} disabled={isDismissing} aria-label="Dismiss review recommendation" className="shrink-0 text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline disabled:opacity-50">
                {isDismissing ? "Dismissing..." : "Dismiss"}
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      {!isSnapshotLoading && contentItems.length ? (
        <section aria-labelledby="content-heading" className="mb-10">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 id="content-heading" className="text-lg font-semibold text-ink">
              {revisitContent ? "Recommended / recent content" : snapshot?.recommendedContent?.length ? "Recommended / recent content" : "Recent content"}
            </h2>
            <span className="text-xs text-ink-muted">From your local library</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3" role="list" aria-label="Recent Korean content">
            {contentItems.map((content) => (
              <div key={content.videoId} role="listitem">
                <button
                  type="button"
                  onClick={() => onOpenContent(content)}
                  aria-label={content.videoId === revisitContent?.videoId ? `Revisit ${content.title ?? "Korean video"}` : undefined}
                  className="w-full rounded-lg border border-hairline bg-surface-subtle p-4 text-left transition hover:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <span lang="ko" className="block text-base font-medium leading-7 text-ink">{content.title ?? "Korean video"}</span>
                  <span className="mt-2 block text-xs text-ink-secondary">{content.videoId === revisitContent?.videoId ? recommendation?.reasonText : "Open in Watch"}</span>
                </button>
              </div>
            ))}
          </div>
          {isRecommended("revisit") ? (
            <button type="button" onClick={() => void dismissRecommendation()} disabled={isDismissing} aria-label="Dismiss revisit recommendation" className="mt-3 text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline disabled:opacity-50">
              {isDismissing ? "Dismissing..." : "Dismiss"}
            </button>
          ) : null}
        </section>
      ) : null}

      <section aria-labelledby="new-content-heading" className="border-t border-hairline pt-6">
        <h2 id="new-content-heading" className="text-lg font-semibold text-ink">Start something new</h2>
        <p className="mt-1 text-sm text-ink-secondary">{isRecommended("start-new") ? recommendation?.reasonText : "Paste a Korean YouTube URL to begin a Watch session."}</p>
        {isRecommended("start-new") ? (
          <button type="button" onClick={() => document.getElementById("video-url")?.focus()} className="sr-only">Start new content</button>
        ) : null}
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="video-url">Korean YouTube URL</label>
          <input
            id="video-url"
            type="url"
            required
            value={videoUrl}
            onChange={(event) => onVideoUrlChange(event.target.value)}
            placeholder="Paste a Korean YouTube URL"
            className="min-w-0 flex-1 rounded-lg border border-hairline-strong bg-surface-elevated px-4 py-3 text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-primary-hover px-5 py-3 font-semibold text-on-primary transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:cursor-wait disabled:opacity-60"
          >
            {isLoading ? "Loading transcript..." : "Load video"}
          </button>
          {isRecommended("start-new") ? (
            <button type="button" onClick={() => void dismissRecommendation()} disabled={isDismissing} aria-label="Dismiss start-new recommendation" className="text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline disabled:opacity-50">
              {isDismissing ? "Dismissing..." : "Dismiss"}
            </button>
          ) : null}
        </form>
      </section>

      {reviewOpen && database ? (
        <div id="home-review-panel" className="mt-8 grid gap-6 border-t border-hairline pt-8 md:grid-cols-2">
          <ContextualReviewPanel database={database} refreshKey={refreshKey} onReviewComplete={() => setRefreshKey((value) => value + 1)} />
          <ClozeReviewPanel database={database} refreshKey={refreshKey} onReviewComplete={() => setRefreshKey((value) => value + 1)} />
        </div>
      ) : null}
    </div>
  );
}
