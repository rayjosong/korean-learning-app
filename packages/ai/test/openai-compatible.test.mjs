import assert from "node:assert/strict";
import test from "node:test";

import {
  LanguageModelError,
  OpenAICompatibleLanguageModel
} from "../src/openai-compatible.ts";

function model(fetch) {
  return new OpenAICompatibleLanguageModel({
    apiKey: "user-key",
    model: "test-model",
    baseUrl: "https://example.test/v1/",
    fetch
  });
}

test("calls an OpenAI-compatible endpoint with the BYO key and custom base URL", async () => {
  let request;
  const languageModel = model(async (url, init) => {
    request = { url, init };
    return Response.json({
      choices: [{ message: { content: JSON.stringify({
        sentence: "지금 가고 있어요.",
        naturalMeaning: "I'm on my way now.",
        breakdown: [{ text: "지금", meaning: "now" }],
        grammar: []
      }) } }]
    });
  });

  const result = await languageModel.explainSentence({ sentence: "지금 가고 있어요." });

  assert.equal(request.url, "https://example.test/v1/chat/completions");
  assert.equal(request.init.headers.Authorization, "Bearer user-key");
  assert.deepEqual(JSON.parse(request.init.body), {
    model: "test-model",
    messages: [
      {
        role: "system",
        content: "You are a concise Korean tutor. Return only a JSON object with sentence, naturalMeaning, breakdown, grammar, and optional nuance and speechLevel."
      },
      { role: "user", content: "Explain this Korean sentence in context.\nSentence: 지금 가고 있어요." }
    ],
    response_format: { type: "json_object" }
  });
  assert.equal(result.naturalMeaning, "I'm on my way now.");
});

test("supports word explanations through the same provider", async () => {
  const languageModel = model(async () => Response.json({
    choices: [{ message: { content: JSON.stringify({
      word: "가고 있어요",
      meaning: "am going",
      dictionaryForm: "가다"
    }) } }]
  }));

  assert.deepEqual(await languageModel.explainWord({ word: "가고 있어요", sentence: "지금 가고 있어요." }), {
    word: "가고 있어요",
    meaning: "am going",
    dictionaryForm: "가다"
  });
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
