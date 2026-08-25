"use client";

import { useEffect, useRef, useState } from "react";
import {
  findSegmentAtTime,
  formatTimestamp,
  type TranscriptSegment
} from "@/lib/transcript";

interface YouTubePlayer {
  destroy(): void;
  getCurrentTime(): number;
  playVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
}

interface YouTubePlayerEvent {
  target: YouTubePlayer;
}

interface YouTubeNamespace {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars: { playsinline: 1; rel: 0 };
      events: {
        onReady: (event: YouTubePlayerEvent) => void;
      };
    }
  ) => YouTubePlayer;
}

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youTubeApiPromise: Promise<YouTubeNamespace> | undefined;

function loadYouTubeApi(): Promise<YouTubeNamespace> {
  if (window.YT) return Promise.resolve(window.YT);
  if (youTubeApiPromise) return youTubeApiPromise;

  youTubeApiPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onload = () => {
      if (window.YT) resolve(window.YT);
      else reject(new Error("YouTube Player API did not initialize."));
    };
    script.onerror = () => reject(new Error("YouTube Player API could not load."));
    window.onYouTubeIframeAPIReady = () => {
      if (window.YT) resolve(window.YT);
      else reject(new Error("YouTube Player API did not initialize."));
    };
    document.head.appendChild(script);
  });

  return youTubeApiPromise;
}

export interface VideoTranscriptViewerProps {
  videoId: string;
  segments: readonly TranscriptSegment[];
  title?: string;
}

export function VideoTranscriptViewer({
  videoId,
  segments,
  title = "Korean transcript"
}: VideoTranscriptViewerProps) {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const activeSegmentRef = useRef<HTMLButtonElement>(null);
  const [activeSegmentId, setActiveSegmentId] = useState<string>();
  const [playerError, setPlayerError] = useState<string>();

  useEffect(() => {
    let cancelled = false;

    void loadYouTubeApi()
      .then((youTube) => {
        if (cancelled || !playerContainerRef.current) return;
        playerRef.current?.destroy();
        playerRef.current = new youTube.Player(playerContainerRef.current, {
          videoId,
          playerVars: { playsinline: 1, rel: 0 },
          events: {
            onReady: ({ target }) => {
              playerRef.current = target;
              if (pendingSeekRef.current !== null) {
                target.seekTo(pendingSeekRef.current / 1000, true);
                target.playVideo();
                pendingSeekRef.current = null;
              }
            }
          }
        });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setPlayerError(error instanceof Error ? error.message : "The video could not load.");
        }
      });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      const activeSegment = findSegmentAtTime(segments, player.getCurrentTime() * 1000);
      setActiveSegmentId(activeSegment?.id);
    }, 250);

    return () => window.clearInterval(interval);
  }, [segments]);

  useEffect(() => {
    activeSegmentRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeSegmentId]);

  function seekToSegment(segment: TranscriptSegment) {
    const player = playerRef.current;
    if (!player) {
      pendingSeekRef.current = segment.startTimeMs;
      setActiveSegmentId(segment.id);
      return;
    }

    player.seekTo(segment.startTimeMs / 1000, true);
    player.playVideo();
    setActiveSegmentId(segment.id);
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,1fr)]" aria-label={title}>
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-black shadow-2xl">
        <div ref={playerContainerRef} className="aspect-video w-full" />
        {playerError ? <p className="px-4 py-3 text-sm text-rose-300">{playerError}</p> : null}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h2 className="font-semibold text-white">{title}</h2>
          <span className="text-xs text-slate-500">{segments.length} segments</span>
        </div>
        <div className="max-h-[28rem] overflow-y-auto pr-1" role="list" aria-label="Timestamped transcript">
          {segments.map((segment) => {
            const isActive = segment.id === activeSegmentId;
            return (
              <button
                ref={isActive ? activeSegmentRef : undefined}
                key={segment.id}
                type="button"
                className={`mb-1 grid w-full grid-cols-[3rem_1fr] gap-3 rounded-xl px-3 py-3 text-left transition-colors ${isActive ? "bg-sky-400/15 text-white ring-1 ring-sky-300/40" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
                aria-current={isActive ? "true" : undefined}
                onClick={() => seekToSegment(segment)}
              >
                <span className="pt-0.5 text-xs tabular-nums text-sky-300">{formatTimestamp(segment.startTimeMs)}</span>
                <span lang="ko" className="leading-6">{segment.text}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
