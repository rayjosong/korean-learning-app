import assert from "node:assert/strict";
import test from "node:test";

import { sentenceExplanationSchema } from "../src/sentence-explanation.ts";

const validMinimalData = {
  sentence: "안녕하세요",
  naturalMeaning: "Hello.",
  breakdown: [
    { text: "안녕하세요", meaning: "Hello." }
  ],
  grammar: []
};

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
  const result = sentenceExplanationSchema.safeParse(validMinimalData);
  assert.equal(result.success, true);
  assert.deepEqual(result.data, validMinimalData);
});

for (const field of ["sentence", "naturalMeaning", "breakdown", "grammar"]) {
  test(`sentenceExplanationSchema invalid explanation (missing ${field})`, () => {
    const data = { ...validMinimalData };
    delete data[field];

    const result = sentenceExplanationSchema.safeParse(data);
    assert.equal(result.success, false);
  });
}

test("sentenceExplanationSchema invalid explanation (wrong type for string field)", () => {
  const data = {
    ...validMinimalData,
    naturalMeaning: 123, // should be string
  };

  const result = sentenceExplanationSchema.safeParse(data);
  assert.equal(result.success, false);
});

for (const field of ["nuance", "speechLevel"]) {
  test(`sentenceExplanationSchema invalid explanation (wrong type for optional field ${field})`, () => {
    const data = {
      ...validMinimalData,
      [field]: 123, // should be string
    };

    const result = sentenceExplanationSchema.safeParse(data);
    assert.equal(result.success, false);
  });
}

for (const field of ["breakdown", "grammar"]) {
  test(`sentenceExplanationSchema invalid explanation (${field} is not an array)`, () => {
    const data = {
      ...validMinimalData,
      [field]: {}, // should be array
    };

    const result = sentenceExplanationSchema.safeParse(data);
    assert.equal(result.success, false);
  });
}

test("sentenceExplanationSchema invalid explanation (breakdown item missing text)", () => {
  const data = {
    ...validMinimalData,
    breakdown: [{ meaning: "Hello." }]
  };
  const result = sentenceExplanationSchema.safeParse(data);
  assert.equal(result.success, false);
});

test("sentenceExplanationSchema invalid explanation (breakdown item missing meaning)", () => {
  const data = {
    ...validMinimalData,
    breakdown: [{ text: "안녕하세요" }]
  };
  const result = sentenceExplanationSchema.safeParse(data);
  assert.equal(result.success, false);
});

test("sentenceExplanationSchema invalid explanation (breakdown item wrong type for role)", () => {
  const data = {
    ...validMinimalData,
    breakdown: [{ text: "안녕하세요", meaning: "Hello.", role: 123 }]
  };
  const result = sentenceExplanationSchema.safeParse(data);
  assert.equal(result.success, false);
});

test("sentenceExplanationSchema invalid explanation (grammar item missing form)", () => {
  const data = {
    ...validMinimalData,
    grammar: [{ explanation: "explanation" }]
  };
  const result = sentenceExplanationSchema.safeParse(data);
  assert.equal(result.success, false);
});

test("sentenceExplanationSchema invalid explanation (grammar item missing explanation)", () => {
  const data = {
    ...validMinimalData,
    grammar: [{ form: "form" }]
  };
  const result = sentenceExplanationSchema.safeParse(data);
  assert.equal(result.success, false);
});
