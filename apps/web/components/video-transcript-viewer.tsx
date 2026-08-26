"use client";

import { useEffect, useRef } from "react";
import {
  findSegmentAtTime,
  formatTimestamp,
  type TranscriptSegment
} from "@/lib/transcript";
import { useYouTubePlayer } from "@/lib/use-youtube-player";

export interface VideoTranscriptViewerProps {
  videoId: string;
  segments: readonly TranscriptSegment[];
  title?: string;
  onSegmentClick?: (segment: TranscriptSegment) => void;
  // Optional props for external media-session coordination
  playerContainerRef?: React.RefObject<HTMLDivElement | null>;
  activeSegmentId?: string;
  selectedSegmentId?: string;
  playerError?: string;
  seekTo?: (seconds: number) => void;
  play?: () => void;
  pause?: () => void;
  mode?: "watch" | "study";
  onModeChange?: (mode: "watch" | "study") => void;
}

export function VideoTranscriptViewer({
  videoId,
  segments,
  title = "Korean transcript",
  onSegmentClick,
  playerContainerRef,
  activeSegmentId,
  selectedSegmentId,
  playerError,
  seekTo,
  play,
  pause,
  mode = "watch",
  onModeChange
}: VideoTranscriptViewerProps) {
  const internalPlayer = useYouTubePlayer({ videoId, segments });

  const containerRef = playerContainerRef ?? internalPlayer.playerContainerRef;
  const currentActiveSegmentId = activeSegmentId ?? internalPlayer.activeSegmentId;
  const currentError = playerError ?? internalPlayer.playerError;
  const currentSeekTo = seekTo ?? internalPlayer.seekTo;
  const currentPlay = play ?? internalPlayer.play;

  const activeSegmentRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeSegmentRef.current?.scrollIntoView({ block: "nearest" });
  }, [currentActiveSegmentId]);

  function seekToSegment(segment: TranscriptSegment) {
    currentSeekTo(segment.startTimeMs / 1000);
    currentPlay();
  }

  return (
    <div className="flex flex-col gap-4">
      {/* The main video and transcript grid */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,1fr)]" aria-label={title}>
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-black shadow-2xl">
          <div ref={containerRef} className="aspect-video w-full" />
          {currentError ? <p className="px-4 py-3 text-sm text-rose-300">{currentError}</p> : null}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 className="font-semibold text-white">{title}</h2>
            <span className="text-xs text-slate-500">{segments.length} segments</span>
          </div>
          <div className="max-h-[28rem] overflow-y-auto pr-1" role="list" aria-label="Timestamped transcript">
            {segments.map((segment) => {
              const isActive = segment.id === currentActiveSegmentId;
              const isSelected = segment.id === selectedSegmentId;
              return (
                <button
                  ref={isActive ? activeSegmentRef : undefined}
                  key={segment.id}
                  type="button"
                  className={`mb-1 grid w-full grid-cols-[3rem_1fr] gap-3 rounded-xl px-3 py-3 text-left transition-all ${
                    isSelected
                      ? "bg-[#F4E1DA]/10 text-white ring-1 ring-[#C7654C]/40 border-l-2 border-l-[#C7654C]"
                      : isActive
                        ? "bg-[#FAF4DA]/10 text-white ring-1 ring-[#F4E8B8]/30"
                        : "text-slate-300 hover:bg-[#FAF9F5]/5 hover:text-white"
                  }`}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => {
                    seekToSegment(segment);
                    onSegmentClick?.(segment);
                  }}
                >
                  <span className={`pt-0.5 text-xs tabular-nums ${isActive ? "text-[#C7654C]" : "text-sky-300"}`}>
                    {formatTimestamp(segment.startTimeMs)}
                  </span>
                  <span lang="ko" className="leading-6 font-medium text-[17px]">{segment.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Workspace mode and settings bar */}
      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 shadow-md backdrop-blur-sm">
        <div className="flex items-center gap-2" role="tablist" aria-label="Workspace mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "watch"}
            onClick={() => onModeChange?.("watch")}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
              mode === "watch"
                ? "bg-[#C7654C]/10 text-[#C7654C] ring-1 ring-[#C7654C]/30"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            Watch
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "study"}
            onClick={() => onModeChange?.("study")}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
              mode === "study"
                ? "bg-[#C7654C]/10 text-[#C7654C] ring-1 ring-[#C7654C]/30"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            Study
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Assistance:</span>
          <span className="font-semibold text-slate-300">Guided</span>
        </div>
      </div>
    </div>
  );
}
