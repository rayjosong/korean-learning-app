import type { DifficultyEstimate } from "./video-difficulty";

export interface ContentProgressSnapshot {
  id: string;
  videoId: string;
  capturedAt: string;
  difficultyBand: DifficultyEstimate["band"];
  likelyComprehension: DifficultyEstimate["likelyComprehension"];
  comprehensionMidpoint: number;
  source: DifficultyEstimate["source"];
}

export type ContentProgressComparisonStatus =
  | "insufficient-history"
  | "improved"
  | "unchanged"
  | "lower";

export interface ContentProgressComparison {
  status: ContentProgressComparisonStatus;
  previous?: ContentProgressSnapshot;
  current: ContentProgressSnapshot;
  elapsedDays?: number;
}

export function createContentProgressSnapshot(input: {
  id: string;
  videoId: string;
  capturedAt: string;
  estimate: DifficultyEstimate;
}): ContentProgressSnapshot {
  const midpoint = Math.round(
    (input.estimate.likelyComprehension.min + input.estimate.likelyComprehension.max) / 2
  );
  return {
    id: input.id,
    videoId: input.videoId,
    capturedAt: input.capturedAt,
    difficultyBand: input.estimate.band,
    likelyComprehension: input.estimate.likelyComprehension,
    comprehensionMidpoint: midpoint,
    source: input.estimate.source
  };
}

export function compareContentProgress(
  current: ContentProgressSnapshot,
  previous?: ContentProgressSnapshot
): ContentProgressComparison {
  if (!previous) return { status: "insufficient-history", current };

  const currentTime = Date.parse(current.capturedAt);
  const previousTime = Date.parse(previous.capturedAt);
  const elapsedDays = Number.isFinite(currentTime) && Number.isFinite(previousTime)
    ? Math.max(0, Math.round((currentTime - previousTime) / (24 * 60 * 60 * 1000)))
    : undefined;
  const delta = current.comprehensionMidpoint - previous.comprehensionMidpoint;

  return {
    status: delta > 0 ? "improved" : delta < 0 ? "lower" : "unchanged",
    previous,
    current,
    ...(elapsedDays === undefined ? {} : { elapsedDays })
  };
}
