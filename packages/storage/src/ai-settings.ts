import type { ExplanationDatabase } from "./index.ts";

export type ProviderId = "openai" | "gemini" | "anthropic";
export type ExplanationTask = "sentence" | "word";

export interface ProviderProfile {
  provider: ProviderId;
  apiKey: string;
  defaultModel: string;
  baseUrl?: string; // OpenAI only; preserves existing compatible endpoints
  updatedAt: string;
}

export interface TaskRoute {
  provider: ProviderId;
  model: string;
}

export interface AiProviderSettingsRecord {
  id: "default";
  profiles: Partial<Record<ProviderId, ProviderProfile>>;
  routes: Partial<Record<ExplanationTask, TaskRoute>>;
  updatedAt: string;
}

export async function getAiProviderSettings(
  database: ExplanationDatabase
): Promise<AiProviderSettingsRecord | undefined> {
  return database.aiProviderSettings.get("default");
}

export async function saveProviderProfile(
  database: ExplanationDatabase,
  input: Omit<ProviderProfile, "updatedAt"> & Partial<Pick<ProviderProfile, "updatedAt">>
): Promise<void> {
  const apiKey = input.apiKey.trim();
  const defaultModel = input.defaultModel.trim();
  if (!apiKey || !defaultModel) {
    throw new Error("An AI provider API key and default model are required.");
  }

  const existing = (await database.aiProviderSettings.get("default")) ?? {
    id: "default",
    profiles: {},
    routes: {},
    updatedAt: new Date().toISOString()
  };

  const profile: ProviderProfile = {
    provider: input.provider,
    apiKey,
    defaultModel,
    ...(input.provider === "openai" && input.baseUrl?.trim() ? { baseUrl: input.baseUrl.trim() } : {}),
    updatedAt: input.updatedAt ?? new Date().toISOString()
  };

  existing.profiles = {
    ...existing.profiles,
    [input.provider]: profile
  };
  existing.updatedAt = profile.updatedAt;

  await database.aiProviderSettings.put(existing);
}

export async function removeProviderProfile(
  database: ExplanationDatabase,
  provider: ProviderId
): Promise<void> {
  const existing = await database.aiProviderSettings.get("default");
  if (!existing) return;

  const isSelectedByRoute = Object.values(existing.routes ?? {}).some(
    (route) => route?.provider === provider
  );

  if (isSelectedByRoute) {
    throw new Error(
      `Cannot delete profile for provider '${provider}' because it is currently selected by a task route.`
    );
  }

  const updatedProfiles = { ...existing.profiles };
  delete updatedProfiles[provider];

  existing.profiles = updatedProfiles;
  existing.updatedAt = new Date().toISOString();

  await database.aiProviderSettings.put(existing);
}

export async function setTaskRoute(
  database: ExplanationDatabase,
  task: ExplanationTask,
  route: TaskRoute
): Promise<void> {
  const model = route.model.trim();
  if (!model) {
    throw new Error("A task route model is required.");
  }

  const existing = (await database.aiProviderSettings.get("default")) ?? {
    id: "default",
    profiles: {},
    routes: {},
    updatedAt: new Date().toISOString()
  };

  const updatedAt = new Date().toISOString();
  existing.routes = {
    ...existing.routes,
    [task]: {
      provider: route.provider,
      model
    }
  };
  existing.updatedAt = updatedAt;

  await database.aiProviderSettings.put(existing);
}

export async function removeTaskRoute(
  database: ExplanationDatabase,
  task: ExplanationTask
): Promise<void> {
  const existing = await database.aiProviderSettings.get("default");
  if (!existing) return;

  const updatedRoutes = { ...existing.routes };
  delete updatedRoutes[task];

  existing.routes = updatedRoutes;
  existing.updatedAt = new Date().toISOString();

  await database.aiProviderSettings.put(existing);
}

export async function clearAiProviderSettings(database: ExplanationDatabase): Promise<void> {
  await database.aiProviderSettings.delete("default");
}
