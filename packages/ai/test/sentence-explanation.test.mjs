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

test("sentenceExplanationSchema invalid explanation (invalid breakdown item missing required field)", () => {
  const data = {
    sentence: "안녕하세요",
    naturalMeaning: "Hello.",
    breakdown: [
      { meaning: "Hello." } // missing text
    ],
    grammar: []
  };

  const result = sentenceExplanationSchema.safeParse(data);
  assert.equal(result.success, false);
});

test("sentenceExplanationSchema invalid explanation (invalid breakdown item type)", () => {
  const data = {
    sentence: "안녕하세요",
    naturalMeaning: "Hello.",
    breakdown: [
      { text: 123, meaning: "Hello." } // text should be string
    ],
    grammar: []
  };

  const result = sentenceExplanationSchema.safeParse(data);
  assert.equal(result.success, false);
});

test("sentenceExplanationSchema invalid explanation (invalid grammar item missing required field)", () => {
  const data = {
    sentence: "안녕하세요",
    naturalMeaning: "Hello.",
    breakdown: [],
    grammar: [
      { form: "하세요" } // missing explanation
    ]
  };

  const result = sentenceExplanationSchema.safeParse(data);
  assert.equal(result.success, false);
});

test("sentenceExplanationSchema invalid explanation (invalid grammar item type)", () => {
  const data = {
    sentence: "안녕하세요",
    naturalMeaning: "Hello.",
    breakdown: [],
    grammar: [
      { form: "하세요", explanation: 123 } // explanation should be string
    ]
  };

  const result = sentenceExplanationSchema.safeParse(data);
  assert.equal(result.success, false);
});

test("sentenceExplanationSchema invalid explanation (invalid optional fields type)", () => {
  const data = {
    sentence: "안녕하세요",
    naturalMeaning: "Hello.",
    breakdown: [],
    grammar: [],
    nuance: 123, // nuance should be string
    speechLevel: true // speechLevel should be string
  };

  const result = sentenceExplanationSchema.safeParse(data);
  assert.equal(result.success, false);
});
