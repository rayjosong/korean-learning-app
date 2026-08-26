import assert from "node:assert/strict";
import test from "node:test";
import { renderToString } from "react-dom/server";

import { LearnerProfileView } from "./learner-profile-panel.tsx";

test("learner profile renders a useful empty state", () => {
  const html = renderToString(
    <LearnerProfileView state={{
      status: "ready",
      profile: {
        knownCount: 0,
        learningCount: 0,
        recognitionConfidence: { count: 0, average: null },
        productionConfidence: { count: 0, average: null },
        grammar: [],
        speechLevels: []
      }
    }} />
  );

  assert.match(html, /profile will appear/);
  assert.match(html, /stays on this device/);
});

test("learner profile renders vocabulary, confidence, grammar, and speech exposure", () => {
  const html = renderToString(
    <LearnerProfileView state={{
      status: "ready",
      profile: {
        knownCount: 3,
        learningCount: 2,
        recognitionConfidence: { count: 5, average: 64 },
        productionConfidence: { count: 5, average: 42 },
        grammar: [{ form: "-고 싶다", count: 2 }],
        speechLevels: [{ level: "해요체", count: 3, familiarity: "familiar" }]
      }
    }} />
  ).replaceAll("<!-- -->", "");

  assert.match(html, /Known/);
  assert.match(html, />3</);
  assert.match(html, /Learning/);
  assert.match(html, />2</);
  assert.match(html, /64% average/);
  assert.match(html, /42% average/);
  assert.match(html, /-고 싶다/);
  assert.match(html, /해요체/);
  assert.match(html, /exposure, not mastery/);
});

test("learner profile renders controlled loading and error states", () => {
  assert.match(renderToString(<LearnerProfileView state={{ status: "loading" }} />), /Building your local profile/);
  assert.match(
    renderToString(<LearnerProfileView state={{ status: "error", message: "IndexedDB unavailable" }} />),
    /Learner profile unavailable: IndexedDB unavailable/
  );
});
