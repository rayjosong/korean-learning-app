import assert from "node:assert/strict";
import test from "node:test";
import { renderToString } from "react-dom/server";

import { availableModels, ModelPicker } from "./model-picker.tsx";

test("model picker excludes disabled, failed, and Antigravity providers", () => {
  const models = availableModels([
    { id: "openai-compatible", provider: "openai-compatible", enabled: true, model: "gpt", apiKey: "key", updatedAt: "now" },
    { id: "claude_cli", provider: "claude_cli", enabled: true, model: "sonnet", updatedAt: "now" },
    { id: "codex_cli", provider: "codex_cli", enabled: true, model: "codex", updatedAt: "now" },
    { id: "antigravity_cli", provider: "antigravity_cli", enabled: true, model: "x", updatedAt: "now" }
  ], { catalog: [], detected_clis: { claude_cli: true, codex_cli: false, antigravity_cli: true }, detected_cli_paths: { claude_cli: "/claude", codex_cli: "", antigravity_cli: "/agy" }, probes: { claude_cli: { status: "ready" }, codex_cli: { status: "unreachable" }, antigravity_cli: { status: "runtime_disabled" } } });
  assert.deepEqual(models.map((model) => model.reference), ["openai-compatible:gpt", "claude_cli:sonnet"]);
  assert.equal(models[0].label, "gpt · OpenAI");
  assert.equal(models[1].label, "sonnet · Claude Code");
});

test("model picker displays custom base URL as OpenAI-compatible", () => {
  const models = availableModels([
    { id: "openai-compatible", provider: "openai-compatible", enabled: true, model: "mistral", baseUrl: "https://custom.ai", apiKey: "key", updatedAt: "now" }
  ]);
  assert.equal(models[0].label, "mistral · OpenAI-compatible");
});

test("model picker renders connect link when no providers ready", () => {
  const html = renderToString(<ModelPicker settings={[]} onChange={() => {}} />);
  assert.match(html, /No AI providers ready/);
  assert.match(html, /Connect a provider/);
});
