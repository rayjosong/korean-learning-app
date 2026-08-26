import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";

import { ExplanationDatabase, putCachedExplanation, putLearningItem } from "../src/index.ts";
import { getLearnerProfileInput } from "../src/learner-profile.ts";

test("loads learner items plus grammar and speech-level observations", async () => {
  const database = new ExplanationDatabase("learner-profile-input-test");

  await putLearningItem(database, {
    id: "item-1",
    kind: "word",
    text: "가다",
    state: "learning",
    recognitionConfidence: 30,
    productionConfidence: 10,
    encounters: 1,
    successes: 0,
    failures: 0,
    contextIds: []
  });
  await putCachedExplanation(database, {
    key: "v1:sentence",
    sentence: "가고 싶어요",
    promptVersion: "v1",
    explanation: {
      sentence: "가고 싶어요",
      naturalMeaning: "I want to go.",
      breakdown: [],
      grammar: [{ form: "-고 싶다", explanation: "want to" }],
      speechLevel: "해요체"
    },
    createdAt: "2026-08-26T00:00:00.000Z"
  });

  const input = await getLearnerProfileInput(database);

  assert.equal(input.items.length, 1);
  assert.deepEqual(input.grammar, [{ form: "-고 싶다" }]);
  assert.deepEqual(input.speechLevels, [{ level: "해요체" }]);
});

test("empty storage returns empty profile evidence", async () => {
  const database = new ExplanationDatabase("learner-profile-empty-test");
  const input = await getLearnerProfileInput(database);

  assert.deepEqual(input.items, []);
  assert.deepEqual(input.grammar, []);
  assert.deepEqual(input.speechLevels, []);
});
