import assert from "node:assert/strict";
import test from "node:test";

import { wordExplanationSchema } from "../src/word-explanation.ts";

test("wordExplanationSchema valid explanation", () => {
  const data = {
    word: "가고 있어요",
    meaning: "am going",
    dictionaryForm: "가다",
    nuance: "progressive form"
  };

  const result = wordExplanationSchema.safeParse(data);
  assert.equal(result.success, true);
  assert.deepEqual(result.data, data);
});

test("wordExplanationSchema valid explanation with minimal fields", () => {
  const data = {
    word: "가고",
    meaning: "going"
  };

  const result = wordExplanationSchema.safeParse(data);
  assert.equal(result.success, true);
  assert.deepEqual(result.data, data);
});

test("wordExplanationSchema invalid explanation (missing required field)", () => {
  const data = {
    meaning: "am going"
  };

  const result = wordExplanationSchema.safeParse(data);
  assert.equal(result.success, false);
});

test("wordExplanationSchema invalid explanation (wrong type for required fields)", () => {
  const data = {
    word: "가고 있어요",
    meaning: 123
  };

  const result = wordExplanationSchema.safeParse(data);
  assert.equal(result.success, false);
});

test("wordExplanationSchema invalid explanation (wrong type for optional fields)", () => {
  const data = {
    word: "가고 있어요",
    meaning: "am going",
    dictionaryForm: 123,
    nuance: true
  };

  const result = wordExplanationSchema.safeParse(data);
  assert.equal(result.success, false);
});
