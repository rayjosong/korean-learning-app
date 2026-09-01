import assert from "node:assert/strict";
import test from "node:test";

import { sentenceExplanationSchema } from "../src/sentence-explanation.ts";

test("sentenceExplanationSchema valid explanation", () => {
  const data = {
    sentence: "안녕하세요",
    naturalMeaning: "Hello.",
    breakdown: [
      { text: "안녕", meaning: "well-being", role: "noun" },
      { text: "하세요", meaning: "do", role: "verb ending" }
    ],
    grammar: [
      { form: "하세요", explanation: "Polite imperative or declarative ending." }
    ],
    nuance: "A common greeting.",
    speechLevel: "해요체 (polite)"
  };

  const result = sentenceExplanationSchema.safeParse(data);
  assert.equal(result.success, true);
  assert.deepEqual(result.data, data);
});

test("sentenceExplanationSchema valid explanation with minimal fields", () => {
  const data = {
    sentence: "안녕하세요",
    naturalMeaning: "Hello.",
    breakdown: [
      { text: "안녕하세요", meaning: "Hello." }
    ],
    grammar: []
  };

  const result = sentenceExplanationSchema.safeParse(data);
  assert.equal(result.success, true);
  assert.deepEqual(result.data, data);
});

test("sentenceExplanationSchema invalid explanation (missing required field)", () => {
  const data = {
    sentence: "안녕하세요",
    breakdown: [],
    grammar: []
  };

  const result = sentenceExplanationSchema.safeParse(data);
  assert.equal(result.success, false);
});

test("sentenceExplanationSchema invalid explanation (wrong type)", () => {
  const data = {
    sentence: "안녕하세요",
    naturalMeaning: 123, // should be string
    breakdown: [],
    grammar: []
  };

  const result = sentenceExplanationSchema.safeParse(data);
  assert.equal(result.success, false);
});
