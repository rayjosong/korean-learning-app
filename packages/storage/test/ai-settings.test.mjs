import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";

import {
  clearAiProviderSettings,
  disableProvider,
  getActiveModelSelection,
  getAiProviderSettings,
  getProviderSettings,
  listAiProviderSettings,
  putAiProviderSettings,
  removeProvider,
  saveAndSelectProvider,
  saveProvider,
  saveProviderSettings,
  saveSelectedModelReference,
  selectActiveModel,
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
  // Save an alternative provider and select it so OpenAI is not the active provider during removal
  await saveProvider(database, { provider: "claude_cli", model: "sonnet" });
  await saveProvider(database, settings);
  await selectActiveModel(database, "claude_cli:sonnet");

  await saveProvider(database, { ...settings, apiKey: "new-key", model: "new-model" });
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
  await saveProvider(database, { provider: "claude_cli", model: "sonnet" });
  await saveProvider(database, { provider: "codex_cli", model: "gpt-5-codex", enabled: false });
  assert.equal((await getProviderSettings(database, "claude_cli")).apiKey, undefined);

  // Switch active selection away before disabling claude_cli if it was selected
  await saveAndSelectProvider(database, { provider: "claude_cli", model: "sonnet" });
  await saveProvider(database, { provider: "openai-compatible", apiKey: "sk-key", model: "gpt-4o" });
  await selectActiveModel(database, "openai-compatible:gpt-4o");

  await disableProvider(database, "claude_cli");
  assert.equal((await getProviderSettings(database, "claude_cli")).enabled, false);
});

test("selectActiveModel enforces qualification, selectability, and configuration invariants", async () => {
  const database = new ExplanationDatabase("ai-settings-invariants-test");

  // Cannot select unqualified
  await assert.rejects(
    selectActiveModel(database, "gpt-4o"),
    /qualified/
  );

  // Cannot select Antigravity
  await assert.rejects(
    selectActiveModel(database, "antigravity_cli:agy"),
    /cannot be selected/
  );

  // Cannot select unconfigured provider
  await assert.rejects(
    selectActiveModel(database, "claude_cli:sonnet"),
    /Configure and save/
  );

  // Configure disabled provider -> cannot select
  await saveProvider(database, { provider: "claude_cli", model: "sonnet", enabled: false });
  await assert.rejects(
    selectActiveModel(database, "claude_cli:sonnet"),
    /disabled/
  );

  // Enable and select
  await setProviderEnabled(database, "claude_cli", true);
  await selectActiveModel(database, "claude_cli:sonnet");
  assert.equal(await getActiveModelSelection(database), "claude_cli:sonnet");
});

test("active provider cannot be disabled or removed without selecting a replacement", async () => {
  const database = new ExplanationDatabase("ai-settings-active-protection-test");
  await saveAndSelectProvider(database, { provider: "claude_cli", model: "sonnet" });
  await saveProvider(database, { provider: "codex_cli", model: "gpt-5-codex" });

  assert.equal(await getActiveModelSelection(database), "claude_cli:sonnet");

  // Attempt to disable active provider
  await assert.rejects(
    disableProvider(database, "claude_cli"),
    /active provider cannot be disabled/
  );

  // Attempt to remove active provider
  await assert.rejects(
    removeProvider(database, "claude_cli"),
    /active provider cannot be removed/
  );

  // Select replacement first -> disable and remove now succeed
  await selectActiveModel(database, "codex_cli:gpt-5-codex");
  await disableProvider(database, "claude_cli");
  assert.equal((await getProviderSettings(database, "claude_cli")).enabled, false);

  await removeProvider(database, "claude_cli");
  assert.equal(await getProviderSettings(database, "claude_cli"), undefined);
});

test("saveAndSelectProvider and initial saveProvider establish active selection", async () => {
  const database = new ExplanationDatabase("ai-settings-autoselect-test");

  // First save establishes active model if none existed
  await saveProvider(database, { provider: "openai-compatible", apiKey: "sk-test", model: "gpt-4o-mini" });
  assert.equal(await getActiveModelSelection(database), "openai-compatible:gpt-4o-mini");

  // saveAndSelectProvider changes active selection
  await saveAndSelectProvider(database, { provider: "codex_cli", model: "gpt-5.6-codex" });
  assert.equal(await getActiveModelSelection(database), "codex_cli:gpt-5.6-codex");
});
