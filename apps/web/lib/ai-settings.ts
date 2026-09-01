import {
  clearAiProviderSettings,
  getAiProviderSettings,
  removeProviderProfile as storageRemoveProviderProfile,
  saveProviderProfile as storageSaveProviderProfile,
  setTaskRoute as storageSetTaskRoute,
  type AiProviderSettingsRecord,
  type ExplanationTask,
  type ProviderId,
  type ProviderProfile,
  type TaskRoute
} from "@korean-learning/storage/ai-settings";
import type { ExplanationDatabase } from "@korean-learning/storage";

export type {
  AiProviderSettingsRecord,
  ExplanationTask,
  ProviderId,
  ProviderProfile,
  TaskRoute,
  ExplanationDatabase
};

export interface ResolvedRoute {
  provider: ProviderId;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface AiSettings {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export const PROVIDER_NAMES: Record<ProviderId, string> = {
  openai: "OpenAI",
  gemini: "Gemini",
  anthropic: "Claude"
};

export const PROVIDER_DEFAULT_MODELS: Record<ProviderId, string> = {
  openai: "gpt-4o-mini",
  gemini: "gemini-1.5-flash",
  anthropic: "claude-3-5-haiku-20241022"
};

export async function loadAiProviderSettingsRecord(
  database: ExplanationDatabase
): Promise<AiProviderSettingsRecord | undefined> {
  return getAiProviderSettings(database);
}

export function resolveTaskRoute(
  record: AiProviderSettingsRecord | undefined,
  task: ExplanationTask
): ResolvedRoute {
  if (!record || !record.profiles) {
    throw new Error(`No AI provider settings configured for ${task} explanations.`);
  }

  const route = record.routes?.[task];
  if (route) {
    const profile = record.profiles[route.provider];
    if (!profile || !profile.apiKey.trim()) {
      throw new Error(
        `The configured provider '${PROVIDER_NAMES[route.provider] ?? route.provider}' for ${task} explanations is not connected.`
      );
    }
    const model = (route.model || profile.defaultModel).trim();
    if (!model) {
      throw new Error(
        `No model configured for ${task} explanations with '${PROVIDER_NAMES[route.provider] ?? route.provider}'.`
      );
    }
    return {
      provider: route.provider,
      apiKey: profile.apiKey,
      model,
      ...(profile.provider === "openai" && profile.baseUrl?.trim() ? { baseUrl: profile.baseUrl.trim() } : {})
    };
  }

  // Fallback: search for first connected profile
  const connectedProviders: ProviderId[] = ["openai", "gemini", "anthropic"];
  for (const providerId of connectedProviders) {
    const profile = record.profiles[providerId];
    if (profile && profile.apiKey.trim() && profile.defaultModel.trim()) {
      return {
        provider: profile.provider,
        apiKey: profile.apiKey,
        model: profile.defaultModel.trim(),
        ...(profile.provider === "openai" && profile.baseUrl?.trim() ? { baseUrl: profile.baseUrl.trim() } : {})
      };
    }
  }

  throw new Error(`No connected AI provider configured for ${task} explanations.`);
}

export async function getResolvedTaskRoute(
  database: ExplanationDatabase,
  task: ExplanationTask
): Promise<ResolvedRoute> {
  const record = await getAiProviderSettings(database);
  return resolveTaskRoute(record, task);
}

export async function saveProfile(
  database: ExplanationDatabase,
  profile: Omit<ProviderProfile, "updatedAt"> & Partial<Pick<ProviderProfile, "updatedAt">>
): Promise<void> {
  await storageSaveProviderProfile(database, profile);
}

export async function removeProfile(
  database: ExplanationDatabase,
  provider: ProviderId
): Promise<void> {
  await storageRemoveProviderProfile(database, provider);
}

export async function saveTaskRoute(
  database: ExplanationDatabase,
  task: ExplanationTask,
  route: TaskRoute
): Promise<void> {
  await storageSetTaskRoute(database, task, route);
}

// Backwards compatibility helpers
export async function loadAiSettings(
  database: ExplanationDatabase
): Promise<AiSettings | undefined> {
  const record = await getAiProviderSettings(database);
  if (!record) return undefined;
  try {
    const resolved = resolveTaskRoute(record, "sentence");
    return {
      apiKey: resolved.apiKey,
      model: resolved.model,
      ...(resolved.baseUrl ? { baseUrl: resolved.baseUrl } : {})
    };
  } catch {
    return undefined;
  }
}

export async function saveAiSettings(
  database: ExplanationDatabase,
  settings: AiSettings
): Promise<void> {
  await storageSaveProviderProfile(database, {
    provider: "openai",
    apiKey: settings.apiKey,
    defaultModel: settings.model,
    ...(settings.baseUrl ? { baseUrl: settings.baseUrl } : {})
  });
  await storageSetTaskRoute(database, "sentence", { provider: "openai", model: settings.model });
  await storageSetTaskRoute(database, "word", { provider: "openai", model: settings.model });
}

export async function removeAiSettings(database: ExplanationDatabase): Promise<void> {
  await clearAiProviderSettings(database);
}
