import assert from "node:assert/strict";
import test from "node:test";

import { estimateVideoDifficulty } from "../src/video-difficulty.ts";

function item(overrides = {}) {
  return {
    id: "item",
    kind: "word",
    text: "오늘",
    state: "known",
    recognitionConfidence: 100,
    productionConfidence: 0,
    encounters: 1,
    successes: 1,
    failures: 0,
    contextIds: [],
    ...overrides
  };
}

test("new learners receive a broad fallback without blocking access", () => {
  const estimate = estimateVideoDifficulty({
    segments: [{ text: "오늘은 날씨가 좋아요." }, { text: "한국어를 공부해요." }]
  });

  assert.equal(estimate.source, "fallback");
  assert.ok(estimate.likelyComprehension.max - estimate.likelyComprehension.min >= 20);
  assert.ok(estimate.reasonCodes.includes("new-learner"));
});

test("known coverage personalizes comprehension and matches phrases before words", () => {
  const estimate = estimateVideoDifficulty({
    segments: [{ text: "오늘 정말 좋아요." }],
    items: [
      item({ id: "phrase", text: "오늘 정말", state: "known", recognitionConfidence: 100 }),
      item({ id: "word", text: "오늘", state: "known", recognitionConfidence: 100 })
    ]
  });

  assert.equal(estimate.source, "personalized");
  assert.ok(estimate.likelyComprehension.max > 55);
  assert.ok(estimate.reasonCodes.includes("known-coverage"));
});

test("low confidence learning items do not count as certain coverage", () => {
  const estimate = estimateVideoDifficulty({
    segments: [{ text: "오늘 정말 좋아요." }],
    items: [item({ state: "learning", recognitionConfidence: 20 })]
  });

  assert.equal(estimate.source, "personalized");
  assert.ok(estimate.likelyComprehension.max < 95);
});

test("the same transcript span is not double-counted", () => {
  const one = estimateVideoDifficulty({
    segments: [{ text: "오늘 정말 좋아요." }],
    items: [item({ text: "오늘 정말" })]
  });
  const two = estimateVideoDifficulty({
    segments: [{ text: "오늘 정말 좋아요." }],
    items: [item({ text: "오늘 정말" }), item({ id: "other", text: "오늘" })]
  });

  assert.equal(one.likelyComprehension.max, two.likelyComprehension.max);
});
