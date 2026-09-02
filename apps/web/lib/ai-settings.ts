import {
  clearAiProviderSettings,
  disableProvider,
  getActiveModelSelection,
  getAiProviderSettings,
  getProviderSettings,
  listAiProviderSettings,
  putAiProviderSettings,
  removeApiProviderCredentials,
  removeProvider,
  saveAndSelectProvider,
  saveProvider,
  saveProviderSettings,
  saveSelectedModelReference,
  selectActiveModel,
  setProviderEnabled
} from "@korean-learning/storage/ai-settings";
import type { ExplanationDatabase } from "@korean-learning/storage";
import type { AiProvider, AiProviderSettingsRecord, CliAiProvider, SaveAiProviderSettings } from "@korean-learning/storage/ai-settings";

export type { ExplanationDatabase };

export interface AiSettings {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export type { AiProvider, AiProviderSettingsRecord, CliAiProvider, SaveAiProviderSettings };

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

export async function loadProviderSettings(database: ExplanationDatabase): Promise<AiProviderSettingsRecord[]> {
  return listAiProviderSettings(database);
}

export async function loadSelectedModel(database: ExplanationDatabase): Promise<string | undefined> {
  return getActiveModelSelection(database);
}

export async function saveOpenAiProvider(
  database: ExplanationDatabase,
  settings: AiSettings & { enabled?: boolean }
): Promise<void> {
  await saveProvider(database, { provider: "openai-compatible", ...settings });
}

export async function saveAndSelectOpenAiProvider(
  database: ExplanationDatabase,
  settings: AiSettings
): Promise<void> {
  await saveAndSelectProvider(database, { provider: "openai-compatible", ...settings });
}

export async function saveCliProvider(
  database: ExplanationDatabase,
  settings: { provider: CliAiProvider; model: string; enabled?: boolean }
): Promise<void> {
  await saveProvider(database, settings);
}

export async function saveAndSelectCliProvider(
  database: ExplanationDatabase,
  settings: { provider: CliAiProvider; model: string }
): Promise<void> {
  await saveAndSelectProvider(database, settings);
}

export async function disableAiProvider(
  database: ExplanationDatabase,
  provider: AiProvider
): Promise<void> {
  await disableProvider(database, provider);
}

export async function removeAiProvider(
  database: ExplanationDatabase,
  provider: AiProvider
): Promise<void> {
  await removeProvider(database, provider);
}

export async function selectModelReference(
  database: ExplanationDatabase,
  reference: string
): Promise<void> {
  await selectActiveModel(database, reference);
}

// Backward-compatibility wrappers
export async function saveOpenAiCompatibleSettings(database: ExplanationDatabase, settings: AiSettings & { enabled?: boolean }): Promise<void> {
  await saveProvider(database, { provider: "openai-compatible", ...settings });
}
export async function saveCliProviderSettings(database: ExplanationDatabase, settings: { provider: CliAiProvider; model: string; enabled?: boolean }): Promise<void> {
  await saveProvider(database, settings);
}
export async function setCliProviderEnabled(database: ExplanationDatabase, provider: CliAiProvider, enabled: boolean): Promise<void> {
  await setProviderEnabled(database, provider, enabled);
}
export async function selectQualifiedModel(database: ExplanationDatabase, reference: string): Promise<void> {
  await selectActiveModel(database, reference);
}
export async function removeOpenAiCompatibleCredentials(database: ExplanationDatabase): Promise<void> {
  await removeProvider(database, "openai-compatible");
}
