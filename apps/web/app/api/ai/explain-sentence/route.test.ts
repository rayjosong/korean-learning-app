import assert from "node:assert/strict";
import test from "node:test";

import { LanguageModelError, type LanguageModel, type SentenceExplanation } from "@korean-learning/ai";
import { handleSentenceExplanationRequest } from "@/lib/server-ai-routes";

test("sentence route validates and hides provider stderr", async () => {
  const response = await handleSentenceExplanationRequest(
    new Request("http://test", {
      method: "POST",
      body: JSON.stringify({ model: "claude_cli:sonnet", sentence: "안녕하세요" })
    }),
    () => {
      throw new LanguageModelError("AUTHENTICATION_FAILED", "raw stderr secret");
    }
  );
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    code: "AUTHENTICATION_FAILED",
    message: "The selected provider authentication failed."
  });
});

test("sentence route passes transient OpenAI credentials without leaking them in response or errors", async () => {
  let receivedCredentials: { apiKey?: string; baseUrl?: string } | undefined;
  const mockExplanation: SentenceExplanation = {
    sentence: "안녕하세요.",
    naturalMeaning: "Hello.",
    breakdown: [{ text: "안녕하세요", meaning: "hello" }],
    grammar: []
  };

  const fakeModel: LanguageModel = {
    explainSentence: async () => mockExplanation,
    explainWord: async () => ({ word: "test", meaning: "test", dictionaryForm: "test" })
  };

  const response = await handleSentenceExplanationRequest(
    new Request("http://test", {
      method: "POST",
      body: JSON.stringify({
        model: "openai-compatible:gpt-4o-mini",
        sentence: "안녕하세요.",
        apiKey: "sk-super-secret-key-12345",
        baseUrl: "https://api.openai.com/v1"
      })
    }),
    (_ref, options) => {
      receivedCredentials = options?.credentials;
      return fakeModel;
    }
  );

  assert.equal(response.status, 200);
  assert.deepEqual(receivedCredentials, {
    apiKey: "sk-super-secret-key-12345",
    baseUrl: "https://api.openai.com/v1"
  });

  const responseText = JSON.stringify(await response.json());
  assert.equal(responseText.includes("sk-super-secret-key-12345"), false);
});
