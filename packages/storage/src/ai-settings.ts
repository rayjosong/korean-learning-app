import type { ExplanationDatabase } from "./index.ts";

export type AiProvider = "openai-compatible" | "claude_cli" | "codex_cli" | "antigravity_cli";
export type CliAiProvider = Exclude<AiProvider, "openai-compatible">;

export interface OpenAiCompatibleSettingsRecord {
  id: "openai-compatible";
  provider: "openai-compatible";
  enabled: boolean;
  model: string;
  baseUrl?: string;
  apiKey: string;
  updatedAt: string;
}

export interface CliProviderSettingsRecord {
  id: CliAiProvider;
  provider: CliAiProvider;
  enabled: boolean;
  model: string;
  updatedAt: string;
}

export type AiProviderSettingsRecord = OpenAiCompatibleSettingsRecord | CliProviderSettingsRecord;

export interface AiModelSelectionRecord { id: "selected"; reference: string; updatedAt: string; }

export type SaveAiProviderSettings =
  | (Omit<OpenAiCompatibleSettingsRecord, "id" | "updatedAt" | "enabled"> & Partial<Pick<OpenAiCompatibleSettingsRecord, "enabled" | "updatedAt">>)
  | (Omit<CliProviderSettingsRecord, "id" | "updatedAt" | "enabled"> & Partial<Pick<CliProviderSettingsRecord, "enabled" | "updatedAt">>);

export async function listAiProviderSettings(database: ExplanationDatabase): Promise<AiProviderSettingsRecord[]> {
  return database.aiProviderSettings.toArray();
}

export async function getProviderSettings(database: ExplanationDatabase, provider: AiProvider): Promise<AiProviderSettingsRecord | undefined> {
  return database.aiProviderSettings.get(provider);
}

export async function saveProviderSettings(database: ExplanationDatabase, settings: SaveAiProviderSettings): Promise<void> {
  const model = settings.model.trim();
  if (!model) throw new Error("An AI provider model is required.");
  const enabled = settings.enabled ?? true;
  const updatedAt = settings.updatedAt ?? new Date().toISOString();
  if (settings.provider === "openai-compatible") {
    const apiKey = settings.apiKey.trim();
    if (!apiKey) throw new Error("An OpenAI-compatible provider API key is required.");
    await database.aiProviderSettings.put({ id: "openai-compatible", provider: "openai-compatible", enabled, model, apiKey, updatedAt, ...(settings.baseUrl?.trim() ? { baseUrl: settings.baseUrl.trim() } : {}) });
    return;
  }
  await database.aiProviderSettings.put({ id: settings.provider, provider: settings.provider, enabled, model, updatedAt });
}

export async function setProviderEnabled(database: ExplanationDatabase, provider: AiProvider, enabled: boolean): Promise<void> {
  const current = await getProviderSettings(database, provider);
  if (!current) throw new Error("Save the AI provider before changing its enabled state.");
  await database.aiProviderSettings.put({ ...current, enabled, updatedAt: new Date().toISOString() });
}

export async function removeApiProviderCredentials(database: ExplanationDatabase): Promise<void> {
  await database.aiProviderSettings.delete("openai-compatible");
}

export async function getSelectedModelReference(database: ExplanationDatabase): Promise<string | undefined> {
  return (await database.aiModelSelection.get("selected"))?.reference;
}

export async function saveSelectedModelReference(database: ExplanationDatabase, reference: string): Promise<void> {
  if (!isQualifiedModelReference(reference)) throw new Error("Choose a qualified AI provider and model.");
  await database.aiModelSelection.put({ id: "selected", reference, updatedAt: new Date().toISOString() });
}

/** Compatibility helpers for the existing OpenAI-compatible settings surface. */
export async function getAiProviderSettings(database: ExplanationDatabase): Promise<OpenAiCompatibleSettingsRecord | undefined> {
  const record = await getProviderSettings(database, "openai-compatible");
  return record?.provider === "openai-compatible" ? record : undefined;
}

export async function putAiProviderSettings(database: ExplanationDatabase, settings: Omit<OpenAiCompatibleSettingsRecord, "id" | "updatedAt" | "enabled"> & Partial<Pick<OpenAiCompatibleSettingsRecord, "enabled" | "updatedAt">>): Promise<void> {
  await saveProviderSettings(database, settings);
}

export async function clearAiProviderSettings(database: ExplanationDatabase): Promise<void> { await removeApiProviderCredentials(database); }

function isQualifiedModelReference(reference: string): boolean {
  const separator = reference.indexOf(":");
  return separator > 0 && separator === reference.lastIndexOf(":") && ["openai-compatible", "claude_cli", "codex_cli", "antigravity_cli"].includes(reference.slice(0, separator)) && Boolean(reference.slice(separator + 1).trim());
}
