import type { ExplanationDatabase } from "./index.ts";

export const AI_PROVIDERS = [
  "openai-compatible",
  "claude_cli",
  "codex_cli",
  "antigravity_cli"
] as const;

export type AiProvider = (typeof AI_PROVIDERS)[number];
export type CliAiProvider = Exclude<AiProvider, "openai-compatible">;

export function isAiProvider(value: string): value is AiProvider {
  return (AI_PROVIDERS as readonly string[]).includes(value);
}

export function isSelectableAiProvider(provider: AiProvider): boolean {
  return provider !== "antigravity_cli";
}

export function parseQualifiedModelReference(reference: string): {
  provider: AiProvider;
  model: string;
  reference: string;
} {
  const trimmed = reference.trim();
  const separator = trimmed.indexOf(":");
  if (separator <= 0 || separator !== trimmed.lastIndexOf(":")) {
    throw new Error("Use a qualified provider:model reference.");
  }
  const provider = trimmed.slice(0, separator);
  const model = trimmed.slice(separator + 1).trim();
  if (!isAiProvider(provider)) throw new Error("Unknown AI provider.");
  if (!model) throw new Error("An AI provider model is required.");
  return { provider, model, reference: `${provider}:${model}` };
}

export function formatQualifiedModelReference(provider: AiProvider, model: string): string {
  if (!model.trim()) throw new Error("An AI provider model is required.");
  return `${provider}:${model.trim()}`;
}

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

export interface AiModelSelectionRecord {
  id: "selected";
  reference: string;
  updatedAt: string;
}

export type SaveAiProviderSettings =
  | (Omit<OpenAiCompatibleSettingsRecord, "id" | "updatedAt" | "enabled"> &
      Partial<Pick<OpenAiCompatibleSettingsRecord, "enabled" | "updatedAt">>)
  | (Omit<CliProviderSettingsRecord, "id" | "updatedAt" | "enabled"> &
      Partial<Pick<CliProviderSettingsRecord, "enabled" | "updatedAt">>);

export async function listAiProviderSettings(
  database: ExplanationDatabase
): Promise<AiProviderSettingsRecord[]> {
  return database.aiProviderSettings.toArray();
}

export async function getProviderSettings(
  database: ExplanationDatabase,
  provider: AiProvider
): Promise<AiProviderSettingsRecord | undefined> {
  return database.aiProviderSettings.get(provider);
}

export async function getActiveModelSelection(
  database: ExplanationDatabase
): Promise<string | undefined> {
  const selection = await database.aiModelSelection.get("selected");
  return selection?.reference;
}

export async function selectActiveModel(
  database: ExplanationDatabase,
  reference: string
): Promise<void> {
  const parsed = parseQualifiedModelReference(reference);
  if (!isSelectableAiProvider(parsed.provider)) {
    throw new Error("This AI provider cannot be selected as an active model.");
  }
  const setting = await getProviderSettings(database, parsed.provider);
  if (!setting) {
    throw new Error("Configure and save the AI provider before selecting it.");
  }
  if (!setting.enabled) {
    throw new Error("Cannot select a disabled AI provider.");
  }
  if (setting.provider === "openai-compatible" && !setting.apiKey.trim()) {
    throw new Error("An API key is required to select OpenAI.");
  }
  await database.aiModelSelection.put({
    id: "selected",
    reference: parsed.reference,
    updatedAt: new Date().toISOString()
  });
}

export async function saveProvider(
  database: ExplanationDatabase,
  settings: SaveAiProviderSettings
): Promise<void> {
  const model = settings.model.trim();
  if (!model) throw new Error("An AI provider model is required.");
  if (!isAiProvider(settings.provider)) throw new Error("Unknown AI provider.");

  const enabled = settings.enabled ?? true;
  const updatedAt = settings.updatedAt ?? new Date().toISOString();

  if (settings.provider === "openai-compatible") {
    const apiKey = settings.apiKey.trim();
    if (!apiKey) throw new Error("An OpenAI-compatible provider API key is required.");
    await database.aiProviderSettings.put({
      id: "openai-compatible",
      provider: "openai-compatible",
      enabled,
      model,
      apiKey,
      updatedAt,
      ...(settings.baseUrl?.trim() ? { baseUrl: settings.baseUrl.trim() } : {})
    });
  } else {
    await database.aiProviderSettings.put({
      id: settings.provider,
      provider: settings.provider,
      enabled,
      model,
      updatedAt
    });
  }

  // If no active selection exists or current selection is unconfigured, establish this one
  const currentSelection = await getActiveModelSelection(database);
  if (!currentSelection && enabled && isSelectableAiProvider(settings.provider)) {
    await database.aiModelSelection.put({
      id: "selected",
      reference: formatQualifiedModelReference(settings.provider, model),
      updatedAt
    });
  }
}

