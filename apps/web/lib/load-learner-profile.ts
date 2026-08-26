import { aggregateLearnerProfile, type LearnerProfile } from "@korean-learning/learning-engine/profile";
import type { ExplanationDatabase } from "@korean-learning/storage";
import { getLearnerProfileInput } from "@korean-learning/storage/learner-profile";

export type LearnerProfileLoadResult =
  | { status: "ready"; profile: LearnerProfile }
  | { status: "error"; message: string };

/** Application boundary for building the local-only learner profile. */
export async function loadLearnerProfile(
  database: ExplanationDatabase
): Promise<LearnerProfileLoadResult> {
  try {
    const input = await getLearnerProfileInput(database);
    return { status: "ready", profile: aggregateLearnerProfile(input) };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Your learner profile could not be loaded."
    };
  }
}
