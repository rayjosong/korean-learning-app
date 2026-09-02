import assert from "node:assert/strict";
import test from "node:test";

import { PROVIDER_CATALOG, PROVIDER_KEYS, formatModelReference, parseModelReference } from "../src/provider-catalog.ts";

test("provider catalog keeps stable CLI identities and safe defaults", () => {
  assert.deepEqual(PROVIDER_KEYS, ["openai-compatible", "claude_cli", "codex_cli", "antigravity_cli"]);
  assert.equal(PROVIDER_CATALOG.claude_cli.defaultExecutable, "claude");
  assert.equal(PROVIDER_CATALOG.codex_cli.defaultExecutable, "codex");
  assert.equal(PROVIDER_CATALOG.antigravity_cli.defaultExecutable, "agy");
  assert.equal(PROVIDER_CATALOG.claude_cli.apiKeyRequired, false);
  assert.equal(PROVIDER_CATALOG["openai-compatible"].apiKeyRequired, true);
  assert.equal(PROVIDER_CATALOG.antigravity_cli.runtimeEnabled, false);
});

test("qualified references preserve their selected provider", () => {
  assert.deepEqual(parseModelReference("claude_cli:sonnet"), { provider: "claude_cli", model: "sonnet", reference: "claude_cli:sonnet" });
  assert.equal(formatModelReference("codex_cli", " gpt-5-codex "), "codex_cli:gpt-5-codex");
  assert.throws(() => parseModelReference("sonnet"), /qualified/);
  assert.throws(() => parseModelReference("unknown:model"), /Unknown/);
});
