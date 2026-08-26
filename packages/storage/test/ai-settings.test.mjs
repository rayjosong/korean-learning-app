import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";

import {
  clearAiProviderSettings,
  getAiProviderSettings,
  putAiProviderSettings
} from "../src/ai-settings.ts";
import { ExplanationDatabase } from "../src/index.ts";

const settings = {
  provider: "openai-compatible",
  apiKey: "  sk-test-key  ",
  model: "  test-model  ",
  baseUrl: " https://example.test/v1 "
};

test("AI provider settings persist and normalize user input", async () => {
  const name = "ai-settings-persist-test";
  await putAiProviderSettings(new ExplanationDatabase(name), settings);

  const stored = await getAiProviderSettings(new ExplanationDatabase(name));
  assert.deepEqual(stored, {
    id: "default",
    provider: "openai-compatible",
    apiKey: "sk-test-key",
    model: "test-model",
    baseUrl: "https://example.test/v1",
    updatedAt: stored.updatedAt
  });
});

test("AI provider settings can be updated and removed", async () => {
  const database = new ExplanationDatabase("ai-settings-update-test");
  await putAiProviderSettings(database, settings);
  await putAiProviderSettings(database, { ...settings, apiKey: "new-key", model: "new-model" });
  assert.equal((await getAiProviderSettings(database)).apiKey, "new-key");

  await clearAiProviderSettings(database);
  assert.equal(await getAiProviderSettings(database), undefined);
});

test("AI provider settings reject missing credentials", async () => {
  await assert.rejects(
    putAiProviderSettings(new ExplanationDatabase("ai-settings-validation-test"), {
      ...settings,
      apiKey: " "
    }),
    /API key and model are required/
  );
});
