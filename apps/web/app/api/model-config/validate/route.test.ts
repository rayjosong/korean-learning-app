import assert from "node:assert/strict";
import test from "node:test";

import { validateProviderConnection } from "./route.ts";

test("validateProviderConnection validates OpenAI endpoint with mock fetch", async () => {
  // Successful connection
  const successResult = await validateProviderConnection("openai-compatible", {
    apiKey: "sk-valid-key",
    fetch: async () => new Response(JSON.stringify({ data: [] }), { status: 200 })
  });
  assert.equal(successResult.ok, true);
  assert.equal(successResult.status, "ready");

  // Auth failed (401)
  const authFailedResult = await validateProviderConnection("openai-compatible", {
    apiKey: "sk-invalid-key",
    fetch: async () => new Response(JSON.stringify({ error: "Invalid key" }), { status: 401 })
  });
  assert.equal(authFailedResult.ok, false);
  assert.equal(authFailedResult.status, "auth_failed");

  // Missing API key
  const missingKeyResult = await validateProviderConnection("openai-compatible", {});
  assert.equal(missingKeyResult.ok, false);
  assert.equal(missingKeyResult.status, "needs_setup");

  // Antigravity is disabled
  const antigravityResult = await validateProviderConnection("antigravity_cli", {});
  assert.equal(antigravityResult.ok, false);
  assert.equal(antigravityResult.status, "runtime_disabled");
});
