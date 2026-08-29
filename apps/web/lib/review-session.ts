import {
  applyReviewOutcome,
  DeterministicReviewScheduler,
  type ReviewOutcome
} from "@korean-learning/learning-engine";
import {
  completeReviewAtomically,
  getCachedNaturalMeaning,
  getDueReviewItems,
  getMostRecentUsableLearningContext,
  type DueReviewItem,
  type ExplanationDatabase,
  type LearningContextRecord
} from "@korean-learning/storage";

const scheduler = new DeterministicReviewScheduler();

export interface ContextualReviewSession {
  review: DueReviewItem;
  context?: LearningContextRecord;
  naturalMeaning?: string;
}

export async function loadNextContextualReview(
  database: ExplanationDatabase,
  now: string
): Promise<ContextualReviewSession | undefined> {
  const review = (await getDueReviewItems(database, { now, limit: 1 }))[0];
  if (!review) return undefined;

  const context = await getMostRecentUsableLearningContext(database, review.item.id);
  return {
    review,
    context,
    naturalMeaning: context
      ? await getCachedNaturalMeaning(database, context.sentence)
      : undefined
  };
}

export function revealReviewAnswer(session: ContextualReviewSession): ContextualReviewSession {
  return session;
}

export async function completeContextualReview(
  database: ExplanationDatabase,
  input: { review: DueReviewItem; outcome: ReviewOutcome; now: string }
): Promise<void> {
  const previousIntervalDays = input.review.item.nextReviewAt
    ? Math.max(
      1,
      Math.round(
        (Date.parse(input.review.item.nextReviewAt) -
          Date.parse(input.review.item.lastSeenAt ?? input.now)) /
          86_400_000
      )
    )
    : undefined;
  const schedule = scheduler.schedule({
    now: input.now,
    previousIntervalDays,
    outcome: input.outcome
  });
  const item = applyReviewOutcome({
    item: input.review.item,
    outcome: input.outcome,
    schedule,
    now: input.now,
    mode: "recognition"
  });

  await completeReviewAtomically(database, {
    item,
    record: {
      id: crypto.randomUUID(),
      itemId: item.id,
      mode: "recognition",
      outcome: input.outcome,
      reviewedAt: input.now
    }
  });
}
