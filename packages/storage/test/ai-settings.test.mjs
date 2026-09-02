import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";

import {
  clearAiProviderSettings,
  getAiProviderSettings,
  getProviderSettings,
  putAiProviderSettings,
  saveProviderSettings,
  saveSelectedModelReference,
  setProviderEnabled
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
    id: "openai-compatible",
    provider: "openai-compatible",
    enabled: true,
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
    /API key is required/
  );
});

test("CLI settings have no API key and support qualified selection", async () => {
  const database = new ExplanationDatabase("ai-settings-cli-test");
  await saveProviderSettings(database, { provider: "claude_cli", model: "sonnet" });
  await saveProviderSettings(database, { provider: "codex_cli", model: "gpt-5-codex", enabled: false });
  assert.equal((await getProviderSettings(database, "claude_cli")).apiKey, undefined);
  await setProviderEnabled(database, "claude_cli", false);
  assert.equal((await getProviderSettings(database, "claude_cli")).enabled, false);
  await saveSelectedModelReference(database, "codex_cli:gpt-5-codex");
  assert.equal((await database.aiModelSelection.get("selected")).reference, "codex_cli:gpt-5-codex");
});
