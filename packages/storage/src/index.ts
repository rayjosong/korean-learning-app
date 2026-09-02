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
  aiProviderSettings!: Table<import("./ai-settings.ts").AiProviderSettingsRecord, string>;
  aiModelSelection!: Table<import("./ai-settings.ts").AiModelSelectionRecord, string>;
  assistanceSettings!: Table<import("./assistance-settings.ts").AssistanceSettingsRecord, string>;
  studiedContent!: Table<StudiedContentRecord, string>;
  contentProgressSnapshots!: Table<ContentProgressSnapshot, string>;
  contentResume!: Table<ContentResumeRecord, string>;
  recommendationDismissals!: Table<RecommendationDismissalRecord, string>;

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
    this.version(8).stores({
      explanations: "key, createdAt",
      wordExplanations: "key",
      learningItems: "id, text, lastSeenAt",
      learningContexts: "id, itemId, createdAt",
      reviewRecords: "id, itemId, reviewedAt, mode",
      studiedContent: "videoId, firstStudiedAt, lastStudiedAt",
      contentProgressSnapshots: "id, videoId, capturedAt",
      aiProviderSettings: "id"
    });
    this.version(9).stores({
      explanations: "key, createdAt",
      wordExplanations: "key",
      learningItems: "id, text, lastSeenAt",
      learningContexts: "id, itemId, createdAt",
      reviewRecords: "id, itemId, reviewedAt, mode",
      studiedContent: "videoId, firstStudiedAt, lastStudiedAt",
      contentProgressSnapshots: "id, videoId, capturedAt",
      aiProviderSettings: "id",
      assistanceSettings: "id"
    });
    this.version(10).stores({
      explanations: "key, createdAt",
      wordExplanations: "key",
      learningItems: "id, text, lastSeenAt",
      learningContexts: "id, itemId, createdAt",
      reviewRecords: "id, itemId, reviewedAt, mode",
      studiedContent: "videoId, firstStudiedAt, lastStudiedAt",
      contentProgressSnapshots: "id, videoId, capturedAt",
      aiProviderSettings: "id",
      assistanceSettings: "id",
      contentResume: "videoId, updatedAt"
    });
    this.version(11).stores({
      explanations: "key, createdAt",
      wordExplanations: "key",
      learningItems: "id, text, lastSeenAt",
      learningContexts: "id, itemId, createdAt",
      reviewRecords: "id, itemId, reviewedAt, mode",
      studiedContent: "videoId, firstStudiedAt, lastStudiedAt",
      contentProgressSnapshots: "id, videoId, capturedAt",
      aiProviderSettings: "id",
      assistanceSettings: "id",
      contentResume: "videoId, updatedAt",
      recommendationDismissals: "fingerprint, dismissedUntil"
    });
    // Implementation 33 reused this table without changing the Dexie version.
    // Convert its new record shape back to the legacy shape during rollback.
    this.version(12)
      .stores({
        explanations: "key, createdAt",
        wordExplanations: "key",
        learningItems: "id, text, lastSeenAt",
        learningContexts: "id, itemId, createdAt",
        reviewRecords: "id, itemId, reviewedAt, mode",
        studiedContent: "videoId, firstStudiedAt, lastStudiedAt",
        contentProgressSnapshots: "id, videoId, capturedAt",
        aiProviderSettings: "id",
        assistanceSettings: "id",
        contentResume: "videoId, updatedAt",
        recommendationDismissals: "fingerprint, dismissedUntil"
      })
      .upgrade(async (transaction) => {
        const table = transaction.table("aiProviderSettings");
        const record = await table.get("default");

        if (!record) return;

        // Already in the legacy format. Leave it untouched.
        if (
          typeof record.provider === "string" &&
          typeof record.model === "string" &&
          typeof record.apiKey === "string"
        ) {
          return;
        }

        // Preserve the OpenAI profile when it exists. The rolled-back app
        // supports the legacy OpenAI-compatible provider only.
        const profile = record.profiles?.openai;
        if (
          profile &&
          typeof profile.apiKey === "string" &&
          typeof profile.defaultModel === "string"
        ) {
          await table.put({
            id: "default",
            provider: "openai-compatible",
            model: profile.defaultModel,
            ...(typeof profile.baseUrl === "string" && profile.baseUrl.trim()
              ? { baseUrl: profile.baseUrl.trim() }
              : {}),
            apiKey: profile.apiKey,
            updatedAt:
              typeof profile.updatedAt === "string"
                ? profile.updatedAt
                : new Date().toISOString()
          });
          return;
        }

        // Do not leave a record that the rolled-back code cannot interpret.
        await table.delete("default");
      });
    this.version(13)
      .stores({
        explanations: "key, createdAt",
        wordExplanations: "key",
        learningItems: "id, text, lastSeenAt",
        learningContexts: "id, itemId, createdAt",
        reviewRecords: "id, itemId, reviewedAt, mode",
        studiedContent: "videoId, firstStudiedAt, lastStudiedAt",
        contentProgressSnapshots: "id, videoId, capturedAt",
        aiProviderSettings: "id",
        aiModelSelection: "id",
        assistanceSettings: "id",
        contentResume: "videoId, updatedAt",
        recommendationDismissals: "fingerprint, dismissedUntil"
      })
      .upgrade(async (transaction) => {
        const table = transaction.table("aiProviderSettings");
        const legacy = await table.get("default");
        if (!legacy || typeof legacy.model !== "string" || typeof legacy.apiKey !== "string") return;
        await table.put({
          id: "openai-compatible",
          provider: "openai-compatible",
          enabled: typeof legacy.enabled === "boolean" ? legacy.enabled : true,
          model: legacy.model,
          apiKey: legacy.apiKey,
          ...(typeof legacy.baseUrl === "string" && legacy.baseUrl.trim() ? { baseUrl: legacy.baseUrl.trim() } : {}),
          updatedAt: typeof legacy.updatedAt === "string" ? legacy.updatedAt : new Date().toISOString()
        });
        await table.delete("default");
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

  if (items.length === 0) return [];

  const itemIds = items.map((item) => item.id);
  const allContexts = await database.learningContexts.where("itemId").anyOf(itemIds).toArray();

  const latestContexts = new Map<string, LearningContextRecord>();
  for (const context of allContexts) {
    const existing = latestContexts.get(context.itemId);
    if (!existing || context.createdAt > existing.createdAt) {
      latestContexts.set(context.itemId, context);
    }
  }

  return items.map((item) => {
    const context = latestContexts.get(item.id);
    return context ? { item, context } : { item };
  });
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

/** The most recently created context that can provide a bounded source clip. */
export async function getMostRecentUsableLearningContext(
  database: ExplanationDatabase,
  itemId: string
): Promise<LearningContextRecord | undefined> {
  const contexts = await database.learningContexts.where("itemId").equals(itemId).toArray();
  return contexts
    .filter((context) =>
      Boolean(
        context.videoId.trim() &&
        context.transcriptSegmentId.trim() &&
        context.sentence.trim() &&
        Number.isFinite(context.startTimeMs) &&
        Number.isFinite(context.endTimeMs) &&
        context.startTimeMs >= 0 &&
        context.endTimeMs > context.startTimeMs
      )
    )
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt) || right.id.localeCompare(left.id))[0];
}

