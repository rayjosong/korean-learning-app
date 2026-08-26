"use client";

import { useEffect, useRef } from "react";
import {
  findSegmentAtTime,
  formatTimestamp,
  type TranscriptSegment
} from "@/lib/transcript";
import { useYouTubePlayer } from "@/lib/use-youtube-player";
import type { SentenceExplanationState } from "@/lib/use-sentence-explanation";
import type { WordExplanationState } from "@/lib/use-word-explanation";
import type { LearnerItemState } from "@/lib/use-learner-item";
import { SentenceBreakdownPopover } from "./sentence-breakdown-popover";
import { ExplanationPanel } from "./explanation-panel";

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
  // Props for Watch-mode anchored popover
  explanationState?: SentenceExplanationState;
  onRetryExplanation?: () => void;
  wordExplanationState?: WordExplanationState;
  onWordClick?: (word: string) => void;
  learnerItemState?: LearnerItemState;
  onMarkKnown?: () => void;
  onMarkLearning?: () => void;
  onUndoMarkKnown?: () => void;
  onCloseExplanation?: () => void;
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
  pause,
  mode = "watch",
  onModeChange,
  explanationState,
  onRetryExplanation,
  wordExplanationState,
  onWordClick,
  learnerItemState,
  onMarkKnown,
  onMarkLearning,
  onUndoMarkKnown,
  onCloseExplanation
}: VideoTranscriptViewerProps) {
  const internalPlayer = useYouTubePlayer({ videoId, segments, enabled: !playerContainerRef });

  const containerRef = playerContainerRef ?? internalPlayer.playerContainerRef;
  const currentActiveSegmentId = activeSegmentId ?? internalPlayer.activeSegmentId;
  const currentError = playerError ?? internalPlayer.playerError;
  const currentSeekTo = seekTo ?? internalPlayer.seekTo;
  const currentPause = pause ?? internalPlayer.pause;

  const activeSegmentRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (selectedSegmentId) return;
    activeSegmentRef.current?.scrollIntoView({ block: "nearest" });
  }, [currentActiveSegmentId, selectedSegmentId]);

  function seekToSegment(segment: TranscriptSegment) {
    currentSeekTo(segment.startTimeMs / 1000);
    currentPause();
  }

  return (
    <div className="flex flex-col gap-4">
      {/* The main video and transcript grid */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,1fr)]" aria-label={title}>
        <div className={mode === "study" ? "overflow-hidden rounded-xl border border-hairline bg-black lg:col-start-1 lg:row-start-1" : "overflow-hidden rounded-xl border border-hairline bg-black"}>
          <div ref={containerRef} className="aspect-video w-full" />
          {currentError ? <p className="px-4 py-3 text-sm text-error">{currentError}</p> : null}
        </div>

        {mode === "study" ? (
          <StudyTranscriptContext
            segments={segments}
            selectedSegmentId={selectedSegmentId}
            activeSegmentId={currentActiveSegmentId}
            onSelect={onSegmentClick}
          />
        ) : (
          <div className="rounded-xl border border-hairline bg-surface-elevated p-4 lg:col-start-1 lg:row-start-2">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 className="font-semibold text-ink">{title}</h2>
            <span className="text-xs text-ink-muted">{segments.length} segments</span>
          </div>
          <div className="max-h-[28rem] overflow-y-auto pr-1" role="list" aria-label="Timestamped transcript">
            {segments.map((segment) => {
              const isActive = segment.id === currentActiveSegmentId;
              const isSelected = segment.id === selectedSegmentId;
              return (
                <div key={segment.id} className="relative mb-1">
                  <button
                    id={`segment-btn-${segment.id}`}
                    ref={isActive ? activeSegmentRef : undefined}
                    type="button"
                    className={`grid w-full grid-cols-[3rem_1fr] gap-3 rounded-lg border-l-2 px-3 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                      isSelected
                        ? "border-l-primary bg-primary-soft text-ink"
                        : isActive
                          ? "border-l-transparent bg-highlight-soft text-ink"
                          : "border-l-transparent text-ink hover:bg-surface-subtle"
                    }`}
                    aria-current={isActive ? "true" : undefined}
                    aria-pressed={isSelected}
                    onClick={() => {
                      if (mode === "watch") {
                        currentSeekTo(segment.startTimeMs / 1000);
                        currentPause();
                      } else {
                        seekToSegment(segment);
                      }
                      onSegmentClick?.(segment);
                    }}
                  >
                    <span className={`pt-0.5 text-xs tabular-nums ${isActive || isSelected ? "font-semibold text-ink-secondary" : "text-ink-muted"}`}>
                      {formatTimestamp(segment.startTimeMs)}
                    </span>
                    <span lang="ko" className="text-[18px] font-[475] leading-[1.7]">{segment.text}</span>
                  </button>

                  {mode === "watch" && isSelected && explanationState && onCloseExplanation && (
                    <div className="mt-2 pl-3">
                      <SentenceBreakdownPopover
                        segment={segment}
                        state={explanationState}
                        onRetry={onRetryExplanation}
                        wordState={wordExplanationState}
                        onWordClick={onWordClick}
                        learnerState={learnerItemState}
                        onMarkKnown={onMarkKnown}
                        onMarkLearning={onMarkLearning}
                        onUndo={onUndoMarkKnown}
                        onClose={onCloseExplanation}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          </div>
        )}

        {mode === "study" ? (
          <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <ExplanationPanel
              segment={segments.find((segment) => segment.id === selectedSegmentId)}
              state={explanationState ?? { status: "idle" }}
              progressive
              onRetry={onRetryExplanation}
              wordState={wordExplanationState}
              onWordClick={onWordClick}
              learnerState={learnerItemState}
              onMarkKnown={onMarkKnown}
              onMarkLearning={onMarkLearning}
              onUndo={onUndoMarkKnown}
            />
          </div>
        ) : null}
      </section>

      {/* Workspace mode and settings bar */}
      <div className="flex items-center justify-between rounded-xl border border-hairline bg-surface-elevated px-4 py-2.5">
        <div className="flex items-center gap-2" role="tablist" aria-label="Workspace mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "watch"}
            onClick={() => onModeChange?.("watch")}
            className={`rounded-lg px-4 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
              mode === "watch"
                ? "bg-primary-soft font-semibold text-primary-deep"
                : "text-ink-muted hover:bg-surface-subtle hover:text-ink"
            }`}
          >
            Watch
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "study"}
            onClick={() => onModeChange?.("study")}
            className={`rounded-lg px-4 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
              mode === "study"
                ? "bg-primary-soft font-semibold text-primary-deep"
                : "text-ink-muted hover:bg-surface-subtle hover:text-ink"
            }`}
          >
            Study
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <span>Assistance:</span>
          <span className="font-medium text-ink-secondary">Guided</span>
        </div>
      </div>
    </div>
  );
}

function StudyTranscriptContext({
  segments,
  selectedSegmentId,
  activeSegmentId,
  onSelect
}: {
  segments: readonly TranscriptSegment[];
  selectedSegmentId?: string;
  activeSegmentId?: string;
  onSelect?: (segment: TranscriptSegment) => void;
}) {
  const selectedIndex = segments.findIndex((segment) => segment.id === selectedSegmentId);
  const centerIndex = selectedIndex >= 0 ? selectedIndex : segments.findIndex((segment) => segment.id === activeSegmentId);
  const start = Math.max(0, centerIndex >= 0 ? centerIndex - 1 : 0);
  const nearby = segments.slice(start, start + 3);

  return (
    <div className="rounded-xl border border-hairline bg-surface-elevated p-4" aria-label="Nearby transcript">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="font-semibold text-ink">Nearby transcript</h2>
        <span className="text-xs text-ink-muted">Study context</span>
      </div>
      <div className="space-y-1" role="list" aria-label="Nearby transcript sentences">
        {nearby.map((segment) => {
          const isSelected = segment.id === selectedSegmentId;
          const isActive = segment.id === activeSegmentId;
          return (
            <div key={segment.id} role="listitem">
            <button
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect?.(segment)}
              className={`w-full rounded-lg border-l-2 px-3 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                isSelected
                  ? "border-l-primary bg-primary-soft text-ink"
                  : isActive
                    ? "border-l-transparent bg-highlight-soft text-ink"
                    : "border-l-transparent text-ink-secondary hover:bg-surface-subtle hover:text-ink"
              }`}
            >
              <span className={`block text-xs tabular-nums ${isActive || isSelected ? "font-semibold text-ink-secondary" : "text-ink-muted"}`}>{formatTimestamp(segment.startTimeMs)}</span>
              <span lang="ko" className="mt-1 block text-[18px] font-[475] leading-[1.7]">{segment.text}</span>
            </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
