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
  onRemove: () => {}
};

test("AI settings explain local persistence and expose save/remove actions", () => {
  const html = renderToString(<AiProviderSettings {...props} />).replaceAll("<!-- -->", "");
  assert.match(html, /Saved settings stay in this browser/);
  assert.match(html, /not a secure secret vault/);
  assert.match(html, /Save changes/);
  assert.match(html, />Remove</);
});

test("AI settings disable save when required fields are missing", () => {
  const html = renderToString(
    <AiProviderSettings {...props} settings={{ ...props.settings, apiKey: "" }} />
  );
  assert.match(html, /disabled/);
});
