import assert from "node:assert/strict";
import test from "node:test";
import { renderToString } from "react-dom/server";

import { DifficultContentWarning } from "./difficult-content-warning.tsx";

test("warning explains the tradeoff and keeps a continue action available", () => {
  const html = renderToString(<DifficultContentWarning
    estimate={{
      band: "challenging",
      likelyComprehension: { min: 15, max: 35 },
      source: "fallback",
      reasonCodes: ["new-learner"]
    }}
    onContinue={() => {}}
    onDismiss={() => {}}
  />).replaceAll("<!-- -->", "");

  assert.match(html, /role="alert"/);
  assert.match(html, /may take a little more effort/);
  assert.match(html, /15–35%/);
  assert.match(html, /shorter session/);
  assert.match(html, /Continue with this video/);
  assert.match(html, /Dismiss for this video/);
  assert.doesNotMatch(html, /not ready/);
});

test("warning identifies an estimate derived from learner state as personalized", () => {
  const html = renderToString(<DifficultContentWarning
    estimate={{
      band: "challenging",
      likelyComprehension: { min: 15, max: 35 },
      source: "personalized",
      reasonCodes: ["known-coverage"]
    }}
    onContinue={() => {}}
    onDismiss={() => {}}
  />).replaceAll("<!-- -->", "");

  assert.match(html, /The personalized estimate suggests/);
  assert.doesNotMatch(html, /The starter estimate suggests/);
});
