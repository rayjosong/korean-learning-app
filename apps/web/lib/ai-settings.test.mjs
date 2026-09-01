import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";

import { ExplanationDatabase } from "@korean-learning/storage";
import {
  getResolvedTaskRoute,
  loadAiProviderSettingsRecord,
  resolveTaskRoute,
  removeProfile,
  saveProfile,
  saveTaskRoute,
  loadAiSettings,
  saveAiSettings,
  removeAiSettings
} from "./ai-settings.ts";

test("resolveTaskRoute returns task route credentials and model", () => {
  const record = {
    id: "default",
    profiles: {
      openai: {
        provider: "openai",
        apiKey: "sk-openai",
        defaultModel: "gpt-4o-mini",
        updatedAt: "2026-01-01T00:00:00.000Z"
      },
      gemini: {
        provider: "gemini",
        apiKey: "AIza-gemini",
        defaultModel: "gemini-1.5-flash",
        updatedAt: "2026-01-01T00:00:00.000Z"
      }
    },
    routes: {
      sentence: { provider: "openai", model: "gpt-4o" },
      word: { provider: "gemini", model: "gemini-1.5-flash" }
    },
    updatedAt: "2026-01-01T00:00:00.000Z"
  };

  const sentenceRoute = resolveTaskRoute(record, "sentence");
  assert.deepEqual(sentenceRoute, {
    provider: "openai",
    apiKey: "sk-openai",
    model: "gpt-4o"
  });

  const wordRoute = resolveTaskRoute(record, "word");
  assert.deepEqual(wordRoute, {
    provider: "gemini",
    apiKey: "AIza-gemini",
    model: "gemini-1.5-flash"
  });
});

test("resolveTaskRoute throws clear error when route is unconfigured or provider disconnected", () => {
  assert.throws(
    () => resolveTaskRoute(undefined, "sentence"),
    /No AI provider settings configured/
  );

  const recordNoKey = {
    id: "default",
    profiles: {
      openai: {
        provider: "openai",
        apiKey: "",
        defaultModel: "gpt-4o-mini",
        updatedAt: "2026-01-01T00:00:00.000Z"
      }
    },
    routes: {
      sentence: { provider: "openai", model: "gpt-4o-mini" }
    },
    updatedAt: "2026-01-01T00:00:00.000Z"
  };

  assert.throws(
    () => resolveTaskRoute(recordNoKey, "sentence"),
    /is not connected/
  );
});

test("profile save, task route setting, and removal guard work with ExplanationDatabase", async () => {
  const db = new ExplanationDatabase("ai-settings-test-db");
  await saveProfile(db, {
    provider: "openai",
    apiKey: "sk-key",
    defaultModel: "gpt-4o-mini"
  });
  await saveProfile(db, {
    provider: "anthropic",
    apiKey: "sk-ant-key",
    defaultModel: "claude-3-5-haiku-20241022"
  });
  await saveTaskRoute(db, "sentence", { provider: "openai", model: "gpt-4o-mini" });
  await saveTaskRoute(db, "word", { provider: "anthropic", model: "claude-3-5-haiku-20241022" });

  const record = await loadAiProviderSettingsRecord(db);
  assert.ok(record);
  assert.ok(record.profiles.openai);
  assert.ok(record.profiles.anthropic);

  const route = await getResolvedTaskRoute(db, "sentence");
  assert.equal(route.provider, "openai");
  assert.equal(route.apiKey, "sk-key");

  // Removal guard: removing OpenAI should fail because sentence route uses it
  await assert.rejects(
    () => removeProfile(db, "openai"),
    /currently selected by a task route/
  );
});
