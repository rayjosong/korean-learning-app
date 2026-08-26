import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";

import {
  ExplanationDatabase,
  getCachedWordExplanation,
  getWordExplanationRecord,
  putCachedWordExplanation,
  wordExplanationCacheKey
} from "../src/index.ts";

const explanation = {
  word: "가고 있어요",
  meaning: "am going",
  dictionaryForm: "가다"
};

const sentence = "지금 가고 있어요.";

function record(overrides = {}) {
  return {
    key: wordExplanationCacheKey("1", "가고 있어요", sentence),
    word: "가고 있어요",
    sentence,
    promptVersion: "1",
    explanation,
    videoId: "dQw4w9WgXcQ",
    transcriptSegmentId: "segment-3",
    startTimeMs: 42000,
    endTimeMs: 44500,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

test("word cache keys include prompt version, word, and source sentence", () => {
  assert.equal(wordExplanationCacheKey("1", "가고 있어요", sentence), `1:가고 있어요:${sentence}`);
  assert.equal(wordExplanationCacheKey("1", "  가고 있어요 ", sentence), `1:가고 있어요:${sentence}`);
  assert.notEqual(
    wordExplanationCacheKey("1", "가고 있어요", sentence),
    wordExplanationCacheKey("1", "가고 있어요", "어제 가고 있었어요.")
  );
  assert.notEqual(
    wordExplanationCacheKey("1", "가고 있어요", sentence),
    wordExplanationCacheKey("2", "가고 있어요", sentence)
  );
});

test("word explanations persist locally with source context and survive a reopen", async () => {
  const name = "word-persist-reopen-test";
  await putCachedWordExplanation(new ExplanationDatabase(name), record());

  const reopened = new ExplanationDatabase(name);
  const cached = await getCachedWordExplanation(reopened, record().key);
  const stored = await getWordExplanationRecord(reopened, record().key);

  assert.deepEqual(cached, explanation);
  assert.ok(stored);
  assert.equal(stored.videoId, "dQw4w9WgXcQ");
  assert.equal(stored.transcriptSegmentId, "segment-3");
  assert.equal(stored.startTimeMs, 42000);
  assert.equal(stored.endTimeMs, 44500);
  assert.equal(stored.sentence, sentence);
});

test("the same word in different sentences stays distinct", async () => {
  const database = new ExplanationDatabase("word-distinct-keys-test");
  await putCachedWordExplanation(database, record());
  await putCachedWordExplanation(
    database,
    record({
      key: wordExplanationCacheKey("1", "가고 있어요", "어제 가고 있었어요."),
      sentence: "어제 가고 있었어요."
    })
  );

  assert.equal(await database.wordExplanations.count(), 2);
});

test("re-explaining a cached word overwrites the same record", async () => {
  const database = new ExplanationDatabase("word-overwrite-test");
  await putCachedWordExplanation(database, record());
  await putCachedWordExplanation(
    database,
    record({ explanation: { word: "가고 있어요", meaning: "am going (right now)" } })
  );

  assert.equal(await database.wordExplanations.count(), 1);
  assert.equal(
    (await getCachedWordExplanation(database, record().key))?.meaning,
    "am going (right now)"
  );
});

test("stored word records hold no credentials", async () => {
  const database = new ExplanationDatabase("word-credentials-test");
  await putCachedWordExplanation(
    database,
    record({ provider: "openai-compatible", model: "test-model" })
  );

  const stored = await getWordExplanationRecord(database, record().key);

  assert.ok(stored);
  const keys = Object.keys(stored);
  assert.deepEqual(
    keys.filter((key) => /apikey|token|secret|credential/i.test(key)),
    [],
    "records must not contain credential-like fields"
  );
  assert.ok(!JSON.stringify(stored).includes("sk-"));
});
