import {
  compareContentProgress,
  createContentProgressSnapshot,
  type ContentProgressComparison
} from "@korean-learning/learning-engine/revisit";
import { estimateVideoDifficulty } from "@korean-learning/learning-engine/video-difficulty";
import {
  getContentProgressSnapshots,
  getProgressSnapshotInput,
  type ExplanationDatabase,
  putContentProgressSnapshot
} from "@korean-learning/storage";

export type RevisitProgressLoadResult =
  | { status: "ready"; comparison: ContentProgressComparison }
  | { status: "error"; message: string };

export async function loadRevisitProgress(input: {
  database: ExplanationDatabase;
  videoId: string;
  segments: readonly { text: string }[];
  sessionId: string;
  now?: string;
}): Promise<RevisitProgressLoadResult> {
  try {
    const now = input.now ?? new Date().toISOString();
    const [snapshots, progressInput] = await Promise.all([
      getContentProgressSnapshots(input.database, input.videoId),
      getProgressSnapshotInput(input.database)
    ]);
    const estimate = estimateVideoDifficulty({ segments: input.segments, items: progressInput.items });
    const current = createContentProgressSnapshot({
      id: input.videoId + ":" + input.sessionId,
      videoId: input.videoId,
      capturedAt: now,
      estimate
    });
    const previous = snapshots
      .filter((snapshot) => snapshot.id !== current.id)
      .sort((left, right) => right.capturedAt.localeCompare(left.capturedAt))[0];
    await putContentProgressSnapshot(input.database, current);
    return { status: "ready", comparison: compareContentProgress(current, previous) };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Revisit progress could not be loaded."
    };
  }
}
