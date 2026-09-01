"use client";

import { StudySession } from "@/components/study-session";
import { HomeSurface } from "@/components/home-surface";
import { appTagline } from "@/lib/site";
import { useTranscriptLoader } from "@/hooks/use-transcript-loader";

export function StudySessionLoader() {
  const {
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
  } = useTranscriptLoader();

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
