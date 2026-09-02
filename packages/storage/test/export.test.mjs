import test from "node:test";
import assert from "node:assert/strict";
import "fake-indexeddb/auto";
import { ExplanationDatabase } from "../src/index.ts";
import { exportLearnerData } from "../src/export.ts";
import { putAiProviderSettings } from "../src/ai-settings.ts";

test("exports learner data while excluding provider credentials", async () => {
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

  await putAiProviderSettings(db, { provider: "openai-compatible", apiKey: "secret-key", model: "gpt-4o" });

  const exported = await exportLearnerData(db);

  assert.equal(exported.version, 1);
  assert.equal(exported.learningItems.length, 1);
  assert.equal(exported.learningItems[0].id, "item1");
  assert.equal(exported.explanations.length, 1);

  // Ensure aiProviderSettings is not in the exported data
  assert.ok(!("aiProviderSettings" in exported));
  assert.ok(!JSON.stringify(exported).includes("secret-key"));

  assert.ok(typeof exported.exportedAt === "string");
  assert.ok(Array.isArray(exported.learningContexts));
  assert.ok(Array.isArray(exported.reviewRecords));
  assert.ok(Array.isArray(exported.studiedContent));
  assert.ok(Array.isArray(exported.contentProgressSnapshots));
  assert.ok(Array.isArray(exported.contentResume));
  assert.ok(Array.isArray(exported.wordExplanations));

  db.close();
});
