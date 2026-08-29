import {
  getRecommendationInput,
  putRecommendationDismissal,
  type ExplanationDatabase
} from "@korean-learning/storage";
import {
  selectRecommendation,
  type LearningRecommendation,
  type RecommendationInput
} from "@korean-learning/learning-engine/recommendation";

export interface HomeContent {
  videoId: string;
  sourceUrl: string;
  title?: string;
  lastStudiedAt?: string;
}

export interface HomeResume extends HomeContent {
  lastPositionMs: number;
  durationMs?: number;
  updatedAt: string;
}

export interface HomeRecommendation extends LearningRecommendation {
  reasonText: string;
}

export interface HomeSnapshot {
  resume?: HomeResume;
  dueReviewCount: number;
  recentContent: HomeContent[];
  recommendedContent?: HomeContent[];
  recommendation?: HomeRecommendation;
}

export type HomeLoadResult =
  | { status: "ready"; snapshot: HomeSnapshot }
  | { status: "error"; message: string };

function reviewReasonText(reason: Extract<HomeRecommendation["reason"], { code: "recent-review-weakness" }>): string {
  return `${reason.failures} ${reason.mode} review${reason.failures === 1 ? "" : "s"} were missed in the last ${reason.windowDays} days.`;
}

function reasonText(reason: HomeRecommendation["reason"]): string {
  switch (reason.code) {
    case "recent-review-weakness":
      return reviewReasonText(reason);
    case "items-due":
      return `${reason.count} ${reason.count === 1 ? "phrase is" : "phrases are"} ready for review.`;
    case "unfinished-content":
      return reason.title ? `Continue "${reason.title}" where you left off.` : "Continue the video you last studied.";
    case "revisit-ready":
      return `It has been ${reason.elapsedDays} days since you studied this video.`;
    case "new-content-fallback":
      return "Start a new Korean video when nothing is waiting.";
  }
}

function toLearningInput(input: Awaited<ReturnType<typeof getRecommendationInput>>, now: string): RecommendationInput {
  return {
    now,
    dueItems: input.dueItems,
    recentReviews: input.recentReviews,
    studiedContent: input.studiedContent,
    progressSnapshots: input.progressSnapshots,
    resume: input.resume,
    dismissals: input.dismissals
  };
}

function toHomeResume(resume: NonNullable<Awaited<ReturnType<typeof getRecommendationInput>>["resume"]>): HomeResume {
  return {
    videoId: resume.videoId,
    sourceUrl: resume.sourceUrl,
    ...(resume.title ? { title: resume.title } : {}),
    lastPositionMs: resume.lastPositionMs,
    ...(resume.durationMs === undefined ? {} : { durationMs: resume.durationMs }),
    updatedAt: resume.updatedAt
  };
}

export async function loadHomeSnapshot(
  database: ExplanationDatabase,
  now = new Date().toISOString(),
  recommendedContent: readonly HomeContent[] = []
): Promise<HomeLoadResult> {
  try {
    const input = await getRecommendationInput(database, now);
    const resume = input.resume ? toHomeResume(input.resume) : undefined;
    const recentContent = [...input.studiedContent]
      .sort((left, right) => right.lastStudiedAt.localeCompare(left.lastStudiedAt))
      .filter((record) => record.sourceUrl && record.videoId !== resume?.videoId)
      .slice(0, 4)
      .map((record) => ({
        videoId: record.videoId,
        sourceUrl: record.sourceUrl!,
        ...(record.title ? { title: record.title } : {}),
        lastStudiedAt: record.lastStudiedAt
      }));
    const recommendation = selectRecommendation(toLearningInput(input, now));

    return {
      status: "ready",
      snapshot: {
        ...(resume ? { resume } : {}),
        dueReviewCount: input.dueItems.length,
        recentContent,
        ...(recommendedContent.length ? { recommendedContent: [...recommendedContent] } : {}),
        ...(recommendation ? { recommendation: { ...recommendation, reasonText: reasonText(recommendation.reason) } } : {})
      }
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Your Home data could not be loaded."
    };
  }
}

export async function dismissHomeRecommendation(
  database: ExplanationDatabase,
  fingerprint: string,
  now = new Date().toISOString()
): Promise<void> {
  const dismissedAt = new Date(now);
  if (!Number.isFinite(dismissedAt.valueOf())) throw new Error("Recommendation time is invalid.");
  dismissedAt.setUTCDate(dismissedAt.getUTCDate() + 7);
  await putRecommendationDismissal(database, {
    fingerprint,
    dismissedAt: now,
    dismissedUntil: dismissedAt.toISOString()
  });
}
