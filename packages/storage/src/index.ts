import Dexie, { type Table } from "dexie";

import type { SentenceExplanation, WordExplanation } from "@korean-learning/korean";
import type { LearningContext, LearningItem, ReviewMode, ReviewOutcome } from "@korean-learning/learning-engine";
import type { ContentProgressSnapshot } from "@korean-learning/learning-engine/revisit";

/**
 * A cached sentence explanation.
 *
 * Holds no provider credentials: API keys must never reach persistence.
 */
export interface ExplanationRecord {
  key: string;
  sentence: string;
  promptVersion: string;
  explanation: SentenceExplanation;
  provider?: string;
  model?: string;
  createdAt: string;
}

/**
 * Cache key for a sentence explanation. Includes the prompt version so a
 * changed prompt invalidates previously cached explanations.
 */
export function explanationCacheKey(promptVersion: string, sentence: string): string {
  return `${promptVersion}:${sentence.replace(/\s+/g, " ").trim()}`;
}

export class ExplanationDatabase extends Dexie {
  explanations!: Table<ExplanationRecord, string>;
  wordExplanations!: Table<WordExplanationRecord, string>;
  learningItems!: Table<LearningItem, string>;
  learningContexts!: Table<LearningContextRecord, string>;
  reviewRecords!: Table<ReviewRecord, string>;
  studiedContent!: Table<StudiedContentRecord, string>;
  contentProgressSnapshots!: Table<ContentProgressSnapshot, string>;

  constructor(name = "korean-learning") {
    super(name);
    this.version(1).stores({ explanations: "key" });
    this.version(2).stores({ wordExplanations: "key" });
    this.version(3).stores({ learningItems: "id, text", learningContexts: "id, itemId" });
    this.version(4).stores({
      explanations: "key, createdAt",
      wordExplanations: "key",
      learningItems: "id, text, lastSeenAt",
      learningContexts: "id, itemId, createdAt"
    });
    this.version(5).stores({
      explanations: "key, createdAt",
      wordExplanations: "key",
      learningItems: "id, text, lastSeenAt",
      learningContexts: "id, itemId, createdAt",
      reviewRecords: "id, itemId, reviewedAt, mode"
    });
    this.version(6).stores({
      explanations: "key, createdAt",
      wordExplanations: "key",
      learningItems: "id, text, lastSeenAt",
      learningContexts: "id, itemId, createdAt",
      reviewRecords: "id, itemId, reviewedAt, mode",
      studiedContent: "videoId, firstStudiedAt, lastStudiedAt"
    });
    this.version(7).stores({
      explanations: "key, createdAt",
      wordExplanations: "key",
      learningItems: "id, text, lastSeenAt",
      learningContexts: "id, itemId, createdAt",
      reviewRecords: "id, itemId, reviewedAt, mode",
      studiedContent: "videoId, firstStudiedAt, lastStudiedAt",
      contentProgressSnapshots: "id, videoId, capturedAt"
    });
  }
}

export async function getCachedExplanation(
  database: ExplanationDatabase,
  key: string
): Promise<SentenceExplanation | undefined> {
  const record = await database.explanations.get(key);
  return record?.explanation;
}

export async function putCachedExplanation(
  database: ExplanationDatabase,
  record: ExplanationRecord
): Promise<void> {
  await database.explanations.put(record);
}

/** Most recently created sentence explanations, newest first. */
export async function getRecentExplanationRecords(
  database: ExplanationDatabase,
  limit = 10
): Promise<ExplanationRecord[]> {
  return database.explanations.orderBy("createdAt").reverse().limit(limit).toArray();
}

export async function clearExplanationCache(database: ExplanationDatabase): Promise<void> {
  await database.explanations.clear();
}

/** A cached word or phrase explanation with its source context. */
export interface WordExplanationRecord {
  key: string;
  word: string;
  sentence: string;
  promptVersion: string;
  explanation: WordExplanation;
  videoId: string;
  transcriptSegmentId: string;
  startTimeMs: number;
  endTimeMs: number;
  provider?: string;
  model?: string;
  createdAt: string;
}

/**
 * Cache key for a word explanation. Includes the prompt version and the
 * source sentence because meaning is contextual.
 */
export function wordExplanationCacheKey(
  promptVersion: string,
  word: string,
  sentence: string
): string {
  return `${promptVersion}:${word.replace(/\s+/g, " ").trim()}:${sentence}`;
}

export async function getCachedWordExplanation(
  database: ExplanationDatabase,
  key: string
): Promise<WordExplanation | undefined> {
  const record = await database.wordExplanations.get(key);
  return record?.explanation;
}

export async function getWordExplanationRecord(
  database: ExplanationDatabase,
  key: string
): Promise<WordExplanationRecord | undefined> {
  return database.wordExplanations.get(key);
}

export async function putCachedWordExplanation(
  database: ExplanationDatabase,
  record: WordExplanationRecord
): Promise<void> {
  await database.wordExplanations.put(record);
}

/** A stored source context, owned by one learning item. */
export interface LearningContextRecord extends LearningContext {
  itemId: string;
  createdAt: string;
}

