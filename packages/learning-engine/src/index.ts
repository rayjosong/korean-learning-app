/** The learner's current familiarity state for a word or phrase. */
export type LearningState = "unknown" | "learning" | "known";

/** A source occurrence that gives a learning item its real-content context. */
export interface LearningContext {
  id: string;
  videoId: string;
  transcriptSegmentId: string;
  sentence: string;
  startTimeMs: number;
  endTimeMs: number;
}

/** Learner-owned progress and review state for a Korean word or phrase. */
export interface LearningItem {
  id: string;
  kind: "word" | "phrase";
  text: string;
  state: LearningState;
  recognitionConfidence: number;
  productionConfidence: number;
  encounters: number;
  successes: number;
  failures: number;
  contextIds: readonly string[];
  lastSeenAt?: string;
  nextReviewAt?: string;
}