/** Looks up cached natural meaning without coupling Review to an AI provider. */
export async function getCachedNaturalMeaning(
  database: ExplanationDatabase,
  sentence: string
): Promise<string | undefined> {
  const normalized = sentence.replace(/\s+/g, " ").trim();
  const records = (await database.explanations.toArray())
    .filter((record) => record.sentence.replace(/\s+/g, " ").trim() === normalized)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  return records[0]?.explanation.naturalMeaning;
}

/** Persists learner-state and its review audit record in one transaction. */
export async function completeReviewAtomically(
  database: ExplanationDatabase,
  input: { item: LearningItem; record: ReviewRecord }
): Promise<void> {
  await database.transaction("rw", database.learningItems, database.reviewRecords, async () => {
    await database.learningItems.put(input.item);
    await database.reviewRecords.put(input.record);
  });
}

/** Local activity for a successfully loaded piece of study content. */
export interface StudiedContentRecord {
  videoId: string;
  firstStudiedAt: string;
  lastStudiedAt: string;
  sourceUrl?: string;
  title?: string;
}

export async function recordStudiedContent(
  database: ExplanationDatabase,
  input: { videoId: string; studiedAt: string; sourceUrl?: string; title?: string }
): Promise<void> {
  const existing = await database.studiedContent.get(input.videoId);
  await database.studiedContent.put({
    videoId: input.videoId,
    firstStudiedAt: existing?.firstStudiedAt ?? input.studiedAt,
    lastStudiedAt: input.studiedAt,
    ...(input.sourceUrl ?? existing?.sourceUrl ? { sourceUrl: input.sourceUrl ?? existing?.sourceUrl } : {}),
    ...(input.title ?? existing?.title ? { title: input.title ?? existing?.title } : {})
  });
}

