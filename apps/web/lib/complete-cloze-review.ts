import {
  applyReviewOutcome,
  DeterministicReviewScheduler,
  type ReviewOutcome
} from "@korean-learning/learning-engine";
import {
  putLearningItem,
  type DueReviewItem,
  type ExplanationDatabase
} from "@korean-learning/storage";

const scheduler = new DeterministicReviewScheduler();

/** Application use case: schedule and persist one completed cloze review. */
export async function completeClozeReview(input: {
  database: ExplanationDatabase;
  review: DueReviewItem;
  outcome: ReviewOutcome;
  now?: string;
}): Promise<void> {
  const now = input.now ?? new Date().toISOString();
  const previousIntervalDays = input.review.item.nextReviewAt
    ? Math.max(1, Math.round((Date.parse(input.review.item.nextReviewAt) - Date.parse(input.review.item.lastSeenAt ?? now)) / 86_400_000))
    : undefined;
  const schedule = scheduler.schedule({ now, previousIntervalDays, outcome: input.outcome });
  await putLearningItem(input.database, applyReviewOutcome({
    item: input.review.item,
    outcome: input.outcome,
    schedule,
    now
  }));
}
