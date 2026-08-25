import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";

import {
  clearExplanationCache,
  explanationCacheKey,
  ExplanationDatabase,
  getCachedExplanation,
  putCachedExplanation
} from "../src/index.ts";

const explanation = {
  sentence: "안녕하세요.",
  naturalMeaning: "Hello.",
  breakdown: [{ text: "안녕하세요", meaning: "hello" }],
  grammar: []
};

function record(overrides = {}) {
  return {
    key: explanationCacheKey("1", "안녕하세요."),
    sentence: "안녕하세요.",
    promptVersion: "1",
    explanation,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

test("cache keys include the prompt version", () => {
  assert.equal(explanationCacheKey("1", "안녕하세요."), "1:안녕하세요.");
  assert.equal(explanationCacheKey("1", "  안녕하세요.  "), "1:안녕하세요.");
  assert.equal(explanationCacheKey("1", "안녕하세요.\n반갑습니다"), "1:안녕하세요. 반갑습니다");
  assert.notEqual(explanationCacheKey("1", "안녕하세요."), explanationCacheKey("2", "안녕하세요."));
});

test("explanations persist locally and survive a database reopen", async () => {
  const name = "persist-reopen-test";
  await putCachedExplanation(new ExplanationDatabase(name), record());

  const reopened = new ExplanationDatabase(name);
  const cached = await getCachedExplanation(reopened, record().key);

  assert.deepEqual(cached, explanation);
});

test("records that differ only by sentence or prompt version stay distinct", async () => {
  const database = new ExplanationDatabase("distinct-keys-test");
  await putCachedExplanation(database, record());
  await putCachedExplanation(database, record({ key: explanationCacheKey("2", "안녕하세요."), promptVersion: "2" }));
  await putCachedExplanation(database, record({ key: explanationCacheKey("1", "뭐 해?"), sentence: "뭐 해?" }));

  assert.equal(database.explanations.count !== undefined ? await database.explanations.count() : 0, 3);
});

test("the explanation cache can be cleared", async () => {
  const database = new ExplanationDatabase("clear-test");
  await putCachedExplanation(database, record());

  await clearExplanationCache(database);

  assert.equal(await getCachedExplanation(database, record().key), undefined);
});

test("stored records hold no credentials", async () => {
  const database = new ExplanationDatabase("credentials-test");
  await putCachedExplanation(database, record({ provider: "openai-compatible", model: "test-model" }));

  const stored = await database.explanations.get(record().key);

  assert.ok(stored);
  const keys = Object.keys(stored);
  assert.deepEqual(
    keys.filter((key) => /apikey|token|secret|credential/i.test(key)),
    [],
    "records must not contain credential-like fields"
  );
  assert.ok(!JSON.stringify(stored).includes("sk-"));
});
