import assert from "node:assert/strict";
import test from "node:test";

import { ServerCliLanguageModel, ServerLanguageModelClient } from "./server-cli-language-model.ts";

const explanation = { sentence: "안녕하세요", naturalMeaning: "Hello.", breakdown: [], grammar: [] };

test("server CLI model posts a qualified reference and validates sentence responses", async () => {
  let request: Parameters<typeof fetch> | undefined;
  const model = new ServerCliLanguageModel({ model: "claude_cli:sonnet", fetch: async (...args) => {
    request = args;
    return new Response(JSON.stringify(explanation));
  } });
  assert.deepEqual(await model.explainSentence({ sentence: "안녕하세요", context: "Greeting" }), explanation);
  assert.ok(request);
  assert.equal(request[0], "/api/ai/explain-sentence");
  assert.deepEqual(JSON.parse(String(request[1]?.body)), { model: "claude_cli:sonnet", sentence: "안녕하세요", context: "Greeting" });
});

test("server CLI model translates stable errors without exposing raw output", async () => {
  const model = new ServerCliLanguageModel({ model: "codex_cli:gpt-5-codex", fetch: async () => new Response(JSON.stringify({ code: "AUTHENTICATION_FAILED", message: "ignored stderr" }), { status: 401 }) });
  await assert.rejects(model.explainWord({ word: "안녕", sentence: "안녕하세요" }), (error: unknown) => error instanceof Error && "code" in error && error.code === "AUTHENTICATION_FAILED" && error.message === "ignored stderr");
});

test("server language model client includes transient credentials for OpenAI requests", async () => {
  let request: Parameters<typeof fetch> | undefined;
  const client = new ServerLanguageModelClient({
    model: "openai-compatible:gpt-4o-mini",
    apiKey: "sk-transient-key",
    baseUrl: "https://api.openai.com/v1",
    fetch: async (...args) => {
      request = args;
      return new Response(JSON.stringify(explanation));
    }
  });

  await client.explainSentence({ sentence: "안녕하세요" });
  assert.ok(request);
  assert.deepEqual(JSON.parse(String(request[1]?.body)), {
    model: "openai-compatible:gpt-4o-mini",
    sentence: "안녕하세요",
    apiKey: "sk-transient-key",
    baseUrl: "https://api.openai.com/v1"
  });
});
