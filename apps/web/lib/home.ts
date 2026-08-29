import {
  getDueReviewCount,
  getMostRecentResumableContent,
  getRecentStudiedContent,
  type ExplanationDatabase
} from "@korean-learning/storage";

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

export interface HomeSnapshot {
  resume?: HomeResume;
  dueReviewCount: number;
  recentContent: HomeContent[];
  recommendedContent?: HomeContent[];
}

export type HomeLoadResult =
  | { status: "ready"; snapshot: HomeSnapshot }
  | { status: "error"; message: string };

/**
 * Reads the small set of local-first data needed by Home. Rendering and
 * recommendation decisions stay outside this boundary.
 */
export async function loadHomeSnapshot(
  database: ExplanationDatabase,
  now = new Date().toISOString(),
  recommendedContent: readonly HomeContent[] = []
): Promise<HomeLoadResult> {
  try {
    const [resume, dueReviewCount, studied] = await Promise.all([
      getMostRecentResumableContent(database),
      getDueReviewCount(database, now),
      getRecentStudiedContent(database)
    ]);

    const recentContent = studied
      .filter((record) => record.sourceUrl && record.videoId !== resume?.videoId)
      .map((record) => ({
        videoId: record.videoId,
        sourceUrl: record.sourceUrl!,
        ...(record.title ? { title: record.title } : {}),
        lastStudiedAt: record.lastStudiedAt
      }));

    return {
      status: "ready",
      snapshot: {
        ...(resume ? {
          resume: {
            videoId: resume.videoId,
            sourceUrl: resume.sourceUrl,
            ...(resume.title ? { title: resume.title } : {}),
            lastPositionMs: resume.lastPositionMs,
            ...(resume.durationMs === undefined ? {} : { durationMs: resume.durationMs }),
            updatedAt: resume.updatedAt
          }
        } : {}),
        dueReviewCount,
        recentContent,
        ...(recommendedContent.length ? { recommendedContent: [...recommendedContent] } : {})
      }
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Your Home data could not be loaded."
    };
  }
}

