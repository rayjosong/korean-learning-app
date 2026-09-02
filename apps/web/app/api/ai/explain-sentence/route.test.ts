import assert from "node:assert/strict";
import test from "node:test";

import { LanguageModelError } from "@korean-learning/ai";
import { handleSentenceExplanationRequest } from "@/lib/server-ai-routes";

test("sentence route validates and hides provider stderr", async () => {
  const response = await handleSentenceExplanationRequest(new Request("http://test", { method: "POST", body: JSON.stringify({ model: "claude_cli:sonnet", sentence: "안녕하세요" }) }), () => {
    throw new LanguageModelError("AUTHENTICATION_FAILED", "raw stderr secret");
  });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { code: "AUTHENTICATION_FAILED", message: "The selected provider authentication failed." });
});
