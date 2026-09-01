import assert from "node:assert/strict";
import test from "node:test";

import { AnthropicLanguageModel } from "../src/anthropic.ts";
import { LanguageModelError } from "../src/openai-compatible.ts";
import { SENTENCE_EXPLANATION_SYSTEM_PROMPT } from "../src/sentence-explanation.ts";
import { WORD_EXPLANATION_SYSTEM_PROMPT } from "../src/word-explanation.ts";

function model(fetch) {
  return new AnthropicLanguageModel({
    apiKey: "claude-key",
    model: "claude-3-5-sonnet-latest",
    fetch
  });
}

function messageResponse(explanation) {
  return Response.json({
    content: [
      {
        type: "text",
        text: JSON.stringify(explanation)
      }
    ]
  });
}

test("calls Anthropic Messages endpoint with required headers and payload", async () => {
  let request;
  const languageModel = model(async (url, init) => {
    request = { url, init };
    return messageResponse({
      sentence: "지금 가고 있어요.",
      naturalMeaning: "I'm on my way now.",
      breakdown: [{ text: "지금", meaning: "now" }],
      grammar: []
    });
  });

  const result = await languageModel.explainSentence({ sentence: "지금 가고 있어요." });

  assert.equal(request.url, "https://api.anthropic.com/v1/messages");
  assert.equal(request.init.headers["x-api-key"], "claude-key");
  assert.equal(request.init.headers["anthropic-version"], "2023-06-01");
  assert.equal(request.init.headers["anthropic-dangerous-direct-browser-access"], "true");
  const body = JSON.parse(request.init.body);
  assert.equal(body.model, "claude-3-5-sonnet-latest");
  assert.equal(body.system, SENTENCE_EXPLANATION_SYSTEM_PROMPT);
  assert.equal(result.naturalMeaning, "I'm on my way now.");
});

test("handles Anthropic network errors", async () => {
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

test("supports Anthropic word explanations", async () => {
  let request;
  const languageModel = model(async (url, init) => {
    request = { url, init };
    return messageResponse({
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
  assert.equal(body.system, WORD_EXPLANATION_SYSTEM_PROMPT);
});

test("turns malformed Anthropic content into controlled error", async () => {
  for (const [label, payload, expectedMsg] of [
    ["missing content", {}, "The AI provider response had no message content."],
    ["empty content", { content: [] }, "The AI provider response had no message content."],
    ["non-string text", { content: [{ text: 123 }] }, "The AI provider response had no message content."]
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

test("does not expose secret API key in Anthropic error status output", async () => {
  const languageModel = model(async () => new Response("anthropic secret body", { status: 401 }));

  await assert.rejects(
    () => languageModel.explainSentence({ sentence: "안녕하세요." }),
    (error) =>
      error instanceof LanguageModelError &&
      error.code === "REQUEST_FAILED" &&
      !error.message.includes("anthropic secret body") &&
      error.status === 401
  );
});

test("rejects missing Anthropic options and invalid input", async () => {
  assert.throws(
    () => new AnthropicLanguageModel({ apiKey: "", model: "claude-3-5-sonnet-latest" }),
    (error) => error instanceof LanguageModelError && error.code === "INVALID_INPUT"
  );
  assert.throws(
    () => new AnthropicLanguageModel({ apiKey: "key", model: "" }),
    (error) => error instanceof LanguageModelError && error.code === "INVALID_INPUT"
  );
});
