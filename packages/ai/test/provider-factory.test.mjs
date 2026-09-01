import assert from "node:assert/strict";
import test from "node:test";

import { AnthropicLanguageModel } from "../src/anthropic.ts";
import { GeminiLanguageModel } from "../src/gemini.ts";
import { LanguageModelError, OpenAICompatibleLanguageModel } from "../src/openai-compatible.ts";
import { createLanguageModel } from "../src/provider-factory.ts";

test("creates OpenAI-compatible language model instance", () => {
  const model = createLanguageModel({
    provider: "openai",
    apiKey: "sk-openai-key",
    model: "gpt-4o-mini"
  });

  assert.ok(model instanceof OpenAICompatibleLanguageModel);
});

test("creates Gemini language model instance", () => {
  const model = createLanguageModel({
    provider: "gemini",
    apiKey: "gemini-key",
    model: "gemini-2.5-flash"
  });

  assert.ok(model instanceof GeminiLanguageModel);
});

test("creates Anthropic language model instance", () => {
  const model = createLanguageModel({
    provider: "anthropic",
    apiKey: "claude-key",
    model: "claude-3-5-sonnet-latest"
  });

  assert.ok(model instanceof AnthropicLanguageModel);
});

test("throws LanguageModelError for unsupported provider", () => {
  assert.throws(
    () => createLanguageModel({
      provider: "unknown-provider",
      apiKey: "key",
      model: "model"
    }),
    (error) =>
      error instanceof LanguageModelError &&
      error.code === "INVALID_INPUT" &&
      error.message === 'Unsupported AI provider "unknown-provider".'
  );
});

test("throws LanguageModelError for missing required options", () => {
  assert.throws(
    () => createLanguageModel({
      provider: "openai",
      apiKey: "",
      model: "gpt-4o-mini"
    }),
    (error) => error instanceof LanguageModelError && error.code === "INVALID_INPUT"
  );
});
