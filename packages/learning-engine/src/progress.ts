import type { LearningItem, ReviewOutcome } from "./index";

export interface ProgressSnapshotInput {
  items: readonly LearningItem[];
  reviews: readonly { outcome: ReviewOutcome; reviewedAt: string }[];
  explanations: readonly { createdAt: string }[];
  studiedContent: readonly { videoId: string }[];
  now: string;
}

export interface ReviewSuccessSummary {
  successful: number;
  total: number;
  percentage: number | null;
  windowDays: number;
}

export interface ExplanationFrequencySummary {
  count: number;
  windowDays: number;
}

export interface ProgressSnapshot {
  knownItems: number;
  learningItems: number;
  reviewSuccess: ReviewSuccessSummary;
  explanationFrequency: ExplanationFrequencySummary;
  contentStudied: number;
}

const REVIEW_WINDOW_DAYS = 30;
const EXPLANATION_WINDOW_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

function isWithinWindow(value: string, now: string, windowDays: number): boolean {
  const timestamp = Date.parse(value);
  const end = Date.parse(now);
  return Number.isFinite(timestamp) && Number.isFinite(end) &&
    timestamp >= end - windowDays * DAY_MS && timestamp <= end;
}

export function aggregateProgressSnapshot(input: ProgressSnapshotInput): ProgressSnapshot {
  const recentReviews = input.reviews.filter((review) =>
    isWithinWindow(review.reviewedAt, input.now, REVIEW_WINDOW_DAYS)
  );
  const reviewTotal = recentReviews.length;
  const successfulReviews = recentReviews.filter((review) => review.outcome === "success").length;
  const explanationCount = input.explanations.filter((record) =>
    isWithinWindow(record.createdAt, input.now, EXPLANATION_WINDOW_DAYS)
  ).length;

  return {
    knownItems: input.items.filter((item) => item.state === "known").length,
    learningItems: input.items.filter((item) => item.state === "learning").length,
    reviewSuccess: {
      successful: successfulReviews,
      total: reviewTotal,
      percentage: reviewTotal ? Math.round((successfulReviews / reviewTotal) * 100) : null,
      windowDays: REVIEW_WINDOW_DAYS
    },
    explanationFrequency: { count: explanationCount, windowDays: EXPLANATION_WINDOW_DAYS },
    contentStudied: new Set(input.studiedContent.map((record) => record.videoId.trim()).filter(Boolean)).size
  };
}
