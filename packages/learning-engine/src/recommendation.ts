export type RecommendationAction =
  | { type: "review" }
  | { type: "resume"; videoId: string; sourceUrl: string; positionMs: number }
  | { type: "revisit"; videoId: string; sourceUrl: string }
  | { type: "start-new" };

export type RecommendationReason =
  | { code: "recent-review-weakness"; mode: "recognition" | "production"; failures: number; windowDays: 14 }
  | { code: "items-due"; count: number }
  | { code: "unfinished-content"; title?: string }
  | { code: "revisit-ready"; title?: string; elapsedDays: number }
  | { code: "new-content-fallback" };

export interface LearningRecommendation {
  fingerprint: string;
  action: RecommendationAction;
  reason: RecommendationReason;
}

export interface RecommendationInput {
  now: string;
  dueItems: readonly { id: string; nextReviewAt?: string }[];
  recentReviews: readonly {
    mode: "recognition" | "production" | "cloze";
    outcome: "success" | "failure";
    reviewedAt: string;
  }[];
  resume?: {
    videoId: string;
    sourceUrl: string;
    title?: string;
    lastPositionMs: number;
    completed: boolean;
    updatedAt: string;
  };
  studiedContent: readonly {
    videoId: string;
    sourceUrl?: string;
    title?: string;
    lastStudiedAt: string;
  }[];
  progressSnapshots: readonly {
    videoId: string;
    capturedAt: string;
  }[];
  dismissals: readonly {
    fingerprint: string;
    dismissedUntil: string;
  }[];
  activityRevision?: string;
}

export const RECENT_REVIEW_WINDOW_DAYS = 14;
export const REVISIT_AFTER_DAYS = 14;
export const DISMISSAL_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

