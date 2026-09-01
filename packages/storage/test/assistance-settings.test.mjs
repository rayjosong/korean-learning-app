import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";
import Dexie from "dexie";

import {
  clearAssistanceSettings,
  getAssistanceSettings,
  isAssistanceLevel,
  putAssistanceSettings
} from "../src/assistance-settings.ts";
import { ExplanationDatabase } from "../src/index.ts";
import { getAiProviderSettings } from "../src/ai-settings.ts";

test("assistance settings default to absent, round-trip, and clear independently", async () => {
  const database = new ExplanationDatabase("assistance-settings-round-trip");
  assert.equal(await getAssistanceSettings(database), undefined);

  await putAssistanceSettings(database, { level: "full" });
  assert.equal((await getAssistanceSettings(database))?.level, "full");

  await putAssistanceSettings(database, { level: "immersion" });
  assert.equal((await getAssistanceSettings(database))?.level, "immersion");

  await clearAssistanceSettings(database);
  assert.equal(await getAssistanceSettings(database), undefined);
  await database.delete();
});

test("assistance settings validate runtime values", async () => {
  const database = new ExplanationDatabase("assistance-settings-validation");
  assert.equal(isAssistanceLevel("guided"), true);
  assert.equal(isAssistanceLevel("other"), false);
  await assert.rejects(putAssistanceSettings(database, { level: "other" }), /Assistance level/);
  await database.delete();
});

test("version 8 upgrade preserves provider and unrelated data", async () => {
  const name = "assistance-settings-upgrade";
  const legacy = new Dexie(name);
  legacy.version(8).stores({
    explanations: "key, createdAt",
    wordExplanations: "key",
    learningItems: "id, text, lastSeenAt",
    learningContexts: "id, itemId, createdAt",
    reviewRecords: "id, itemId, reviewedAt, mode",
    studiedContent: "videoId, firstStudiedAt, lastStudiedAt",
    contentProgressSnapshots: "id, videoId, capturedAt",
    aiProviderSettings: "id"
  });
  await legacy.open();
  await legacy.table("aiProviderSettings").put({
    id: "default",
    provider: "openai-compatible",
    apiKey: "key",
    model: "model",
    updatedAt: "2026-01-01T00:00:00.000Z"
  });
  await legacy.table("explanations").put({
    key: "v1:test",
    sentence: "test",
    promptVersion: "v1",
    explanation: {},
    createdAt: "2026-01-01T00:00:00.000Z"
  });
  legacy.close();

  const database = new ExplanationDatabase(name);
  await database.open();
  const settings = await getAiProviderSettings(database);
  assert.equal(settings?.profiles.openai?.apiKey, "key");
  assert.equal((await database.explanations.get("v1:test"))?.sentence, "test");
  assert.equal(await getAssistanceSettings(database), undefined);

  await putAssistanceSettings(database, { level: "full" });
  assert.equal((await getAssistanceSettings(database))?.level, "full");
  assert.equal((await getAiProviderSettings(database))?.profiles.openai?.defaultModel, "model");
  await database.delete();
});
