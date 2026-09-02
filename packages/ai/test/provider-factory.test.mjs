import assert from "node:assert/strict";
import test from "node:test";

import { OpenAICompatibleLanguageModel } from "../src/openai-compatible.ts";
import { ClaudeCliLanguageModel, CodexCliLanguageModel, createServerLanguageModel } from "../src/server/index.ts";

test("server factory dispatches qualified references without fallback", () => {
  assert.ok(createServerLanguageModel("claude_cli:sonnet") instanceof ClaudeCliLanguageModel);
  assert.ok(createServerLanguageModel("codex_cli:gpt-5-codex", { codex: { codexHome: "/app/codex" } }) instanceof CodexCliLanguageModel);
  assert.throws(() => createServerLanguageModel("sonnet"), /qualified/);
  assert.throws(() => createServerLanguageModel("antigravity_cli:model"), /disabled/);
});

test("server factory constructs OpenAI-compatible from transient credentials", () => {
  const model = createServerLanguageModel("openai-compatible:gpt-4o-mini", {
    credentials: { apiKey: "sk-test", baseUrl: "https://api.openai.com/v1" }
  });
  assert.ok(model instanceof OpenAICompatibleLanguageModel);

  assert.throws(
    () => createServerLanguageModel("openai-compatible:gpt-4o-mini"),
    /API key is required/
  );
});

test("server factory respects safe-by-default CLI execution gate", () => {
  assert.throws(
    () => createServerLanguageModel("claude_cli:sonnet", { allowLocalCli: false }),
    /disabled on this server/
  );
});
