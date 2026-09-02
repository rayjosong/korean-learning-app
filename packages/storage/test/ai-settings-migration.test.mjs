import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";
import Dexie from "dexie";

import { ExplanationDatabase } from "../src/index.ts";

test("version 11 OpenAI settings migrate to the provider-specific record", async () => {
  const name = "ai-settings-v11-migration";
  const legacy = new Dexie(name);
  legacy.version(11).stores({ aiProviderSettings: "id" });
  await legacy.open();
  await legacy.table("aiProviderSettings").put({
    id: "default", provider: "openai-compatible", apiKey: "preserved-key", model: "preserved-model",
    baseUrl: "https://example.test/v1", updatedAt: "2026-09-02T00:00:00.000Z"
  });
  legacy.close();

  const database = new ExplanationDatabase(name);
  await database.open();
  assert.deepEqual(await database.aiProviderSettings.get("openai-compatible"), {
    id: "openai-compatible", provider: "openai-compatible", enabled: true,
    apiKey: "preserved-key", model: "preserved-model", baseUrl: "https://example.test/v1",
    updatedAt: "2026-09-02T00:00:00.000Z"
  });
  assert.equal(await database.aiProviderSettings.get("default"), undefined);
  await database.delete();
});
