import assert from "node:assert/strict";
import test from "node:test";

import {
  LanguageModelError,
  OpenAICompatibleLanguageModel
} from "../src/openai-compatible.ts";
import { SENTENCE_EXPLANATION_SYSTEM_PROMPT } from "../src/sentence-explanation.ts";
import { WORD_EXPLANATION_SYSTEM_PROMPT } from "../src/word-explanation.ts";

function model(fetch) {
  return new OpenAICompatibleLanguageModel({
    apiKey: "user-key",
    model: "test-model",
    baseUrl: "https://example.test/v1/",
    fetch
  });
}

function contentResponse(explanation) {
  return Response.json({
    choices: [{ message: { content: JSON.stringify(explanation) } }]
  });
}

test("calls an OpenAI-compatible endpoint with the BYO key and custom base URL", async () => {
  let request;
  const languageModel = model(async (url, init) => {
    request = { url, init };
    return contentResponse({
      sentence: "지금 가고 있어요.",
      naturalMeaning: "I'm on my way now.",
      breakdown: [{ text: "지금", meaning: "now" }],
      grammar: []
    });
  });

  const result = await languageModel.explainSentence({ sentence: "지금 가고 있어요." });

  assert.equal(request.url, "https://example.test/v1/chat/completions");
  assert.equal(request.init.headers.Authorization, "Bearer user-key");
  assert.deepEqual(JSON.parse(request.init.body), {
    model: "test-model",
    messages: [
      { role: "system", content: SENTENCE_EXPLANATION_SYSTEM_PROMPT },
      { role: "user", content: "Explain this Korean sentence in context.\nSentence: 지금 가고 있어요." }
    ],
    response_format: { type: "json_object" }
  });
  assert.equal(result.naturalMeaning, "I'm on my way now.");
});

test("sentence explanation prompt covers real Korean and stays concise by default", () => {
  for (const term of [
    "naturalMeaning",
    "breakdown",
    "grammar",
    "nuance",
    "speechLevel",
    "contraction",
    "slang",
    "filler",
    "casual",
    "honorific",
    "concise"
  ]) {
    assert.match(SENTENCE_EXPLANATION_SYSTEM_PROMPT, new RegExp(term), `prompt should mention "${term}"`);
  }
});

test("returns a structured explanation for contracted casual speech with slang and fillers", async () => {
  const languageModel = model(async () => contentResponse({
    sentence: "뭐 해? 나 지금 거기 안 가.",
    naturalMeaning: "What are you doing? I'm not going there now.",
    breakdown: [
      { text: "뭐", meaning: "what (contraction of 무엇)", role: "pronoun" },
      { text: "해", meaning: "doing", role: "verb" },
      { text: "나", meaning: "I", role: "pronoun" },
      { text: "지금", meaning: "now", role: "adverb" },
      { text: "거기", meaning: "there", role: "adverb" },
      { text: "안", meaning: "not", role: "negation" },
      { text: "가", meaning: "go", role: "verb" }
    ],
    grammar: [
      { form: "-아/어? (해?)", explanation: "Casual question ending; drops the polite -요." },
      { form: "안 + verb", explanation: "Short-form negation meaning 'not'." }
    ],
    nuance: "Blunt casual tone between close friends.",
    speechLevel: "해체 (casual/반말)"
  }));

  const result = await languageModel.explainSentence({ sentence: "뭐 해? 나 지금 거기 안 가." });

  assert.equal(result.sentence, "뭐 해? 나 지금 거기 안 가.");
  assert.equal(result.naturalMeaning, "What are you doing? I'm not going there now.");
  assert.equal(result.breakdown.length, 7);
  assert.deepEqual(result.grammar[0], { form: "-아/어? (해?)", explanation: "Casual question ending; drops the polite -요." });
  assert.equal(result.nuance, "Blunt casual tone between close friends.");
  assert.equal(result.speechLevel, "해체 (casual/반말)");
});

