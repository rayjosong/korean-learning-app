import type { ExplanationDatabase } from "./index.ts";

export const assistanceLevels = ["full", "guided", "immersion"] as const;
export type AssistanceLevel = (typeof assistanceLevels)[number];

export interface AssistanceSettingsRecord {
  id: "default";
  level: AssistanceLevel;
  updatedAt: string;
}

export function isAssistanceLevel(value: unknown): value is AssistanceLevel {
  return typeof value === "string" && assistanceLevels.includes(value as AssistanceLevel);
}

export async function getAssistanceSettings(
  database: ExplanationDatabase
): Promise<AssistanceSettingsRecord | undefined> {
  const record = await database.assistanceSettings.get("default");
  return record && isAssistanceLevel(record.level) ? record : undefined;
}

export async function putAssistanceSettings(
  database: ExplanationDatabase,
  settings: Omit<AssistanceSettingsRecord, "id" | "updatedAt"> &
    Partial<Pick<AssistanceSettingsRecord, "updatedAt">>
): Promise<void> {
  if (!isAssistanceLevel(settings.level)) {
    throw new Error("Assistance level must be full, guided, or immersion.");
  }

  await database.assistanceSettings.put({
    id: "default",
    level: settings.level,
    updatedAt: settings.updatedAt ?? new Date().toISOString()
  });
}

export async function clearAssistanceSettings(database: ExplanationDatabase): Promise<void> {
  await database.assistanceSettings.delete("default");
}
