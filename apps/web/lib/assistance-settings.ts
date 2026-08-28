import type { AssistanceLevel } from "@korean-learning/storage/assistance-settings";
import {
  getAssistanceSettings,
  putAssistanceSettings,
  type ExplanationDatabase
} from "@korean-learning/storage";

export async function loadAssistanceLevel(database: ExplanationDatabase): Promise<AssistanceLevel> {
  return (await getAssistanceSettings(database))?.level ?? "guided";
}

export async function saveAssistanceLevel(
  database: ExplanationDatabase,
  level: AssistanceLevel
): Promise<void> {
  await putAssistanceSettings(database, { level });
}