test("omits nuance and speechLevel when the model leaves them out", async () => {
  const languageModel = model(async () => contentResponse({
    sentence: "안녕하세요.",
    naturalMeaning: "Hello.",
    breakdown: [{ text: "안녕하세요", meaning: "hello", role: "greeting" }],
    grammar: []
  }));

  const result = await languageModel.explainSentence({ sentence: "안녕하세요." });

  assert.deepEqual(result, {
    sentence: "안녕하세요.",
    naturalMeaning: "Hello.",
    breakdown: [{ text: "안녕하세요", meaning: "hello", role: "greeting" }],
    grammar: []
  });
  assert.equal(result.nuance, undefined);
  assert.equal(result.speechLevel, undefined);
});

test("supports word explanations through the same provider", async () => {
  let request;
  const languageModel = model(async (url, init) => {
    request = { url, init };
    return Response.json({
      choices: [{ message: { content: JSON.stringify({
        word: "가고 있어요",
        meaning: "am going",
        dictionaryForm: "가다"
      }) } }]
    });
  });

  assert.deepEqual(await languageModel.explainWord({ word: "가고 있어요", sentence: "지금 가고 있어요." }), {
    word: "가고 있어요",
    meaning: "am going",
    dictionaryForm: "가다"
  });
  assert.deepEqual(JSON.parse(request.init.body).messages[0], {
    role: "system",
    content: WORD_EXPLANATION_SYSTEM_PROMPT
  });
});

test("word explanation prompt covers real Korean and stays concise by default", () => {
  for (const term of ["dictionaryForm", "contractions", "slang", "fillers", "honorific", "concise"]) {
    assert.match(WORD_EXPLANATION_SYSTEM_PROMPT, new RegExp(term), `prompt should mention "${term}"`);
  }
});

test("turns malformed model output into a controlled error", async () => {
  const languageModel = model(async () => Response.json({
    choices: [{ message: { content: "not JSON" } }]
  }));

  await assert.rejects(
    () => languageModel.explainSentence({ sentence: "안녕하세요." }),
    (error) => error instanceof LanguageModelError && error.code === "INVALID_OUTPUT"
  );
});

for (const [label, explanation] of [
  ["missing naturalMeaning", { sentence: "안녕하세요.", breakdown: [], grammar: [] }],
  ["breakdown that is not an array", { sentence: "안녕하세요.", naturalMeaning: "Hello.", breakdown: "words", grammar: [] }],
  ["breakdown item missing meaning", { sentence: "안녕하세요.", naturalMeaning: "Hello.", breakdown: [{ text: "안녕하세요" }], grammar: [] }],
  ["grammar item missing explanation", { sentence: "안녕하세요.", naturalMeaning: "Hello.", breakdown: [], grammar: [{ form: "-세요" }] }],
  ["non-string nuance", { sentence: "안녕하세요.", naturalMeaning: "Hello.", breakdown: [], grammar: [], nuance: 5 }],
  ["non-string speechLevel", { sentence: "안녕하세요.", naturalMeaning: "Hello.", breakdown: [], grammar: [], speechLevel: true }]
]) {
  test(`rejects invalid structured output: ${label}`, async () => {
    const languageModel = model(async () => contentResponse(explanation));

    await assert.rejects(
      () => languageModel.explainSentence({ sentence: "안녕하세요." }),
      (error) =>
        error instanceof LanguageModelError &&
        error.code === "INVALID_OUTPUT" &&
        error.message === "The AI provider returned an invalid sentence explanation."
    );
  });
}

test("does not include provider response bodies in request errors", async () => {
  const languageModel = model(async () => new Response("provider secret body", { status: 500 }));

  await assert.rejects(
    () => languageModel.explainSentence({ sentence: "안녕하세요." }),
    (error) =>
      error instanceof LanguageModelError &&
      error.code === "REQUEST_FAILED" &&
      !error.message.includes("provider secret body") &&
      error.status === 500
  );
});

test("rejects missing credentials and input before making a request", async () => {
  assert.throws(
    () => new OpenAICompatibleLanguageModel({ apiKey: "", model: "test-model" }),
    (error) => error instanceof LanguageModelError && error.code === "INVALID_INPUT"
  );
  await assert.rejects(
    () => new OpenAICompatibleLanguageModel({ apiKey: "user-key", model: "test-model" }).explainSentence({ sentence: "" }),
    (error) => error instanceof LanguageModelError && error.code === "INVALID_INPUT"
  );
});
