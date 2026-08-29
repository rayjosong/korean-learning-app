import type { LearningContext } from "@korean-learning/learning-engine";

export interface ReviewClipWindow {
  startTimeMs: number;
  endTimeMs: number;
}

export function isUsableReviewContext(context: LearningContext | undefined): context is LearningContext {
  return Boolean(
    context &&
      context.videoId.trim() &&
      context.transcriptSegmentId.trim() &&
      context.sentence.trim() &&
      Number.isFinite(context.startTimeMs) &&
      Number.isFinite(context.endTimeMs) &&
      context.startTimeMs >= 0 &&
      context.endTimeMs > context.startTimeMs
  );
}

/** Keeps source playback short while retaining a little surrounding spoken context. */
export function reviewClipWindow(context: LearningContext): ReviewClipWindow {
  const maximumDurationMs = 20_000;
  const minimumDurationMs = 6_000;
  const sourceDurationMs = context.endTimeMs - context.startTimeMs;
  const preferredStart = sourceDurationMs < minimumDurationMs
    ? Math.max(0, context.startTimeMs - Math.floor((minimumDurationMs - sourceDurationMs) / 2))
    : context.startTimeMs;
  return {
    startTimeMs: preferredStart,
    endTimeMs: Math.min(preferredStart + maximumDurationMs, Math.max(context.endTimeMs, preferredStart + minimumDurationMs))
  };
}
