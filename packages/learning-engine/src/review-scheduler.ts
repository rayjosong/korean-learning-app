export type ReviewOutcome = "success" | "failure";

export interface ReviewSchedule {
  /** Whole-day spacing, kept explicit so it can be persisted by the caller. */
  intervalDays: number;
  /** ISO timestamp of the next review. */
  nextReviewAt: string;
}

export interface ScheduleReviewInput {
  now: string;
  /** The item's prior interval. Omit for its first reviewed transition. */
  previousIntervalDays?: number;
  outcome: ReviewOutcome;
}

/**
 * Boundary for review algorithms. The application layer owns persistence;
 * scheduling stays deterministic and independently replaceable (for example,
 * by FSRS later).
 */
export interface ReviewScheduler {
  schedule(input: ScheduleReviewInput): ReviewSchedule;
}

/**
 * Small, explainable default for V0.1:
 * - successful recall doubles spacing (starting at one day);
 * - failed recall halves spacing, never below one day.
 */
export class DeterministicReviewScheduler implements ReviewScheduler {
  schedule(input: ScheduleReviewInput): ReviewSchedule {
    const priorIntervalDays = Math.max(1, Math.floor(input.previousIntervalDays ?? 1));
    const intervalDays =
      input.outcome === "success"
        ? priorIntervalDays * 2
        : Math.max(1, Math.floor(priorIntervalDays / 2));

    const due = new Date(input.now);
    due.setUTCDate(due.getUTCDate() + intervalDays);

    return {
      intervalDays,
      nextReviewAt: due.toISOString()
    };
  }
}
