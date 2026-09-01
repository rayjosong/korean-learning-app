import test from "node:test";
import assert from "node:assert/strict";
import "fake-indexeddb/auto";
import { ExplanationDatabase } from "../src/index.ts";
import { exportLearnerData } from "../src/export.ts";
import { saveProviderProfile, setTaskRoute } from "../src/ai-settings.ts";

test("exports learner data while excluding provider credentials and task routes", async () => {
  const db = new ExplanationDatabase("test-export-db");
  await db.delete();
  await db.open();

  await db.learningItems.put({ id: "item1", text: "word", state: "learning" });
  await db.explanations.put({
    key: "test-key",
    sentence: "안녕하세요",
    promptVersion: 1,
    createdAt: new Date().toISOString(),
    explanation: { naturalMeaning: "Hello", breakdown: [], grammar: [] },
  });

  await saveProviderProfile(db, {
    provider: "openai",
    apiKey: "secret-key-openai",
    defaultModel: "gpt-4o",
    baseUrl: "https://secret-base-url.example.com"
  });
  await saveProviderProfile(db, {
    provider: "gemini",
    apiKey: "secret-key-gemini",
    defaultModel: "gemini-1.5-pro"
  });
  await setTaskRoute(db, "sentence", { provider: "openai", model: "gpt-4o" });
  await setTaskRoute(db, "word", { provider: "gemini", model: "gemini-1.5-pro" });

  const exported = await exportLearnerData(db);

  assert.equal(exported.version, 1);
  assert.equal(exported.learningItems.length, 1);
  assert.equal(exported.learningItems[0].id, "item1");
  assert.equal(exported.explanations.length, 1);

  // Ensure aiProviderSettings is not in the exported data
  assert.ok(!("aiProviderSettings" in exported));
  assert.ok(!("profiles" in exported));
  assert.ok(!("routes" in exported));
  const serialized = JSON.stringify(exported);
  assert.ok(!serialized.includes("secret-key-openai"));
  assert.ok(!serialized.includes("secret-key-gemini"));
  assert.ok(!serialized.includes("secret-base-url.example.com"));

  assert.ok(typeof exported.exportedAt === "string");
  assert.ok(Array.isArray(exported.learningContexts));
  assert.ok(Array.isArray(exported.reviewRecords));
  assert.ok(Array.isArray(exported.studiedContent));
  assert.ok(Array.isArray(exported.contentProgressSnapshots));
  assert.ok(Array.isArray(exported.contentResume));
  assert.ok(Array.isArray(exported.wordExplanations));

  db.close();
});
