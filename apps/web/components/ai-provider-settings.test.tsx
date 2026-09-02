import assert from "node:assert/strict";
import test from "node:test";
import { renderToString } from "react-dom/server";

import { AiProviderSettings } from "./ai-provider-settings.tsx";

const props = {
  settings: { apiKey: "sk-test", model: "test-model", baseUrl: "" },
  ready: true,
  saved: true,
  onChange: () => {},
  onSave: () => {},
  onRemove: () => {},
  providerSettings: [
    { id: "openai-compatible" as const, provider: "openai-compatible" as const, enabled: true, model: "gpt-4o-mini", apiKey: "sk-test", updatedAt: "now" },
    { id: "claude_cli" as const, provider: "claude_cli" as const, enabled: true, model: "sonnet", updatedAt: "now" }
  ],
  providerStatus: {
    catalog: [],
    detected_clis: { claude_cli: true, codex_cli: false, antigravity_cli: true },
    detected_cli_paths: { claude_cli: "/bin/claude", codex_cli: "", antigravity_cli: "/bin/agy" },
    probes: {
      claude_cli: { status: "ready" as const, version: "1.0.0" },
      codex_cli: { status: "not_installed" as const },
      antigravity_cli: { status: "runtime_disabled" as const }
    }
  },
  selectedModel: "openai-compatible:gpt-4o-mini"
};

test("AI settings explain local persistence and expose save/remove actions", () => {
  const html = renderToString(<AiProviderSettings {...props} />).replaceAll("<!-- -->", "");
  assert.match(html, /Active model/);
  assert.match(html, /Providers/);
  assert.match(html, /Saved settings stay in this browser/);
  assert.match(html, /not a secure secret vault/);
  assert.match(html, /Claude Code/);
  assert.match(html, /Codex/);
  assert.match(html, /Antigravity/);
});

test("AI settings disable save when required fields are missing", () => {
  const html = renderToString(
    <AiProviderSettings {...props} settings={{ ...props.settings, apiKey: "" }} />
  );
  assert.match(html, /Needs setup/);
});
