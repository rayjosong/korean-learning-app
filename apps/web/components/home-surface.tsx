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

  const resume = snapshot?.resume;
  const dueCount = snapshot?.dueReviewCount ?? 0;

  return (
    <div className="space-y-12" data-od-id="today-surface">
      {/* Welcome Hero + Continue Note */}
      <section className="grid items-end gap-10 border-b border-hairline pb-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] lg:gap-14">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-primary-deep">
            Today’s reading · 안녕하세요.
          </p>
          <h1 className="mt-3 max-w-[14ch] text-4xl font-semibold tracking-[-0.04em] text-ink sm:text-5xl lg:text-6xl">
            Begin where the Korean feels alive.
          </h1>
          <p className="mt-4 max-w-[54ch] text-[17px] text-ink-muted">
            A reading desk for keeping the sentences that make you pause—while the source, context, and review stay close.
          </p>
        </div>

        {resume ? (
          <aside
            className="border-t-2 border-ink pt-4"
            data-od-id="continue-learning"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-primary-deep">
              Pick up the thread
            </p>
            <strong className="mt-1 block text-xl font-semibold tracking-tight text-ink">
              {resume.title ?? "Your recent Korean video"}
            </strong>
            <p className="mb-3 text-sm text-ink-muted">
              {formatTimestamp(resume.lastPositionMs)} explored
            </p>
            <div className="my-3 h-1 w-full bg-hairline">
              <div className="h-full w-1/2 bg-primary" />
            </div>
            <button
              type="button"
              onClick={() => onOpenContent(resume, resume.lastPositionMs)}
              className="mt-2 text-sm font-bold text-primary-deep hover:underline"
              data-od-id="continue-reading"
            >
              Return to the sentence →
            </button>
          </aside>
        ) : (
          <aside
            className="border-t-2 border-ink pt-4"
            data-od-id="continue-learning"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-primary-deep">
              Pick up the thread
            </p>
            <strong className="mt-1 block text-xl font-semibold tracking-tight text-ink">
              성시경 먹을텐데
            </strong>
            <p className="mb-3 text-sm text-ink-muted">
              12:43 of 24:18 · 8 phrases saved
            </p>
            <div className="my-3 h-1 w-full bg-hairline">
              <div className="h-full w-[52%] bg-primary" />
            </div>
            <span className="text-xs text-ink-muted">52% explored</span>
            <br />
            <button
              type="button"
              onClick={() => document.getElementById("video-url")?.focus()}
              className="mt-2 text-sm font-bold text-primary-deep hover:underline"
              data-od-id="continue-reading"
            >
              Paste a video URL to begin →
            </button>
          </aside>
        )}
      </section>

      {isSnapshotLoading ? <p role="status" className="text-sm text-ink-muted">Loading your learning space...</p> : null}
      {loadError ? <p className="rounded-lg border border-error/30 bg-surface px-4 py-3 text-sm text-error" role="alert">{loadError}</p> : null}
      {dismissError ? <p className="rounded-lg border border-error/30 bg-surface px-4 py-3 text-sm text-error" role="alert">{dismissError}</p> : null}

      {/* Home Grid: Today's Route + Due Now Sheet */}
      <div className="grid gap-10 pt-2 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)] lg:gap-12">
        <section data-od-id="today-list">
          <h2 className="mb-4 text-xl font-semibold tracking-tight text-ink">
            A small route through today
          </h2>
          <div className="border-t border-hairline">
            <button
              type="button"
              onClick={() => resume ? onOpenContent(resume, resume.lastPositionMs) : document.getElementById("video-url")?.focus()}
              className="grid w-full grid-cols-[38px_minmax(0,1fr)_auto] items-center gap-4 border-b border-hairline py-4 text-left hover:bg-surface"
              data-od-id="lesson-context"
            >
              <span className="font-mono text-xs text-ink-muted">01</span>
              <div>
                <span className="block text-[17px] font-semibold text-ink hover:underline">
                  Return to a sentence in context
                </span>
                <span className="block text-xs text-ink-muted">
                  {resume ? `${resume.title ?? "Current session"} · In progress` : "Paste a video · 3 minutes"}
                </span>
              </div>
              <span className="text-xl font-bold text-primary-deep">→</span>
            </button>

            <button
              type="button"
              onClick={reviewAction}
              className="grid w-full grid-cols-[38px_minmax(0,1fr)_auto] items-center gap-4 border-b border-hairline py-4 text-left hover:bg-surface"
              data-od-id="lesson-review"
            >
              <span className="font-mono text-xs text-ink-muted">02</span>
              <div>
                <span className="block text-[17px] font-semibold text-ink hover:underline">
                  {dueCount > 0 ? `Review ${dueCount} phrases you saved` : "Review your saved phrases"}
                </span>
                <span className="block text-xs text-ink-muted">
                  No new material required · 6 minutes
                </span>
              </div>
              <span className="text-xl font-bold text-primary-deep">→</span>
            </button>

            <a
              href="/library"
              className="grid w-full grid-cols-[38px_minmax(0,1fr)_auto] items-center gap-4 border-b border-hairline py-4 text-left hover:bg-surface"
              data-od-id="lesson-library"
            >
              <span className="font-mono text-xs text-ink-muted">03</span>
              <div>
                <span className="block text-[17px] font-semibold text-ink hover:underline">
                  Choose your next familiar voice
                </span>
                <span className="block text-xs text-ink-muted">
                  Saved sources in your library
                </span>
              </div>
              <span className="text-xl font-bold text-primary-deep">→</span>
            </a>
          </div>
        </section>

        <aside
          className="relative rounded-xl border border-hairline bg-surface p-7 shadow-editorial before:absolute before:left-0 before:top-0 before:h-[3px] before:w-full before:rounded-t-xl before:bg-primary"
          data-od-id="review-summary"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-primary-deep">
            Due now
          </p>
          <h2 className="my-3 text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
            {dueCount > 0 ? `${dueCount} phrases,` : "Eight phrases,"}
            <br />
            all with a place.
          </h2>
          <p className="mb-6 text-sm text-ink-muted">
            Review them in the videos where they first made sense.
          </p>
          <button
            type="button"
            onClick={reviewAction}
            className="flex min-h-[46px] w-full items-center justify-center rounded-control bg-primary-deep px-4 font-semibold tracking-wide text-surface transition-all hover:bg-primary hover:-translate-y-0.5 active:translate-y-0.5"
            data-od-id="start-review"
          >
            {reviewOpen ? "Close review" : "Start review"}
          </button>
        </aside>
      </div>

      {/* Shelf Section */}
      <section className="pt-4" data-od-id="recent-content">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-ink">On your shelf</h2>
          <a href="/library" className="text-xs font-semibold text-primary-deep hover:underline">
            View all →
          </a>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          {contentItems.length > 0 ? (
            contentItems.map((content, idx) => (
              <article
                key={content.videoId}
                className="group cursor-pointer border-t border-hairline pt-3.5"
                onClick={() => onOpenContent(content)}
              >
                <div className={`mb-3.5 flex h-28 items-end p-3 rounded-md ${idx === 1 ? "bg-primary-soft" : idx === 2 ? "bg-sage-soft" : "bg-ink text-surface"}`}>
                  <span lang="ko" className={`text-base font-semibold ${idx === 1 || idx === 2 ? "text-ink" : "text-surface"}`}>
                    {content.title ?? "오늘의 산책"}
                  </span>
                </div>
                <h3 className="text-base font-medium text-ink group-hover:underline">
                  {content.title ?? "Korean Video"}
                </h3>
                <p className="mt-1 text-xs text-ink-muted">From your local shelf</p>
              </article>
            ))
          ) : (
            <>
              <article className="border-t border-hairline pt-3.5" data-od-id="recent-walk">
                <div className="mb-3.5 flex h-28 items-end rounded-md bg-ink p-3 text-surface">
                  <span lang="ko" className="text-base font-semibold">오늘의 산책</span>
                </div>
                <h3 className="text-base font-medium text-ink">오늘의 산책</h3>
                <p className="mt-1 text-xs text-ink-muted">24 sentences · studied yesterday</p>
              </article>
              <article className="border-t border-hairline pt-3.5" data-od-id="recent-cafe">
                <div className="mb-3.5 flex h-28 items-end rounded-md bg-primary-soft p-3 text-ink">
                  <span lang="ko" className="text-base font-semibold">카페에서 생긴 일</span>
                </div>
                <h3 className="text-base font-medium text-ink">카페에서 생긴 일</h3>
                <p className="mt-1 text-xs text-ink-muted">18 sentences · added Monday</p>
              </article>
              <article className="border-t border-hairline pt-3.5" data-od-id="recent-market">
                <div className="mb-3.5 flex h-28 items-end rounded-md bg-sage-soft p-3 text-ink">
                  <span lang="ko" className="text-base font-semibold">시장에서 만난 사람들</span>
                </div>
                <h3 className="text-base font-medium text-ink">시장에서 만난 사람들</h3>
                <p className="mt-1 text-xs text-ink-muted">31 sentences · added last week</p>
              </article>
            </>
          )}
        </div>
      </section>

      {/* Start Something New Form */}
      <section aria-labelledby="new-content-heading" className="border-t border-hairline pt-8">
        <h2 id="new-content-heading" className="text-xl font-semibold tracking-tight text-ink">
          Start something new
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Paste a Korean YouTube URL to begin a Watch session.
        </p>
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="video-url">
            Korean YouTube URL
          </label>
          <input
            id="video-url"
            type="url"
            required
            value={videoUrl}
            onChange={(event) => onVideoUrlChange(event.target.value)}
            placeholder="Paste a Korean YouTube URL"
            className="min-w-0 flex-1 rounded-control border border-hairline bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="min-h-[46px] rounded-control bg-primary-deep px-5 font-semibold text-surface transition hover:bg-primary disabled:cursor-wait disabled:opacity-60"
          >
            {isLoading ? "Loading transcript..." : "Load video"}
          </button>
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
