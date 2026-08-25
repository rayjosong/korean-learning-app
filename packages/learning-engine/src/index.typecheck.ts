import type { LearningContext, LearningItem } from "./index.js";

const context: LearningContext = {
  id: "context-1",
  videoId: "video-1",
  transcriptSegmentId: "segment-1",
  sentence: "오늘은 날씨가 좋아요.",
  startTimeMs: 1_000,
  endTimeMs: 2_500
};

const item: LearningItem = {
  id: "item-1",
  kind: "word",
  text: "날씨",
  state: "learning",
  recognitionConfidence: 0.3,
  productionConfidence: 0.1,
  encounters: 1,
  successes: 0,
  failures: 0,
  contextIds: [context.id],
  nextReviewAt: "2026-08-26T12:00:00.000Z"
};

void item;