export async function getLearningItemByText(
  database: ExplanationDatabase,
  text: string
): Promise<LearningItem | undefined> {
  return database.learningItems
    .where("text")
    .equals(text.replace(/\s+/g, " ").trim())
    .first();
}

export async function putLearningItem(
  database: ExplanationDatabase,
  item: LearningItem
): Promise<void> {
  await database.learningItems.put(item);
}

export async function putLearningContext(
  database: ExplanationDatabase,
  context: LearningContextRecord
): Promise<void> {
  await database.learningContexts.put(context);
}

export interface RecentLearningItem {
  item: LearningItem;
  /** The most recently saved source context, if one is still available. */
  context?: LearningContextRecord;
}

/** Most recently encountered learning items with their latest source context. */
export async function getRecentLearningItems(
  database: ExplanationDatabase,
  limit = 10
): Promise<RecentLearningItem[]> {
  const items = await database.learningItems.orderBy("lastSeenAt").reverse().limit(limit).toArray();

  return Promise.all(
    items.map(async (item) => {
      const contexts = await database.learningContexts.where("itemId").equals(item.id).toArray();
      const context = contexts.sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
      return context ? { item, context } : { item };
    })
  );
}

export async function deleteLearningContext(
  database: ExplanationDatabase,
  contextId: string
): Promise<void> {
  await database.learningContexts.delete(contextId);
}

/** Removes a learning item and its contexts in one transaction. */
export async function deleteLearningItem(
  database: ExplanationDatabase,
  itemId: string
): Promise<void> {
  await database.transaction("rw", database.learningItems, database.learningContexts, async () => {
    await database.learningItems.delete(itemId);
    await database.learningContexts.where("itemId").equals(itemId).delete();
  });
}


/** One due learner item with the source sentence used to review it in context. */
export interface DueReviewItem {
  item: LearningItem;
  context?: LearningContextRecord;
}

/** A durable audit of how the learner practised an item. */
export interface ReviewRecord {
  id: string;
  itemId: string;
  mode: ReviewMode;
  outcome: ReviewOutcome;
  reviewedAt: string;
}

export async function putReviewRecord(database: ExplanationDatabase, record: ReviewRecord): Promise<void> {
  await database.reviewRecords.put(record);
}

/** Local activity for a successfully loaded piece of study content. */
export interface StudiedContentRecord {
  videoId: string;
  firstStudiedAt: string;
  lastStudiedAt: string;
}

export async function recordStudiedContent(
  database: ExplanationDatabase,
  input: { videoId: string; studiedAt: string }
): Promise<void> {
  const existing = await database.studiedContent.get(input.videoId);
  await database.studiedContent.put({
    videoId: input.videoId,
    firstStudiedAt: existing?.firstStudiedAt ?? input.studiedAt,
    lastStudiedAt: input.studiedAt
  });
}

export async function getContentProgressSnapshots(
  database: ExplanationDatabase,
  videoId: string
): Promise<ContentProgressSnapshot[]> {
  return database.contentProgressSnapshots
    .where("videoId")
    .equals(videoId)
    .sortBy("capturedAt");
}

export async function putContentProgressSnapshot(
  database: ExplanationDatabase,
  snapshot: ContentProgressSnapshot
): Promise<void> {
  await database.contentProgressSnapshots.put(snapshot);
}

export interface ProgressSnapshotInput {
  items: LearningItem[];
  reviews: ReviewRecord[];
  explanations: ExplanationRecord[];
  studiedContent: StudiedContentRecord[];
}

/** Reads all progress inputs in one read transaction for a consistent snapshot. */
export async function getProgressSnapshotInput(
  database: ExplanationDatabase
): Promise<ProgressSnapshotInput> {
  return database.transaction(
    "r",
    database.learningItems,
    database.reviewRecords,
    database.explanations,
    database.studiedContent,
    async () => ({
      items: await database.learningItems.toArray(),
      reviews: await database.reviewRecords.toArray(),
      explanations: await database.explanations.toArray(),
      studiedContent: await database.studiedContent.toArray()
    })
  );
}

/**
 * Due learning items ordered from the most overdue to the least overdue.
 * A positive limit caps a review session without changing persisted state.
 */
export async function getDueReviewItems(
  database: ExplanationDatabase,
  options: { now: string; limit?: number }
): Promise<DueReviewItem[]> {
  const limit = Math.max(0, Math.floor(options.limit ?? 10));
  if (limit === 0) return [];

  const items = (await database.learningItems.toArray())
    .filter(
      (item) =>
        item.state === "learning" &&
        typeof item.nextReviewAt === "string" &&
        item.nextReviewAt <= options.now
    )
    .sort((left, right) => {
      const dueOrder = left.nextReviewAt!.localeCompare(right.nextReviewAt!);
      return dueOrder !== 0 ? dueOrder : left.id.localeCompare(right.id);
    })
    .slice(0, limit);

  return Promise.all(
    items.map(async (item) => {
      const contexts = await database.learningContexts.where("itemId").equals(item.id).toArray();
      const context = contexts.sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
      return context ? { item, context } : { item };
    })
  );
}
