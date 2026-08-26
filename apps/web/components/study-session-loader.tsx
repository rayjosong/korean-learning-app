"use client";

import { FormEvent, useState } from "react";

import { StudySession } from "@/components/study-session";
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
          className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-xl bg-sky-400 px-5 py-3 font-semibold text-slate-950 transition-colors hover:bg-sky-300 disabled:cursor-wait disabled:opacity-60"
        >
          {isLoading ? "Loading transcript…" : "Load video"}
        </button>
      </form>
      {error ? <p className="mb-8 rounded-xl border border-rose-900/80 bg-rose-950/40 px-4 py-3 text-sm text-rose-200" role="alert">{error}</p> : null}
      {session ? (
        <StudySession
          videoId={session.videoId}
          segments={session.segments}
          videoUrl={videoUrl}
          onReplay={(url) => void loadVideo(url)}
        />
      ) : null}
    </>
  );
}