/** A resumable media position owned by the local learner. */
export interface ContentResumeRecord {
  videoId: string;
  sourceUrl: string;
  title?: string;
  lastPositionMs: number;
  durationMs?: number;
  completed: boolean;
  updatedAt: string;
}

export async function putContentResume(
  database: ExplanationDatabase,
  record: ContentResumeRecord
): Promise<void> {
  await database.contentResume.put({
    ...record,
    lastPositionMs: Math.max(0, Math.round(record.lastPositionMs)),
    ...(record.durationMs === undefined ? {} : { durationMs: Math.max(0, Math.round(record.durationMs)) })
  });
}

export async function getMostRecentResumableContent(
  database: ExplanationDatabase
): Promise<ContentResumeRecord | undefined> {
  const records = await database.contentResume.orderBy("updatedAt").reverse().toArray();
  return records.find((record) => !record.completed && record.lastPositionMs > 0);
}

export async function getRecentStudiedContent(
  database: ExplanationDatabase,
  limit = 4
): Promise<StudiedContentRecord[]> {
  return database.studiedContent.orderBy("lastStudiedAt").reverse().limit(Math.max(0, Math.floor(limit))).toArray();
}

export async function getDueReviewCount(
  database: ExplanationDatabase,
  now: string
): Promise<number> {
  const items = await database.learningItems.toArray();
  return items.filter(
    (item) => item.state === "learning" && typeof item.nextReviewAt === "string" && item.nextReviewAt <= now
  ).length;
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

  if (items.length === 0) return [];

  const itemIds = items.map((item) => item.id);
  const allContexts = await database.learningContexts.where("itemId").anyOf(itemIds).toArray();

  const latestContexts = new Map<string, LearningContextRecord>();
  for (const context of allContexts) {
    const existing = latestContexts.get(context.itemId);
    if (!existing || context.createdAt > existing.createdAt) {
      latestContexts.set(context.itemId, context);
    }
  }

  return items.map((item) => {
    const context = latestContexts.get(item.id);
    return context ? { item, context } : { item };
  });
}

/** Local-only identity of a dismissed recommendation. */
export interface RecommendationDismissalRecord {
  fingerprint: string;
  dismissedAt: string;
  dismissedUntil: string;
}

export interface RecommendationInput {
  dueItems: LearningItem[];
  recentReviews: ReviewRecord[];
  studiedContent: StudiedContentRecord[];
  progressSnapshots: ContentProgressSnapshot[];
  resume?: ContentResumeRecord;
  dismissals: RecommendationDismissalRecord[];
}

/** Reads all recommendation evidence in one transaction for a coherent Home result. */
export async function getRecommendationInput(
  database: ExplanationDatabase,
  now: string
): Promise<RecommendationInput> {
  const [input, dismissals] = await Promise.all([
    database.transaction(
      "r",
      database.learningItems,
      database.reviewRecords,
      database.studiedContent,
      database.contentProgressSnapshots,
      database.contentResume,
      async () => {
        const [items, recentReviews, studiedContent, progressSnapshots, resume] = await Promise.all([
          database.learningItems.toArray(),
          database.reviewRecords.toArray(),
          database.studiedContent.toArray(),
          database.contentProgressSnapshots.toArray(),
          database.contentResume.orderBy("updatedAt").reverse().toArray()
        ]);
        return {
          dueItems: items.filter(
            (item) => item.state === "learning" && typeof item.nextReviewAt === "string" && item.nextReviewAt <= now
          ),
          recentReviews,
          studiedContent,
          progressSnapshots,
          resume: resume.find((record) => !record.completed && record.lastPositionMs > 0)
        };
      }
    ),
    database.recommendationDismissals.toArray()
  ]);
  return { ...input, dismissals };
}

export async function putRecommendationDismissal(
  database: ExplanationDatabase,
  record: RecommendationDismissalRecord
): Promise<void> {
  await database.recommendationDismissals.put(record);
}
