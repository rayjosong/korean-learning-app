"use client";

import { FormEvent, useEffect, useState } from "react";

import { StudySession } from "@/components/study-session";
import { HomeSurface } from "@/components/home-surface";
import { appTagline } from "@/lib/site";
import {
  FIXTURE_SEGMENTS,
  FIXTURE_VIDEO_ID,
  LONG_FIXTURE_SEGMENTS,
  seedFixtureStorage,
  type FixtureScenario
} from "@/lib/fixture-session";
import type { TranscriptSegment } from "@korean-learning/content";

interface TranscriptResponse {
  videoId: string;
  segments: TranscriptSegment[];
  initialPositionMs?: number;
}

const WORKSPACE_FIXTURES: FixtureScenario[] = ["watch-study", "long", "populated", "review-unavailable", "review-no-context", "loading", "error"];

export function StudySessionLoader() {
  const [videoUrl, setVideoUrl] = useState("");
  const [session, setSession] = useState<TranscriptResponse>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [fixtureScenario] = useState<FixtureScenario | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    const value = new URLSearchParams(window.location.search).get("fixture");
    return value === "watch-study" || value === "long" || value === "populated" || value === "review-unavailable" || value === "review-no-context" || value === "loading" || value === "error" || value === "home-empty" || value === "home-populated" || value === "home-due-only"
      ? value
      : undefined;
  });
  const isFixture = fixtureScenario !== undefined;
  const [fixtureReady, setFixtureReady] = useState(true);

  useEffect(() => {
    if (!isFixture) return;
    void seedFixtureStorage(fixtureScenario ?? "watch-study").then(() => {
      setFixtureReady(true);
      if (WORKSPACE_FIXTURES.includes(fixtureScenario)) {
        setVideoUrl("https://youtu.be/fixture-29d-video");
        setSession({
          videoId: FIXTURE_VIDEO_ID,
          segments: [...(fixtureScenario === "long" ? LONG_FIXTURE_SEGMENTS : FIXTURE_SEGMENTS)]
        });
      }
    });
  }, [fixtureScenario, isFixture]);

  async function loadTranscript(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadVideo(videoUrl);
  }

  async function loadVideo(url: string, initialPositionMs = 0) {
    setIsLoading(true);
    setError(undefined);
    try {
      if (isFixture && url.includes(FIXTURE_VIDEO_ID)) {
        setVideoUrl(url);
        setSession({
          videoId: FIXTURE_VIDEO_ID,
          segments: [...FIXTURE_SEGMENTS],
          initialPositionMs
        });
        return;
      }
      const response = await fetch("/api/transcript", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ videoUrl: url })
      });
      const result = (await response.json()) as TranscriptResponse & { message?: string };
      if (!response.ok) throw new Error(result.message ?? "The transcript could not be loaded.");
      setSession({ ...result, initialPositionMs: 0 });
    } catch (caught) {
      setSession(undefined);
      setError(caught instanceof Error ? caught.message : "The transcript could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!fixtureReady) return <p role="status" className="text-sm text-ink-muted">Loading your learning space...</p>;

  return session ? (
    <>
      <header className="mb-10 max-w-2xl">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-primary-deep">First study session</p>
        <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">Learn Korean through real content.</h1>
        <p className="mt-5 text-lg leading-8 text-ink-secondary">{appTagline}</p>
      </header>
      <form onSubmit={loadTranscript} className="mb-8 flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="video-url">Korean YouTube URL</label>
        <input
          id="video-url"
          type="url"
          required
          value={videoUrl}
          onChange={(event) => setVideoUrl(event.target.value)}
          placeholder="Paste a Korean YouTube URL"
          className="min-w-0 flex-1 rounded-lg border border-hairline-strong bg-surface-elevated px-4 py-3 text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-primary-hover px-5 py-3 font-semibold text-on-primary transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:cursor-wait disabled:opacity-60"
        >
          {isLoading ? "Loading transcript…" : "Load video"}
        </button>
      </form>
      {error ? <p className="mb-8 rounded-lg border border-error/30 bg-surface-elevated px-4 py-3 text-sm text-error" role="alert">{error}</p> : null}
      <StudySession
        videoId={session.videoId}
        segments={session.segments}
        videoUrl={videoUrl}
        initialPositionMs={session.initialPositionMs}
        onReplay={(url) => void loadVideo(url)}
        fixture={isFixture}
        fixtureScenario={fixtureScenario}
      />
    </>
  ) : (
    <HomeSurface
      videoUrl={videoUrl}
      onVideoUrlChange={setVideoUrl}
      onSubmit={loadTranscript}
      onOpenContent={(content, positionMs) => void loadVideo(content.sourceUrl, positionMs)}
      isLoading={isLoading}
      error={error}
      ready={fixtureReady}
    />
  );
}
