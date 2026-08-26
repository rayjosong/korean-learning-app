import {
  estimateVideoDifficulty,
  type DifficultyEstimate,
  type LearningItem
} from "@korean-learning/learning-engine/video-difficulty";
import type { ExplanationDatabase } from "@korean-learning/storage";

export type VideoDifficultyLoadResult =
  | { status: "ready"; estimate: DifficultyEstimate }
  | { status: "error"; message: string };

export async function loadVideoDifficulty(
  database: ExplanationDatabase,
  segments: readonly { text: string }[]
): Promise<VideoDifficultyLoadResult> {
  try {
    const items = await database.learningItems.toArray() as LearningItem[];
    return { status: "ready", estimate: estimateVideoDifficulty({ segments, items }) };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "The video estimate could not be loaded."
    };
  }
}
