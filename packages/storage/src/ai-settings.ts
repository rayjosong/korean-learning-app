import type { ExplanationDatabase } from "./index.ts";

export type AiProvider = "openai-compatible";

export interface AiProviderSettingsRecord {
  id: "default";
  provider: AiProvider;
  model: string;
  baseUrl?: string;
  apiKey: string;
  updatedAt: string;
}

export async function getAiProviderSettings(
  database: ExplanationDatabase
): Promise<AiProviderSettingsRecord | undefined> {
  return database.aiProviderSettings.get("default");
}

export async function putAiProviderSettings(
  database: ExplanationDatabase,
  settings: Omit<AiProviderSettingsRecord, "id" | "updatedAt"> &
    Partial<Pick<AiProviderSettingsRecord, "updatedAt">>
): Promise<void> {
  const apiKey = settings.apiKey.trim();
  const model = settings.model.trim();
  if (!apiKey || !model) throw new Error("An AI provider API key and model are required.");

  await database.aiProviderSettings.put({
    id: "default",
    provider: settings.provider,
    model,
    ...(settings.baseUrl?.trim() ? { baseUrl: settings.baseUrl.trim() } : {}),
    apiKey,
    updatedAt: settings.updatedAt ?? new Date().toISOString()
  });
}

export async function clearAiProviderSettings(database: ExplanationDatabase): Promise<void> {
  await database.aiProviderSettings.delete("default");
}
