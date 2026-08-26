import {
  applyReviewOutcome,
  DeterministicReviewScheduler,
  type ReviewMode,
  type ReviewOutcome
} from "@korean-learning/learning-engine";
import {
  putLearningItem,
  putReviewRecord,
  type DueReviewItem,
  type ExplanationDatabase
} from "@korean-learning/storage";

const scheduler = new DeterministicReviewScheduler();

/** Application use case: schedule, persist, and record one completed review. */
export async function completeReview(input: {
  database: ExplanationDatabase;
  review: DueReviewItem;
  outcome: ReviewOutcome;
  mode: ReviewMode;
  now?: string;
}): Promise<void> {
  const now = input.now ?? new Date().toISOString();
  const previousIntervalDays = input.review.item.nextReviewAt
    ? Math.max(1, Math.round((Date.parse(input.review.item.nextReviewAt) - Date.parse(input.review.item.lastSeenAt ?? now)) / 86_400_000))
    : undefined;
  const schedule = scheduler.schedule({ now, previousIntervalDays, outcome: input.outcome });
  const item = applyReviewOutcome({
    item: input.review.item,
    outcome: input.outcome,
    schedule,
    now,
    mode: input.mode
  });
  await input.database.transaction("rw", input.database.learningItems, input.database.reviewRecords, async () => {
    await putLearningItem(input.database, item);
    await putReviewRecord(input.database, {
      id: crypto.randomUUID(),
      itemId: item.id,
      mode: input.mode,
      outcome: input.outcome,
      reviewedAt: now
    });
  });
}

/** Compatibility entry point for the existing cloze panel. */
export async function completeClozeReview(input: Omit<Parameters<typeof completeReview>[0], "mode">): Promise<void> {
  await completeReview({ ...input, mode: "cloze" });
}
