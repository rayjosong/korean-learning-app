import Dexie, { type Table } from "dexie";

import type { SentenceExplanation } from "@korean-learning/korean";

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

  constructor(name = "korean-learning") {
    super(name);
    this.version(1).stores({ explanations: "key" });
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
