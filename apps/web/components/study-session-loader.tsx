"use client";

import { FormEvent, useEffect, useState } from "react";

import { StudySession } from "@/components/study-session";
import { HomeSurface } from "@/components/home-surface";
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
  const [fixtureReady, setFixtureReady] = useState(!isFixture);

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
