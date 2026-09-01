import test from "node:test";
import assert from "node:assert/strict";
import "fake-indexeddb/auto";
import { ExplanationDatabase } from "@korean-learning/storage";
import { putAiProviderSettings } from "@korean-learning/storage/ai-settings";
import { getEffectiveAiSettings } from "./ai-settings.ts";

test("getEffectiveAiSettings returns stored settings if they exist", async () => {
  const db = new ExplanationDatabase("ai-settings-load-test");
  await db.delete();
  await db.open();

  await putAiProviderSettings(db, { provider: "openai-compatible", apiKey: "stored-key", model: "gpt-4o" });

  const settings = await getEffectiveAiSettings(db);
  assert.equal(settings?.apiKey, "stored-key");
  assert.equal(settings?.model, "gpt-4o");

  db.close();
});

test("getEffectiveAiSettings falls back to API defaults if no stored settings", async () => {
  const db = new ExplanationDatabase("ai-settings-fallback-test");
  await db.delete();
  await db.open();

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (url === "/api/ai-defaults") {
      return {
        ok: true,
        json: async () => ({ configured: true })
      };
    }
    return { ok: false };
  };

  try {
    const settings = await getEffectiveAiSettings(db);
    assert.equal(settings?.apiKey, "deployment-default");
    assert.equal(settings?.model, "deployment-default");
    assert.equal(settings?.baseUrl, "/api/ai-proxy");
  } finally {
    globalThis.fetch = originalFetch;
    db.close();
  }
});
