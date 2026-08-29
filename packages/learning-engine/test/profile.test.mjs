import assert from "node:assert/strict";
import test from "node:test";

import { aggregateLearnerProfile } from "../src/profile.ts";

function item(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    kind: "word",
    text: "한국어",
    state: "learning",
    recognitionConfidence: 0,
    productionConfidence: 0,
    encounters: 1,
    successes: 0,
    failures: 0,
    contextIds: [],
    ...overrides
  };
}

test("empty input produces an explainable empty profile", () => {
  assert.deepEqual(aggregateLearnerProfile({ items: [], grammar: [], speechLevels: [] }), {
    knownCount: 0,
    learningCount: 0,
    recognitionConfidence: { count: 0, average: null },
    productionConfidence: { count: 0, average: null },
    grammar: [],
    speechLevels: []
  });
});

test("summarizes mixed learner state and 0/100 confidence boundaries", () => {
  const profile = aggregateLearnerProfile({
    items: [
      item({ id: "known", state: "known", recognitionConfidence: 100, productionConfidence: 0 }),
      item({ id: "learning", recognitionConfidence: 0, productionConfidence: 100 }),
      item({ id: "unknown", state: "unknown", recognitionConfidence: 100, productionConfidence: 100 })
    ],
    grammar: [],
    speechLevels: []
  });

  assert.equal(profile.knownCount, 1);
  assert.equal(profile.learningCount, 1);
  assert.deepEqual(profile.recognitionConfidence, { count: 2, average: 50 });
  assert.deepEqual(profile.productionConfidence, { count: 2, average: 50 });
});

test("bounds invalid saved confidence values before averaging", () => {
  const profile = aggregateLearnerProfile({
    items: [
      item({ recognitionConfidence: 150, productionConfidence: -10 }),
      item({ recognitionConfidence: Number.NaN, productionConfidence: Number.POSITIVE_INFINITY }),
      item({ recognitionConfidence: 0, productionConfidence: 100 })
    ],
    grammar: [],
    speechLevels: []
  });

  assert.deepEqual(profile.recognitionConfidence, { count: 3, average: 33.3 });
  assert.deepEqual(profile.productionConfidence, { count: 3, average: 33.3 });
});

test("normalizes and deduplicates repeated grammar forms", () => {
  const profile = aggregateLearnerProfile({
    items: [],
    grammar: [{ form: " -고   싶다 " }, { form: "-고 싶다" }, { form: "-지만" }, { form: " " }],
    speechLevels: []
  });

  assert.deepEqual(profile.grammar, [
    { form: "-고 싶다", count: 2 },
    { form: "-지만", count: 1 }
  ]);
});

test("speech-level familiarity reflects exposure count rather than mastery", () => {
  const profile = aggregateLearnerProfile({
    items: [],
    grammar: [],
    speechLevels: [
      { level: "해요체" },
      { level: " 해요체 " },
      { level: "해요체" },
      { level: "해요체" },
      { level: "해체" },
      { level: "해체" },
      { level: "하십시오체" }
    ]
  });

  assert.deepEqual(profile.speechLevels, [
    { level: "해요체", count: 4, familiarity: "well-exposed" },
    { level: "해체", count: 2, familiarity: "familiar" },
    { level: "하십시오체", count: 1, familiarity: "exposed" }
  ]);
});
