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

test("handles network errors during completion", async () => {
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

test("handles invalid JSON from provider", async () => {
  const languageModel = model(async () => {
    return new Response("Not valid JSON", { status: 200, headers: { "Content-Type": "text/plain" } });
  });

  await assert.rejects(
    () => languageModel.explainSentence({ sentence: "안녕하세요." }),
    (error) =>
      error instanceof LanguageModelError &&
      error.code === "INVALID_OUTPUT" &&
      error.message === "The AI provider returned invalid JSON."
  );
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

test("uses the ambient browser fetch when none is injected, without illegal invocation", async () => {
  const originalFetch = globalThis.fetch;
  let calledUrl;
  globalThis.fetch = function (url, init) {
    if (this !== globalThis) throw new TypeError("Illegal invocation (receiver check)");
    calledUrl = url;
    return Promise.resolve(contentResponse({
      sentence: "안녕하세요.",
      naturalMeaning: "Hello.",
      breakdown: [{ text: "안녕하세요", meaning: "hello" }],
      grammar: []
    }));
  };

  try {
    const languageModel = new OpenAICompatibleLanguageModel({
      apiKey: "user-key",
      model: "test-model",
      baseUrl: "https://example.test/v1/"
    });

    const result = await languageModel.explainSentence({ sentence: "안녕하세요." });

    assert.equal(calledUrl, "https://example.test/v1/chat/completions");
    assert.equal(result.naturalMeaning, "Hello.");
  } finally {
    globalThis.fetch = originalFetch;
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

for (const [label, explanation] of [
  ["missing word", { meaning: "meaning" }],
  ["missing meaning", { word: "word" }],
  ["non-string dictionaryForm", { word: "word", meaning: "meaning", dictionaryForm: 123 }]
]) {
  test(`rejects invalid word explanation structured output: ${label}`, async () => {
    const languageModel = model(async () => contentResponse(explanation));

    await assert.rejects(
      () => languageModel.explainWord({ word: "word", sentence: "안녕하세요." }),
      (error) =>
        error instanceof LanguageModelError &&
        error.code === "INVALID_OUTPUT" &&
        error.message === "The AI provider returned an invalid word explanation."
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

for (const [label, payload, expectedMessage] of [
  ["missing choices", {}, "The AI provider response had no choices."],
  ["empty choices", { choices: [] }, "The AI provider response had no choices."],
  ["null choice", { choices: [null] }, "The AI provider response had no message content."],
  ["empty choice object", { choices: [{}] }, "The AI provider response had no message content."],
  ["missing content", { choices: [{ message: {} }] }, "The AI provider response had no message content."],
  ["non-string content", { choices: [{ message: { content: 123 } }] }, "The AI provider response had no message content."]
]) {
  test(`handles malformed response payload: ${label}`, async () => {
    const languageModel = model(async () => Response.json(payload));

    await assert.rejects(
      () => languageModel.explainSentence({ sentence: "안녕하세요." }),
      (error) =>
        error instanceof LanguageModelError &&
        error.code === "INVALID_OUTPUT" &&
        error.message === expectedMessage
    );
  });
}

test("rejects missing credentials and input before making a request", async () => {
  assert.throws(
    () => new OpenAICompatibleLanguageModel({ apiKey: "", model: "test-model" }),
    (error) => error instanceof LanguageModelError && error.code === "INVALID_INPUT"
  );
  assert.throws(
    () => new OpenAICompatibleLanguageModel({ apiKey: "user-key", model: "" }),
    (error) => error instanceof LanguageModelError && error.code === "INVALID_INPUT"
  );
  const m = new OpenAICompatibleLanguageModel({ apiKey: "user-key", model: "test-model" });
  await assert.rejects(
    () => m.explainSentence({ sentence: "" }),
    (error) => error instanceof LanguageModelError && error.code === "INVALID_INPUT"
  );
  await assert.rejects(
    () => m.explainWord({ word: "", sentence: "지금 가고 있어요." }),
    (error) => error instanceof LanguageModelError && error.code === "INVALID_INPUT"
  );
  await assert.rejects(
    () => m.explainWord({ word: "가고 있어요", sentence: "" }),
    (error) => error instanceof LanguageModelError && error.code === "INVALID_INPUT"
  );
});

function sseStreamResponse(chunks) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    }
  });
  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" }
  });
}

test("streamSentenceExplanation parses OpenAI SSE chunks into explanation events", async () => {
  let request;
  const languageModel = model(async (url, init) => {
    request = { url, init };
    return sseStreamResponse([
      `data: ${JSON.stringify({ choices: [{ delta: { content: '{"type": "meaning-delta", "text": "I am "}\n' } }] })}\n\n`,
      `data: ${JSON.stringify({ choices: [{ delta: { content: '{"type": "meaning-delta", "text": "going now."}\n' } }] })}\n\n`,
      `data: ${JSON.stringify({ choices: [{ delta: { content: '{"type": "phrase", "text": "지금", "meaning": "now"}\n' } }] })}\n\n`,
      "data: [DONE]\n\n"
    ]);
  });

  const events = [];
  for await (const event of languageModel.streamSentenceExplanation({ sentence: "지금 가고 있어요." })) {
    events.push(event);
  }

  assert.equal(request.init.body.includes('"stream":true'), true);
  assert.equal(events.length, 4);
  assert.deepEqual(events[0], { type: "meaning-delta", text: "I am " });
  assert.deepEqual(events[1], { type: "meaning-delta", text: "going now." });
  assert.deepEqual(events[2], { type: "phrase", text: "지금", meaning: "now" });
  assert.equal(events[3].type, "complete");
  assert.equal(events[3].explanation.naturalMeaning, "I am going now.");
});

test("streamSentenceExplanation supports AbortSignal cancellation", async () => {
  const controller = new AbortController();
  const languageModel = model(async (url, init) => {
    return sseStreamResponse([
      `data: ${JSON.stringify({ choices: [{ delta: { content: '{"type": "meaning-delta", "text": "I am "}\n' } }] })}\n\n`
    ]);
  });

  const stream = languageModel.streamSentenceExplanation({ sentence: "지금 가고 있어요." }, { signal: controller.signal });

  // Get first event then abort
  const iterator = stream[Symbol.asyncIterator]();
  const first = await iterator.next();
  assert.deepEqual(first.value, { type: "meaning-delta", text: "I am " });

  controller.abort();

  await assert.rejects(
    () => iterator.next(),
    (error) => error instanceof LanguageModelError && error.code === "REQUEST_FAILED"
  );
});

test("streamWordExplanation parses OpenAI SSE chunks into word events", async () => {
  const languageModel = model(async () => {
    return sseStreamResponse([
      `data: ${JSON.stringify({ choices: [{ delta: { content: '{"type": "meaning-delta", "text": "to go"}\n' } }] })}\n\n`,
      `data: ${JSON.stringify({ choices: [{ delta: { content: '{"type": "dictionaryForm", "text": "가다"}\n' } }] })}\n\n`,
      "data: [DONE]\n\n"
    ]);
  });

  const events = [];
  for await (const event of languageModel.streamWordExplanation({ word: "가고 있어요", sentence: "지금 가고 있어요." })) {
    events.push(event);
  }

  assert.equal(events.length, 2);
  assert.deepEqual(events[0], { type: "meaning-delta", text: "to go" });
  assert.deepEqual(events[1], {
    type: "complete",
    explanation: {
      word: "가고 있어요",
      meaning: "to go",
      dictionaryForm: "가다"
    }
  });
});
