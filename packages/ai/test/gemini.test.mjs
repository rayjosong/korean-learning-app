import assert from "node:assert/strict";
import test from "node:test";

import { GeminiLanguageModel } from "../src/gemini.ts";
import { LanguageModelError } from "../src/openai-compatible.ts";
import { SENTENCE_EXPLANATION_SYSTEM_PROMPT } from "../src/sentence-explanation.ts";
import { WORD_EXPLANATION_SYSTEM_PROMPT } from "../src/word-explanation.ts";

function model(fetch) {
  return new GeminiLanguageModel({
    apiKey: "gemini-key",
    model: "gemini-2.5-flash",
    fetch
  });
}

function candidateResponse(explanation) {
  return Response.json({
    candidates: [
      {
        content: {
          parts: [{ text: JSON.stringify(explanation) }]
        }
      }
    ]
  });
}

test("calls Gemini REST endpoint with x-goog-api-key header and json format", async () => {
  let request;
  const languageModel = model(async (url, init) => {
    request = { url, init };
    return candidateResponse({
      sentence: "지금 가고 있어요.",
      naturalMeaning: "I'm on my way now.",
      breakdown: [{ text: "지금", meaning: "now" }],
      grammar: []
    });
  });

  const result = await languageModel.explainSentence({ sentence: "지금 가고 있어요." });

  assert.equal(
    request.url,
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
  );
  assert.equal(request.init.headers["x-goog-api-key"], "gemini-key");
  const body = JSON.parse(request.init.body);
  assert.equal(body.systemInstruction.parts[0].text, SENTENCE_EXPLANATION_SYSTEM_PROMPT);
  assert.equal(body.generationConfig.responseMimeType, "application/json");
  assert.equal(result.naturalMeaning, "I'm on my way now.");
});

test("handles Gemini network errors", async () => {
  const languageModel = model(async () => {
    throw new TypeError("fetch failed");
  });

  await assert.rejects(
    () => languageModel.explainSentence({ sentence: "안녕하세요." }),
    (error) =>
      error instanceof LanguageModelError &&
      error.code === "REQUEST_FAILED" &&
      error.message === "The AI provider request failed."
  );
});

test("supports Gemini word explanations", async () => {
  let request;
  const languageModel = model(async (url, init) => {
    request = { url, init };
    return candidateResponse({
      word: "가고 있어요",
      meaning: "am going",
      dictionaryForm: "가다"
    });
  });

  const result = await languageModel.explainWord({ word: "가고 있어요", sentence: "지금 가고 있어요." });

  assert.deepEqual(result, {
    word: "가고 있어요",
    meaning: "am going",
    dictionaryForm: "가다"
  });
  const body = JSON.parse(request.init.body);
  assert.equal(body.systemInstruction.parts[0].text, WORD_EXPLANATION_SYSTEM_PROMPT);
});

test("turns malformed Gemini candidates into controlled error", async () => {
  for (const [label, payload, expectedMsg] of [
    ["missing candidates", {}, "The AI provider response had no candidates."],
    ["empty candidates", { candidates: [] }, "The AI provider response had no candidates."],
    ["missing parts", { candidates: [{ content: { parts: [] } }] }, "The AI provider response had no message content."],
    ["non-string text", { candidates: [{ content: { parts: [{ text: 123 }] } }] }, "The AI provider response had no message content."]
  ]) {
    const languageModel = model(async () => Response.json(payload));
    await assert.rejects(
      () => languageModel.explainSentence({ sentence: "안녕하세요." }),
      (error) =>
        error instanceof LanguageModelError &&
        error.code === "INVALID_OUTPUT" &&
        error.message === expectedMsg,
      `Failed for ${label}`
    );
  }
});

test("does not expose secret API key in Gemini error status output", async () => {
  const languageModel = model(async () => new Response("gemini secret body", { status: 401 }));

  await assert.rejects(
    () => languageModel.explainSentence({ sentence: "안녕하세요." }),
    (error) =>
      error instanceof LanguageModelError &&
      error.code === "REQUEST_FAILED" &&
      !error.message.includes("gemini secret body") &&
      error.status === 401
  );
});

test("rejects missing Gemini options and invalid input", async () => {
  assert.throws(
    () => new GeminiLanguageModel({ apiKey: "", model: "gemini-2.5-flash" }),
    (error) => error instanceof LanguageModelError && error.code === "INVALID_INPUT"
  );
  assert.throws(
    () => new GeminiLanguageModel({ apiKey: "key", model: "" }),
    (error) => error instanceof LanguageModelError && error.code === "INVALID_INPUT"
  );
});
