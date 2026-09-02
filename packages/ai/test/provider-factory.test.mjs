import assert from "node:assert/strict";
import test from "node:test";

import { ClaudeCliLanguageModel, CodexCliLanguageModel, createServerLanguageModel } from "../src/server/index.ts";

test("server factory dispatches qualified CLI references without fallback", () => {
  assert.ok(createServerLanguageModel("claude_cli:sonnet") instanceof ClaudeCliLanguageModel);
  assert.ok(createServerLanguageModel("codex_cli:gpt-5-codex", { codex: { codexHome: "/app/codex" } }) instanceof CodexCliLanguageModel);
  assert.throws(() => createServerLanguageModel("sonnet"), /qualified/);
  assert.throws(() => createServerLanguageModel("openai-compatible:gpt-4o"), /not available/);
  assert.throws(() => createServerLanguageModel("antigravity_cli:model"), /disabled/);
});