function parseTime(value: string): number | undefined {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function isRecentReview(reviewedAt: string, now: number): boolean {
  const timestamp = parseTime(reviewedAt);
  return timestamp !== undefined &&
    timestamp >= now - RECENT_REVIEW_WINDOW_DAYS * DAY_MS &&
    timestamp <= now;
}

function latestTimestamp(values: readonly string[]): string | undefined {
  return [...values].sort((left, right) => right.localeCompare(left))[0];
}

function validResume(input: RecommendationInput["resume"]): input is NonNullable<RecommendationInput["resume"]> {
  return Boolean(
    input &&
    !input.completed &&
    input.videoId.trim() &&
    input.sourceUrl.trim() &&
    Number.isFinite(input.lastPositionMs) &&
    input.lastPositionMs > 0 &&
    input.updatedAt.trim()
  );
}

function selectReviewReason(
  input: RecommendationInput,
  now: number
): RecommendationReason {
  const failures = input.recentReviews
    .filter((review) => review.outcome === "failure" && isRecentReview(review.reviewedAt, now))
    .reduce(
      (counts, review) => {
        if (review.mode === "production") counts.production += 1;
        if (review.mode === "recognition" || review.mode === "cloze") counts.recognition += 1;
        return counts;
      },
      { recognition: 0, production: 0 }
    );

  if (failures.production >= 2 || failures.recognition >= 2) {
    const mode = failures.production >= failures.recognition ? "production" : "recognition";
    return {
      code: "recent-review-weakness",
      mode,
      failures: failures[mode],
      windowDays: RECENT_REVIEW_WINDOW_DAYS
    };
  }

  return { code: "items-due", count: input.dueItems.length };
}

function buildActivityRevision(input: RecommendationInput): string {
  if (input.activityRevision) return input.activityRevision;
  return [
    latestTimestamp(input.recentReviews.map((review) => review.reviewedAt)) ?? "",
    latestTimestamp(input.studiedContent.map((record) => record.lastStudiedAt)) ?? "",
    latestTimestamp(input.progressSnapshots.map((snapshot) => snapshot.capturedAt)) ?? "",
    input.resume?.updatedAt ?? ""
  ].join("|");
}

function buildCandidates(input: RecommendationInput): LearningRecommendation[] {
  const now = parseTime(input.now);
  if (now === undefined) return [];

  const dueItems = input.dueItems.filter((item) => {
    const dueAt = item.nextReviewAt ? parseTime(item.nextReviewAt) : undefined;
    return dueAt !== undefined && dueAt <= now;
  });
  const latestDueAt = latestTimestamp(
    dueItems.map((item) => item.nextReviewAt).filter((value): value is string => Boolean(value))
  );
  const reviewReason = selectReviewReason({ ...input, dueItems }, now);
  const candidates: LearningRecommendation[] = [];

  if (dueItems.length) {
    const weaknessMode = reviewReason.code === "recent-review-weakness" ? reviewReason.mode : "none";
    const latestReviewAt = latestTimestamp(input.recentReviews.map((review) => review.reviewedAt)) ?? "none";
    candidates.push({
      fingerprint: [
        "review:v1",
        dueItems.length,
        latestDueAt ?? "none",
        weaknessMode,
        latestReviewAt
      ].join(":"),
      action: { type: "review" },
      reason: reviewReason
    });
  }

  if (validResume(input.resume)) {
    candidates.push({
      fingerprint: ["resume:v1", input.resume.videoId, input.resume.updatedAt].join(":"),
      action: {
        type: "resume",
        videoId: input.resume.videoId,
        sourceUrl: input.resume.sourceUrl,
        positionMs: input.resume.lastPositionMs
      },
      reason: {
        code: "unfinished-content",
        ...(input.resume.title ? { title: input.resume.title } : {})
      }
    });
  }

  const latestSnapshots = new Map<string, RecommendationInput["progressSnapshots"][number]>();
  for (const snapshot of input.progressSnapshots) {
    const previous = latestSnapshots.get(snapshot.videoId);
    if (!previous || snapshot.capturedAt.localeCompare(previous.capturedAt) > 0) {
      latestSnapshots.set(snapshot.videoId, snapshot);
    }
  }

  const revisitCandidates = input.studiedContent
    .filter((record) => record.videoId !== input.resume?.videoId && record.videoId.trim() && record.sourceUrl?.trim())
    .map((record) => {
      const snapshot = latestSnapshots.get(record.videoId);
      const snapshotTime = snapshot ? parseTime(snapshot.capturedAt) : undefined;
      const elapsedDays = snapshotTime === undefined || now < snapshotTime
        ? undefined
        : Math.floor((now - snapshotTime) / DAY_MS);
      return snapshot && elapsedDays !== undefined && elapsedDays >= REVISIT_AFTER_DAYS
        ? { record, snapshot, elapsedDays }
        : undefined;
    })
    .filter((candidate): candidate is { record: RecommendationInput["studiedContent"][number]; snapshot: RecommendationInput["progressSnapshots"][number]; elapsedDays: number } => Boolean(candidate))
    .sort((left, right) =>
      left.snapshot.capturedAt.localeCompare(right.snapshot.capturedAt) ||
      left.record.videoId.localeCompare(right.record.videoId)
    );

  const revisit = revisitCandidates[0];
  if (revisit) {
    candidates.push({
      fingerprint: ["revisit:v1", revisit.record.videoId, revisit.snapshot.capturedAt].join(":"),
      action: {
        type: "revisit",
        videoId: revisit.record.videoId,
        sourceUrl: revisit.record.sourceUrl!.trim()
      },
      reason: {
        code: "revisit-ready",
        ...(revisit.record.title ? { title: revisit.record.title } : {}),
        elapsedDays: revisit.elapsedDays
      }
    });
  }

  candidates.push({
    fingerprint: ["start-new:v1", buildActivityRevision(input)].join(":"),
    action: { type: "start-new" },
    reason: { code: "new-content-fallback" }
  });

  return candidates;
}

export function selectRecommendation(input: RecommendationInput): LearningRecommendation | undefined {
  const now = parseTime(input.now);
  if (now === undefined) return undefined;
  const activeDismissals = new Set(
    input.dismissals
      .filter((dismissal) => {
        const dismissedUntil = parseTime(dismissal.dismissedUntil);
        return dismissedUntil !== undefined && dismissedUntil > now;
      })
      .map((dismissal) => dismissal.fingerprint)
  );

  return buildCandidates(input).find((candidate) => !activeDismissals.has(candidate.fingerprint));
}
