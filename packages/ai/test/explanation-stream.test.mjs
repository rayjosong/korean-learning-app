import assert from "node:assert/strict";
import test from "node:test";

import { LanguageModelError } from "../src/openai-compatible.ts";
import {
  parseLines,
  processSentenceStream,
  processWordStream
} from "../src/explanation-stream.ts";

async function collect(iterable) {
  const result = [];
  for await (const item of iterable) {
    result.push(item);
  }
  return result;
}

async function* asyncChunks(chunks) {
  for (const chunk of chunks) {
    yield chunk;
  }
}

test("parseLines splits stream into line-delimited JSON lines", async () => {
  const chunks = asyncChunks(['{"type":"meaning', '-delta","text":"Hello"}\n{"type":"ph', 'rase","text":"안녕","meaning":"hi"}\n']);
  const lines = await collect(parseLines(chunks));
  assert.deepEqual(lines, [
    '{"type":"meaning-delta","text":"Hello"}',
    '{"type":"phrase","text":"안녕","meaning":"hi"}'
  ]);
});

test("processSentenceStream yields ordered events and complete payload on valid stream", async () => {
  const streamData = [
    '{"type": "meaning-delta", "text": "I am "}\n',
    '{"type": "meaning-delta", "text": "going now."}\n',
    '{"type": "phrase", "text": "지금", "meaning": "now", "role": "adverb"}\n',
    '{"type": "phrase", "text": "가고 있어요", "meaning": "am going"}\n',
    '{"type": "grammar", "title": "-고 있다", "explanation": "Progressive form."}\n',
    '{"type": "nuance", "text": "Polite tone."}\n',
    '{"type": "speechLevel", "text": "해요체 (polite)"}\n'
  ];

  const events = await collect(processSentenceStream("지금 가고 있어요.", asyncChunks(streamData)));

  assert.equal(events.length, 7);
  assert.deepEqual(events[0], { type: "meaning-delta", text: "I am " });
  assert.deepEqual(events[1], { type: "meaning-delta", text: "going now." });
  assert.deepEqual(events[2], { type: "phrase", text: "지금", meaning: "now", role: "adverb" });
  assert.deepEqual(events[3], { type: "phrase", text: "가고 있어요", meaning: "am going" });
  assert.deepEqual(events[4], { type: "grammar", title: "-고 있다", explanation: "Progressive form." });
  assert.deepEqual(events[5], { type: "nuance", text: "Polite tone." });
  assert.deepEqual(events[6], {
    type: "complete",
    explanation: {
      sentence: "지금 가고 있어요.",
      naturalMeaning: "I am going now.",
      breakdown: [
        { text: "지금", meaning: "now", role: "adverb" },
        { text: "가고 있어요", meaning: "am going" }
      ],
      grammar: [{ form: "-고 있다", explanation: "Progressive form." }],
      nuance: "Polite tone.",
      speechLevel: "해요체 (polite)"
    }
  });
});

test("processWordStream yields ordered events and complete payload on valid stream", async () => {
  const streamData = [
    '{"type": "meaning-delta", "text": "to "}\n',
    '{"type": "meaning-delta", "text": "go"}\n',
    '{"type": "dictionaryForm", "text": "가다"}\n',
    '{"type": "nuance", "text": "Plain verb."}\n'
  ];

  const events = await collect(processWordStream("가고 있어요", asyncChunks(streamData)));

  assert.equal(events.length, 4);
  assert.deepEqual(events[0], { type: "meaning-delta", text: "to " });
  assert.deepEqual(events[1], { type: "meaning-delta", text: "go" });
  assert.deepEqual(events[2], { type: "nuance", text: "Plain verb." });
  assert.deepEqual(events[3], {
    type: "complete",
    explanation: {
      word: "가고 있어요",
      meaning: "to go",
      dictionaryForm: "가다",
      nuance: "Plain verb."
    }
  });
});

test("fails with INVALID_OUTPUT on malformed JSON record line", async () => {
  const streamData = ['{"type": "meaning-delta", "text": "Hello"}\nnot-json\n'];

  await assert.rejects(
    async () => collect(processSentenceStream("안녕하세요.", asyncChunks(streamData))),
    (error) =>
      error instanceof LanguageModelError &&
      error.code === "INVALID_OUTPUT" &&
      error.message === "The AI provider returned malformed stream JSON line."
  );
});

test("fails with INVALID_OUTPUT on unexpected/unknown event type", async () => {
  const streamData = ['{"type": "unknown-event", "foo": "bar"}\n'];

  await assert.rejects(
    async () => collect(processSentenceStream("안녕하세요.", asyncChunks(streamData))),
    (error) =>
      error instanceof LanguageModelError &&
      error.code === "INVALID_OUTPUT" &&
      error.message === "Unknown stream event type: unknown-event"
  );
});

test("fails with INVALID_OUTPUT when required schema fields are missing at stream completion", async () => {
  // Empty stream has empty naturalMeaning, breakdown, etc. which fails Zod validation
  const streamData = ['{"type": "nuance", "text": "some nuance"}\n'];

  await assert.rejects(
    async () => collect(processSentenceStream("안녕하세요.", asyncChunks(streamData))),
    (error) =>
      error instanceof LanguageModelError &&
      error.code === "INVALID_OUTPUT" &&
      error.message.includes("stream resulted in an")
  );
});

test("handles cancellation via AbortSignal in stream processor", async () => {
  const controller = new AbortController();
  controller.abort();

  const streamData = ['{"type": "meaning-delta", "text": "Hi"}\n'];

  await assert.rejects(
    async () => collect(processSentenceStream("안녕하세요.", asyncChunks(streamData), { signal: controller.signal })),
    (error) =>
      error instanceof LanguageModelError &&
      error.code === "REQUEST_FAILED" &&
      error.message === "The request was cancelled."
  );
});
