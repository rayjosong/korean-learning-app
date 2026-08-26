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
  /** Dictionary form is supporting metadata, never the item identity. */
  dictionaryForm?: string;
  recognitionConfidence: number;
  productionConfidence: number;
  encounters: number;
  successes: number;
  failures: number;
  contextIds: readonly string[];
  lastSeenAt?: string;
  nextReviewAt?: string;
}

/** Infers whether a clicked form is a single word or a multi-word phrase. */
export function inferLearnerItemKind(text: string): "word" | "phrase" {
  return /\s/.test(text.trim()) ? "phrase" : "word";
}

/**
 * Deterministic context id so re-clicking the same form in the same segment
 * reuses one source context instead of duplicating it.
 */
export function learningContextId(input: {
  text: string;
  videoId: string;
  transcriptSegmentId: string;
}): string {
  return `${input.videoId}:${input.transcriptSegmentId}:${input.text.replace(/\s+/g, " ").trim()}`;
}

export interface MarkKnownInput {
  existing?: LearningItem;
  text: string;
  dictionaryForm?: string;
  context: LearningContext;
  now: string;
}

export interface MarkKnownResult {
  item: LearningItem;
  /** Snapshot to restore when the learner undoes the save. */
  previousItem?: LearningItem;
  isNew: boolean;
}

/**
 * Marks a clicked word or phrase as known. The clicked surface form is the
 * learner item identity; repeated encounters reuse the item and add contexts.
 */
export function markKnown(input: MarkKnownInput): MarkKnownResult {
  const text = input.text.replace(/\s+/g, " ").trim();
  const dictionaryForm = input.dictionaryForm?.trim() || undefined;
  const existing = input.existing;

  if (!existing) {
    return {
      item: {
        id: crypto.randomUUID(),
        kind: inferLearnerItemKind(text),
        text,
        state: "known",
        ...(dictionaryForm ? { dictionaryForm } : {}),
        recognitionConfidence: 0,
        productionConfidence: 0,
        encounters: 1,
        successes: 0,
        failures: 0,
        contextIds: [input.context.id],
        lastSeenAt: input.now
      },
      isNew: true
    };
  }

  const contextIds = existing.contextIds.includes(input.context.id)
    ? existing.contextIds
    : [...existing.contextIds, input.context.id];

  return {
    item: {
      ...existing,
      state: "known",
      ...(dictionaryForm && !existing.dictionaryForm ? { dictionaryForm } : {}),
      encounters: existing.encounters + 1,
      contextIds,
      lastSeenAt: input.now
    },
    previousItem: existing,
    isNew: false
  };
}


export interface MarkLearningInput {
  existing?: LearningItem;
  text: string;
  dictionaryForm?: string;
  context: LearningContext;
  now: string;
  /** The first deterministic review due date, supplied by the application layer. */
  initialReviewAt: string;
}

export interface MarkLearningResult {
  item: LearningItem;
  /** Snapshot to restore when the learner undoes the save. */
  previousItem?: LearningItem;
  isNew: boolean;
}

/**
 * Adds a clicked form to learning. Surface form remains the learner-item
 * identity; dictionary form is optional supporting metadata.
 */
export function markLearning(input: MarkLearningInput): MarkLearningResult {
  const text = input.text.replace(/\s+/g, " ").trim();
  const dictionaryForm = input.dictionaryForm?.trim() || undefined;
  const existing = input.existing;

  if (!existing) {
    return {
      item: {
        id: crypto.randomUUID(),
        kind: inferLearnerItemKind(text),
        text,
        state: "learning",
        ...(dictionaryForm ? { dictionaryForm } : {}),
        recognitionConfidence: 0,
        productionConfidence: 0,
        encounters: 1,
        successes: 0,
        failures: 0,
        contextIds: [input.context.id],
        lastSeenAt: input.now,
        nextReviewAt: input.initialReviewAt
      },
      isNew: true
    };
  }

  const contextIds = existing.contextIds.includes(input.context.id)
    ? existing.contextIds
    : [...existing.contextIds, input.context.id];

  return {
    item: {
      ...existing,
      state: "learning",
      ...(dictionaryForm && !existing.dictionaryForm ? { dictionaryForm } : {}),
      encounters: existing.encounters + 1,
      contextIds,
      lastSeenAt: input.now,
      nextReviewAt: input.initialReviewAt
    },
    previousItem: existing,
    isNew: false
  };
}

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
