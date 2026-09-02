import assert from "node:assert/strict";
import test from "node:test";

import {
  PROVIDER_CATALOG,
  PROVIDER_KEYS,
  formatModelReference,
  formatProviderModelLabel,
  getProviderDisplayName,
  isProviderSelectable,
  parseModelReference
} from "../src/provider-catalog.ts";

test("provider catalog keeps stable CLI identities and safe defaults", () => {
  assert.deepEqual(PROVIDER_KEYS, ["openai-compatible", "claude_cli", "codex_cli", "antigravity_cli"]);
  assert.equal(PROVIDER_CATALOG.claude_cli.defaultExecutable, "claude");
  assert.equal(PROVIDER_CATALOG.codex_cli.defaultExecutable, "codex");
  assert.equal(PROVIDER_CATALOG.antigravity_cli.defaultExecutable, "agy");
  assert.equal(PROVIDER_CATALOG.claude_cli.apiKeyRequired, false);
  assert.equal(PROVIDER_CATALOG["openai-compatible"].apiKeyRequired, true);
  assert.equal(PROVIDER_CATALOG.claude_cli.selectable, true);
  assert.equal(PROVIDER_CATALOG.antigravity_cli.selectable, false);
  assert.equal(PROVIDER_CATALOG.antigravity_cli.runtimeEnabled, false);
});

test("qualified references preserve their selected provider", () => {
  assert.deepEqual(parseModelReference("claude_cli:sonnet"), { provider: "claude_cli", model: "sonnet", reference: "claude_cli:sonnet" });
  assert.equal(formatModelReference("codex_cli", " gpt-5-codex "), "codex_cli:gpt-5-codex");
  assert.throws(() => parseModelReference("sonnet"), /qualified/);
  assert.throws(() => parseModelReference("unknown:model"), /Unknown/);
});

test("provider presentation helpers format human-readable names", () => {
  assert.equal(getProviderDisplayName("openai-compatible"), "OpenAI");
  assert.equal(getProviderDisplayName("openai-compatible", { hasCustomBaseUrl: true }), "OpenAI-compatible");
  assert.equal(getProviderDisplayName("claude_cli"), "Claude Code");
  assert.equal(getProviderDisplayName("codex_cli"), "Codex");
  assert.equal(getProviderDisplayName("antigravity_cli"), "Antigravity");

  assert.equal(formatProviderModelLabel("openai-compatible", "gpt-4o-mini"), "gpt-4o-mini · OpenAI");
  assert.equal(formatProviderModelLabel("openai-compatible", "mistral", { hasCustomBaseUrl: true }), "mistral · OpenAI-compatible");
  assert.equal(formatProviderModelLabel("claude_cli", "sonnet"), "sonnet · Claude Code");

  assert.equal(isProviderSelectable("openai-compatible"), true);
  assert.equal(isProviderSelectable("claude_cli"), true);
  assert.equal(isProviderSelectable("codex_cli"), true);
  assert.equal(isProviderSelectable("antigravity_cli"), false);
});
