import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";

import { OpenAICompatibleLanguageModel, SENTENCE_EXPLANATION_PROMPT_VERSION } from "@korean-learning/ai";
import { explanationCacheKey, ExplanationDatabase } from "@korean-learning/storage";

import { withExplanationCache } from "./explanation-cache.ts";

const explanations = new Map([
  [
    "안녕하세요.",
    {
      sentence: "안녕하세요.",
      naturalMeaning: "Hello.",
      breakdown: [{ text: "안녕하세요", meaning: "hello" }],
      grammar: []
    }
  ],
  [
    "뭐 해?",
    {
      sentence: "뭐 해?",
      naturalMeaning: "What are you doing?",
      breakdown: [
        { text: "뭐", meaning: "what (contraction of 무엇)" },
        { text: "해", meaning: "doing" }
      ],
      grammar: [{ form: "-아/어?", explanation: "Casual question ending." }],
      nuance: "Casual tone.",
      speechLevel: "해체 (casual/반말)"
    }
  ]
]);

function countingModel() {
  let calls = 0;
  const model = new OpenAICompatibleLanguageModel({
    apiKey: "user-secret-key",
    model: "test-model",
    fetch: async (_url, init) => {
      calls += 1;
      const sentence = JSON.parse(String(init.body)).messages[1].content.split("Sentence: ")[1];
      return Response.json({
        choices: [{ message: { content: JSON.stringify(explanations.get(sentence)) } }]
      });
    }
  });
  return {
    model,
    calls: () => calls
  };
}

test("a cached explanation avoids a repeat model call", async () => {
  const { model, calls } = countingModel();
  const cached = withExplanationCache({ model, database: new ExplanationDatabase("avoid-repeat-test") });

  const first = await cached.explainSentence({ sentence: "안녕하세요." });
  const second = await cached.explainSentence({ sentence: "안녕하세요." });

  assert.deepEqual(first, explanations.get("안녕하세요."));
  assert.deepEqual(second, explanations.get("안녕하세요."));
  assert.equal(calls(), 1);
});

test("a refresh (new database instance) still serves from the persisted cache", async () => {
  const name = "refresh-persistence-test";
  const { model, calls } = countingModel();

  await withExplanationCache({ model, database: new ExplanationDatabase(name) }).explainSentence({
    sentence: "안녕하세요."
  });

  const afterRefresh = withExplanationCache({ model, database: new ExplanationDatabase(name) });
  const result = await afterRefresh.explainSentence({ sentence: "안녕하세요." });

  assert.deepEqual(result, explanations.get("안녕하세요."));
  assert.equal(calls(), 1);
});

test("different sentences and cleared caches call the model again", async () => {
  const { model, calls } = countingModel();
  const database = new ExplanationDatabase("clear-behavior-test");
  const cached = withExplanationCache({ model, database });

  await cached.explainSentence({ sentence: "안녕하세요." });
  await cached.explainSentence({ sentence: "뭐 해?" });
  assert.equal(calls(), 2, "different sentences are separate cache entries");

  await database.explanations.clear();

  await cached.explainSentence({ sentence: "뭐 해?" });
  assert.equal(calls(), 3, "cleared cache falls back to the model");
});

test("cached records carry prompt-version and model metadata but no credentials", async () => {
  const { model } = countingModel();
  const database = new ExplanationDatabase("metadata-test");

  await withExplanationCache({
    model,
    database,
    provider: "openai-compatible",
    modelName: "test-model"
  }).explainSentence({ sentence: "안녕하세요." });

  const stored = await database.explanations.get(
    explanationCacheKey(SENTENCE_EXPLANATION_PROMPT_VERSION, "안녕하세요.", "openai-compatible", "test-model")
  );

  assert.ok(stored);
  assert.equal(stored.promptVersion, SENTENCE_EXPLANATION_PROMPT_VERSION);
  assert.equal(stored.provider, "openai-compatible");
  assert.equal(stored.model, "test-model");
  assert.ok(!JSON.stringify(stored).includes("user-secret-key"), "API key must never be stored");
});

test("changing a model produces distinct cache keys and cannot reuse entries", async () => {
  const { model, calls } = countingModel();
  const database = new ExplanationDatabase("model-route-cache-test");

  const modelA = withExplanationCache({
    model,
    database,
    provider: "openai",
    modelName: "gpt-4o-mini"
  });

  const modelB = withExplanationCache({
    model,
    database,
    provider: "openai",
    modelName: "gpt-4o"
  });

  await modelA.explainSentence({ sentence: "안녕하세요." });
  assert.equal(calls(), 1);

  await modelB.explainSentence({ sentence: "안녕하세요." });
  assert.equal(calls(), 2, "different model route must call the provider instead of reusing cache");
});