export async function saveAndSelectProvider(
  database: ExplanationDatabase,
  settings: SaveAiProviderSettings
): Promise<void> {
  if (!isSelectableAiProvider(settings.provider)) {
    throw new Error("This AI provider cannot be selected as an active model.");
  }
  await saveProvider(database, { ...settings, enabled: true });
  await selectActiveModel(database, formatQualifiedModelReference(settings.provider, settings.model.trim()));
}

export async function disableProvider(
  database: ExplanationDatabase,
  provider: AiProvider
): Promise<void> {
  const current = await getProviderSettings(database, provider);
  if (!current) throw new Error("Save the AI provider before changing its enabled state.");

  const active = await getActiveModelSelection(database);
  if (active) {
    try {
      const parsed = parseQualifiedModelReference(active);
      if (parsed.provider === provider) {
        throw new Error("The active provider cannot be disabled without first selecting a replacement.");
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("active provider cannot be disabled")) {
        throw err;
      }
    }
  }

  await database.aiProviderSettings.put({
    ...current,
    enabled: false,
    updatedAt: new Date().toISOString()
  });
}

export async function removeProvider(
  database: ExplanationDatabase,
  provider: AiProvider
): Promise<void> {
  const active = await getActiveModelSelection(database);
  if (active) {
    try {
      const parsed = parseQualifiedModelReference(active);
      if (parsed.provider === provider) {
        throw new Error("The active provider cannot be removed without first selecting a replacement.");
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("active provider cannot be removed")) {
        throw err;
      }
    }
  }
  await database.aiProviderSettings.delete(provider);
}

// Backward-compatibility wrappers
export async function saveProviderSettings(
  database: ExplanationDatabase,
  settings: SaveAiProviderSettings
): Promise<void> {
  return saveProvider(database, settings);
}

export async function setProviderEnabled(
  database: ExplanationDatabase,
  provider: AiProvider,
  enabled: boolean
): Promise<void> {
  if (enabled) {
    const current = await getProviderSettings(database, provider);
    if (!current) throw new Error("Save the AI provider before changing its enabled state.");
    await database.aiProviderSettings.put({
      ...current,
      enabled: true,
      updatedAt: new Date().toISOString()
    });
  } else {
    await disableProvider(database, provider);
  }
}

export async function removeApiProviderCredentials(
  database: ExplanationDatabase
): Promise<void> {
  return removeProvider(database, "openai-compatible");
}

export async function getSelectedModelReference(
  database: ExplanationDatabase
): Promise<string | undefined> {
  return getActiveModelSelection(database);
}

export async function saveSelectedModelReference(
  database: ExplanationDatabase,
  reference: string
): Promise<void> {
  return selectActiveModel(database, reference);
}

export async function getAiProviderSettings(
  database: ExplanationDatabase
): Promise<OpenAiCompatibleSettingsRecord | undefined> {
  const record = await getProviderSettings(database, "openai-compatible");
  return record?.provider === "openai-compatible" ? record : undefined;
}

export async function putAiProviderSettings(
  database: ExplanationDatabase,
  settings: Omit<OpenAiCompatibleSettingsRecord, "id" | "updatedAt" | "enabled"> &
    Partial<Pick<OpenAiCompatibleSettingsRecord, "enabled" | "updatedAt">>
): Promise<void> {
  await saveProvider(database, { ...settings, provider: "openai-compatible" });
}

export async function clearAiProviderSettings(
  database: ExplanationDatabase
): Promise<void> {
  await removeApiProviderCredentials(database);
}
