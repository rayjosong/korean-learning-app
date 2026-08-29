"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { findSegmentAtTime, type TranscriptSegment } from "./transcript";

export interface YouTubePlayer {
  destroy(): void;
  getCurrentTime(): number;
  playVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  pauseVideo(): void;
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
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (youTubeApiPromise) return youTubeApiPromise;

  youTubeApiPromise = new Promise((resolve, reject) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousReady) {
        try {
          previousReady();
        } catch (e) {
          console.error("Error in previous onYouTubeIframeAPIReady:", e);
        }
      }
      if (window.YT && window.YT.Player) {
        resolve(window.YT);
      } else {
        youTubeApiPromise = undefined;
        reject(new Error("YouTube Player API did not initialize."));
      }
    };

    const scriptExists = !!document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (!scriptExists) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => {
        youTubeApiPromise = undefined;
        reject(new Error("YouTube Player API could not load."));
      };
      document.head.appendChild(script);
    }
  });

  return youTubeApiPromise;
}

export interface UseYouTubePlayerProps {
  videoId: string;
  segments: readonly TranscriptSegment[];
  enabled?: boolean;
  initialPositionMs?: number;
}

export function useYouTubePlayer({ videoId, segments, enabled = true, initialPositionMs = 0 }: UseYouTubePlayerProps) {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const pendingPlayStateRef = useRef<"play" | "pause" | null>(null);
  const [activeSegmentId, setActiveSegmentId] = useState<string>();
  const [playerError, setPlayerError] = useState<string>();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setIsReady(false);
    pendingSeekRef.current = initialPositionMs > 0 ? initialPositionMs : null;
    pendingPlayStateRef.current = initialPositionMs > 0 ? "pause" : null;

    void loadYouTubeApi()
      .then((youTube) => {
        if (cancelled || !playerContainerRef.current) return;
        playerRef.current?.destroy();
        playerRef.current = new youTube.Player(playerContainerRef.current, {
          videoId,
          playerVars: { playsinline: 1, rel: 0 },
          events: {
            onReady: ({ target }) => {
              if (cancelled) return;
              playerRef.current = target;
              setIsReady(true);
              if (pendingSeekRef.current !== null) {
                target.seekTo(pendingSeekRef.current / 1000, true);
                if (pendingPlayStateRef.current === "pause") {
                  target.pauseVideo();
                } else {
                  target.playVideo();
                }
                pendingSeekRef.current = null;
                pendingPlayStateRef.current = null;
              } else if (pendingPlayStateRef.current !== null) {
                if (pendingPlayStateRef.current === "pause") {
                  target.pauseVideo();
                } else if (pendingPlayStateRef.current === "play") {
                  target.playVideo();
                }
                pendingPlayStateRef.current = null;
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
      setIsReady(false);
    };
  }, [enabled, videoId, initialPositionMs]);

  useEffect(() => {
    if (!enabled) return;
    const interval = window.setInterval(() => {
      const player = playerRef.current;
      if (!player || typeof player.getCurrentTime !== "function") return;
      const activeSegment = findSegmentAtTime(segments, player.getCurrentTime() * 1000);
      setActiveSegmentId(activeSegment?.id);
    }, 250);

    return () => window.clearInterval(interval);
  }, [enabled, segments]);

  const seekTo = (seconds: number) => {
    const player = playerRef.current;
    if (!player || typeof player.seekTo !== "function") {
      pendingSeekRef.current = seconds * 1000;
      return;
    }
    player.seekTo(seconds, true);
  };

  const play = () => {
    const player = playerRef.current;
    if (player && typeof player.playVideo === "function") {
      player.playVideo();
    } else {
      pendingPlayStateRef.current = "play";
    }
  };

  const pause = () => {
    const player = playerRef.current;
    if (player && typeof player.pauseVideo === "function") {
      player.pauseVideo();
    } else {
      pendingPlayStateRef.current = "pause";
    }
  };

  const getCurrentTime = useCallback(() => playerRef.current?.getCurrentTime() ?? 0, []);

  return {
    playerContainerRef,
    playerRef,
    activeSegmentId,
    setActiveSegmentId,
    playerError,
    isReady,
    seekTo,
    play,
    pause,
    getCurrentTime
  };
}
