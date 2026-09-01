"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { TranscriptSegment } from "@korean-learning/content";
import { useFixture } from "./use-fixture";
import { FIXTURE_VIDEO_ID, FIXTURE_SEGMENTS, LONG_FIXTURE_SEGMENTS, type FixtureScenario } from "@/lib/fixture-session";

interface TranscriptResponse {
  videoId: string;
  segments: TranscriptSegment[];
  initialPositionMs?: number;
}

const WORKSPACE_FIXTURES: FixtureScenario[] = ["watch-study", "long", "populated", "review-unavailable", "review-no-context", "loading", "error"];

export function useTranscriptLoader() {
  const { fixtureScenario, isFixture, fixtureReady } = useFixture();
  const [videoUrl, setVideoUrl] = useState("");
  const [session, setSession] = useState<TranscriptResponse>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isFixture && fixtureReady && fixtureScenario && WORKSPACE_FIXTURES.includes(fixtureScenario)) {
      setVideoUrl("https://youtu.be/fixture-29d-video");
      setSession({
        videoId: FIXTURE_VIDEO_ID,
        segments: [...(fixtureScenario === "long" ? LONG_FIXTURE_SEGMENTS : FIXTURE_SEGMENTS)]
      });
    }
  }, [fixtureScenario, isFixture, fixtureReady]);

  const loadVideo = useCallback(
    async (url: string, initialPositionMs = 0) => {
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
    },
    [isFixture]
  );

  const loadTranscript = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      await loadVideo(videoUrl);
    },
    [loadVideo, videoUrl]
  );

  return {
    videoUrl,
    setVideoUrl,
    session,
    error,
    isLoading,
    fixtureScenario,
    isFixture,
    fixtureReady,
    loadVideo,
    loadTranscript
  };
}
