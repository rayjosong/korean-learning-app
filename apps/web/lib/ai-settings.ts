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

export async function getEffectiveAiSettings(
  database: ExplanationDatabase
): Promise<AiSettings | undefined> {
  const localSettings = await loadAiSettings(database);
  if (localSettings) {
    return localSettings;
  }

  try {
    const response = await fetch("/api/ai-defaults");
    if (response.ok) {
      const { configured } = await response.json();
      if (configured) {
        return {
          apiKey: "deployment-default", // Dummy key, backend will replace it
          model: "deployment-default",   // Dummy model, backend will replace it
          baseUrl: "/api/ai-proxy"       // Point to local proxy route
        };
      }
    }
  } catch (error) {
    // Ignore fetch errors to fallback to undefined
  }
  return undefined;
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
