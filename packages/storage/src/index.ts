import Dexie, { type Table } from "dexie";

import type { SentenceExplanation, WordExplanation } from "@korean-learning/korean";
import type { LearningContext, LearningItem } from "@korean-learning/learning-engine";

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

  constructor(name = "korean-learning") {
    super(name);
    this.version(1).stores({ explanations: "key" });
    this.version(2).stores({ wordExplanations: "key" });
    this.version(3).stores({ learningItems: "id, text", learningContexts: "id, itemId" });
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
