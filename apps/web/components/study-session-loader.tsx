"use client";

import { FormEvent, useEffect, useState } from "react";

import { StudySession } from "@/components/study-session";
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
}

export function StudySessionLoader() {
  const [videoUrl, setVideoUrl] = useState("");
  const [session, setSession] = useState<TranscriptResponse>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [fixtureScenario] = useState<FixtureScenario | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    const value = new URLSearchParams(window.location.search).get("fixture");
    return value === "watch-study" || value === "long" || value === "populated" || value === "review-unavailable" || value === "review-no-context" || value === "loading" || value === "error"
      ? value
      : undefined;
  });
  const isFixture = fixtureScenario !== undefined;

  useEffect(() => {
    if (!isFixture) return;
    void seedFixtureStorage(fixtureScenario ?? "watch-study").then(() => {
      setVideoUrl("https://youtu.be/fixture-29d-video");
      setSession({
        videoId: FIXTURE_VIDEO_ID,
        segments: [...(fixtureScenario === "long" ? LONG_FIXTURE_SEGMENTS : FIXTURE_SEGMENTS)]
      });
    });
  }, [fixtureScenario, isFixture]);

  async function loadTranscript(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadVideo(videoUrl);
  }

  async function loadVideo(url: string) {
    setIsLoading(true);
    setError(undefined);
    try {
      const response = await fetch("/api/transcript", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ videoUrl: url })
      });
      const result = (await response.json()) as TranscriptResponse & { message?: string };
      if (!response.ok) throw new Error(result.message ?? "The transcript could not be loaded.");
      setSession(result);
    } catch (caught) {
      setSession(undefined);
      setError(caught instanceof Error ? caught.message : "The transcript could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
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
      {session ? (
        <StudySession
          videoId={session.videoId}
          segments={session.segments}
          videoUrl={videoUrl}
          onReplay={(url) => void loadVideo(url)}
          fixture={isFixture}
          fixtureScenario={fixtureScenario}
        />
      ) : null}
    </>
  );
}
