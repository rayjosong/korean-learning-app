import {
  clearAiProviderSettings,
  getAiProviderSettings,
  putAiProviderSettings
} from "@korean-learning/storage/ai-settings";
import type { ExplanationDatabase } from "@korean-learning/storage";

export type { ExplanationDatabase };

export interface AiSettings {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export async function loadAiSettings(
  database: ExplanationDatabase
): Promise<AiSettings | undefined> {
  const settings = await getAiProviderSettings(database);
  if (!settings) return undefined;
  const { apiKey, model, baseUrl } = settings;
  return { apiKey, model, ...(baseUrl ? { baseUrl } : {}) };
}

export async function saveAiSettings(
  database: ExplanationDatabase,
  settings: AiSettings
): Promise<void> {
  await putAiProviderSettings(database, { ...settings, provider: "openai-compatible" });
}

export async function removeAiSettings(database: ExplanationDatabase): Promise<void> {
  await clearAiProviderSettings(database);
}
