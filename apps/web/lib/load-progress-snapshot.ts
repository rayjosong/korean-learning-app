import { aggregateProgressSnapshot, type ProgressSnapshot } from "@korean-learning/learning-engine/progress";
import { getProgressSnapshotInput, type ExplanationDatabase } from "@korean-learning/storage";

export type ProgressSnapshotLoadResult =
  | { status: "ready"; snapshot: ProgressSnapshot }
  | { status: "error"; message: string };

export async function loadProgressSnapshot(
  database: ExplanationDatabase,
  now = new Date().toISOString()
): Promise<ProgressSnapshotLoadResult> {
  try {
    const input = await getProgressSnapshotInput(database);
    return { status: "ready", snapshot: aggregateProgressSnapshot({ ...input, now }) };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Your progress could not be loaded."
    };
  }
}
