import {
  clearAiProviderSettings,
  getAiProviderSettings,
  saveProviderProfile,
  setTaskRoute
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
  const profile = settings.profiles.openai ?? Object.values(settings.profiles)[0];
  if (!profile) return undefined;
  const { apiKey, defaultModel: model, baseUrl } = profile;
  return { apiKey, model, ...(baseUrl ? { baseUrl } : {}) };
}

export async function saveAiSettings(
  database: ExplanationDatabase,
  settings: AiSettings
): Promise<void> {
  await saveProviderProfile(database, {
    provider: "openai",
    apiKey: settings.apiKey,
    defaultModel: settings.model,
    ...(settings.baseUrl ? { baseUrl: settings.baseUrl } : {})
  });
  await setTaskRoute(database, "sentence", { provider: "openai", model: settings.model });
  await setTaskRoute(database, "word", { provider: "openai", model: settings.model });
}

export async function removeAiSettings(database: ExplanationDatabase): Promise<void> {
  await clearAiProviderSettings(database);
}
