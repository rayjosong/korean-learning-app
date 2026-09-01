import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToString } from "react-dom/server";

import { ExplanationDatabase } from "@korean-learning/storage";
import { saveProfile, saveTaskRoute } from "../lib/ai-settings";
import { AiProviderSettings } from "./ai-provider-settings.tsx";

test("AI settings render named provider profiles and security copy", () => {
  const html = renderToString(<AiProviderSettings />).replaceAll("<!-- -->", "");

  assert.match(html, /OpenAI/);
  assert.match(html, /Gemini/);
  assert.match(html, /Claude/);
  assert.match(html, /Saved settings stay in this browser/);
  assert.match(html, /not a secure secret vault/);
});

test("Profile controls use password type for keys, explicit labels, and advanced settings summary", () => {
  const html = renderToString(<AiProviderSettings />).replaceAll("<!-- -->", "");

  assert.match(html, /type="password"/);
  assert.match(html, /for="ai-api-key"/);
  assert.match(html, /for="ai-model"/);
  assert.match(html, /Advanced settings/);
});

test("Route controls render sentence and word task route selections", () => {
  const html = renderToString(<AiProviderSettings />).replaceAll("<!-- -->", "");

  assert.match(html, /Sentence explanation/);
  assert.match(html, /Word \/ phrase explanation/);
  assert.match(html, /id="route-sentence-provider"/);
  assert.match(html, /id="route-word-provider"/);
});

test("Renders connected provider options in route selectors when database has connected profiles", async () => {
  const db = new ExplanationDatabase("ui-connected-profiles-test");
  await saveProfile(db, {
    provider: "openai",
    apiKey: "sk-openai-key",
    defaultModel: "gpt-4o-mini"
  });
  await saveProfile(db, {
    provider: "gemini",
    apiKey: "AIza-gemini-key",
    defaultModel: "gemini-1.5-flash"
  });
  await saveTaskRoute(db, "sentence", { provider: "openai", model: "gpt-4o-mini" });
  await saveTaskRoute(db, "word", { provider: "gemini", model: "gemini-1.5-flash" });

  const html = renderToString(<AiProviderSettings database={db} />).replaceAll("<!-- -->", "");
  assert.match(html, /connected/);
});
