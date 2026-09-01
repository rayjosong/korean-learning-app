import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";
import Dexie from "dexie";

import {
  clearAiProviderSettings,
  getAiProviderSettings,
  removeProviderProfile,
  removeTaskRoute,
  saveProviderProfile,
  setTaskRoute
} from "../src/ai-settings.ts";
import { ExplanationDatabase } from "../src/index.ts";

test("OpenAI, Gemini, and Anthropic profiles can be saved independently and normalized", async () => {
  const name = "ai-profiles-test";
  const database = new ExplanationDatabase(name);

  await saveProviderProfile(database, {
    provider: "openai",
    apiKey: "  sk-openai-key  ",
    defaultModel: "  gpt-4o  ",
    baseUrl: "  https://custom.openai.com/v1  "
  });

  await saveProviderProfile(database, {
    provider: "gemini",
    apiKey: "  gemini-key  ",
    defaultModel: "  gemini-1.5-pro  ",
    baseUrl: "  https://ignored.com  " // should be omitted for non-openai
  });

  await saveProviderProfile(database, {
    provider: "anthropic",
    apiKey: "  anthropic-key  ",
    defaultModel: "  claude-3-5-sonnet  "
  });

  const stored = await getAiProviderSettings(new ExplanationDatabase(name));
  assert.ok(stored);
  assert.equal(stored.profiles.openai?.provider, "openai");
  assert.equal(stored.profiles.openai?.apiKey, "sk-openai-key");
  assert.equal(stored.profiles.openai?.defaultModel, "gpt-4o");
  assert.equal(stored.profiles.openai?.baseUrl, "https://custom.openai.com/v1");

  assert.equal(stored.profiles.gemini?.provider, "gemini");
  assert.equal(stored.profiles.gemini?.apiKey, "gemini-key");
  assert.equal(stored.profiles.gemini?.defaultModel, "gemini-1.5-pro");
  assert.equal(stored.profiles.gemini?.baseUrl, undefined);

  assert.equal(stored.profiles.anthropic?.provider, "anthropic");
  assert.equal(stored.profiles.anthropic?.apiKey, "anthropic-key");
  assert.equal(stored.profiles.anthropic?.defaultModel, "claude-3-5-sonnet");
});

test("Sentence and word task routes persist independently", async () => {
  const database = new ExplanationDatabase("ai-routes-test");

  await saveProviderProfile(database, {
    provider: "openai",
    apiKey: "sk-test",
    defaultModel: "gpt-4o"
  });

  await saveProviderProfile(database, {
    provider: "anthropic",
    apiKey: "anth-test",
    defaultModel: "claude-3-5-sonnet"
  });

  await setTaskRoute(database, "sentence", { provider: "openai", model: " gpt-4o-mini " });
  await setTaskRoute(database, "word", { provider: "anthropic", model: " claude-3-5-haiku " });

  const stored = await getAiProviderSettings(database);
  assert.deepEqual(stored?.routes.sentence, {
    provider: "openai",
    model: "gpt-4o-mini"
  });
  assert.deepEqual(stored?.routes.word, {
    provider: "anthropic",
    model: "claude-3-5-haiku"
  });

  await removeTaskRoute(database, "word");
  const updated = await getAiProviderSettings(database);
  assert.ok(updated?.routes.sentence);
  assert.equal(updated?.routes.word, undefined);
});

test("Removing a provider used by a route fails with a controlled error", async () => {
  const database = new ExplanationDatabase("ai-delete-guard-test");

  await saveProviderProfile(database, {
    provider: "gemini",
    apiKey: "gemini-key",
    defaultModel: "gemini-1.5-pro"
  });

  await setTaskRoute(database, "sentence", { provider: "gemini", model: "gemini-1.5-pro" });

  await assert.rejects(
    removeProviderProfile(database, "gemini"),
    /Cannot delete profile for provider 'gemini' because it is currently selected by a task route/
  );

  // Removing route allows deleting provider
  await removeTaskRoute(database, "sentence");
  await removeProviderProfile(database, "gemini");

  const stored = await getAiProviderSettings(database);
  assert.equal(stored?.profiles.gemini, undefined);
});

test("Provider profile and task route helpers reject blank fields", async () => {
  const database = new ExplanationDatabase("ai-validation-test");

  await assert.rejects(
    saveProviderProfile(database, {
      provider: "openai",
      apiKey: " ",
      defaultModel: "gpt-4o"
    }),
    /API key and default model are required/
  );

  await assert.rejects(
    saveProviderProfile(database, {
      provider: "openai",
      apiKey: "sk-test",
      defaultModel: " "
    }),
    /API key and default model are required/
  );

  await assert.rejects(
    setTaskRoute(database, "sentence", { provider: "openai", model: " " }),
    /task route model is required/
  );
});

test("clearAiProviderSettings clears all profiles and routes", async () => {
  const database = new ExplanationDatabase("ai-clear-test");

  await saveProviderProfile(database, { provider: "openai", apiKey: "key", defaultModel: "model" });
  await setTaskRoute(database, "sentence", { provider: "openai", model: "model" });

  await clearAiProviderSettings(database);
  assert.equal(await getAiProviderSettings(database), undefined);
});

test("v11 to v12 migration converts legacy openai-compatible settings", async () => {
  const name = "ai-v11-migration-test";

  // Build v11 database schema manually
  class LegacyDatabase extends Dexie {
    constructor() {
      super(name);
      this.version(11).stores({
        explanations: "key, createdAt",
        wordExplanations: "key",
        learningItems: "id, text, lastSeenAt",
        learningContexts: "id, itemId, createdAt",
        reviewRecords: "id, itemId, reviewedAt, mode",
        studiedContent: "videoId, firstStudiedAt, lastStudiedAt",
        contentProgressSnapshots: "id, videoId, capturedAt",
        aiProviderSettings: "id",
        assistanceSettings: "id",
        contentResume: "videoId, updatedAt",
        recommendationDismissals: "fingerprint, dismissedUntil"
      });
    }
  }

  const legacy = new LegacyDatabase();
  await legacy.open();
  await legacy.table("aiProviderSettings").put({
    id: "default",
    provider: "openai-compatible",
    apiKey: "legacy-sk-key",
    model: "legacy-gpt-4",
    baseUrl: "https://legacy.example.com/v1",
    updatedAt: "2025-01-01T00:00:00.000Z"
  });
  legacy.close();

  // Open with new ExplanationDatabase (version 12)
  const db = new ExplanationDatabase(name);
  const stored = await getAiProviderSettings(db);

  assert.ok(stored);
  assert.equal(stored.profiles.openai?.provider, "openai");
  assert.equal(stored.profiles.openai?.apiKey, "legacy-sk-key");
  assert.equal(stored.profiles.openai?.defaultModel, "legacy-gpt-4");
  assert.equal(stored.profiles.openai?.baseUrl, "https://legacy.example.com/v1");

  assert.deepEqual(stored.routes.sentence, { provider: "openai", model: "legacy-gpt-4" });
  assert.deepEqual(stored.routes.word, { provider: "openai", model: "legacy-gpt-4" });

  db.close();
});
