import assert from "node:assert/strict";
import test from "node:test";
import { renderToString } from "react-dom/server";

import { VideoDifficultyEstimateView } from "./video-difficulty-estimate.tsx";

test("renders personalized and fallback copy with comprehension", () => {
  const html = renderToString(<VideoDifficultyEstimateView state={{
    status: "ready",
    estimate: {
      band: "intermediate",
      likelyComprehension: { min: 35, max: 55 },
      source: "personalized",
      reasonCodes: ["known-coverage"]
    }
  }} />).replaceAll("<!-- -->", "");

  assert.match(html, /Video difficulty: Intermediate/);
  assert.match(html, /35–55%/);
  assert.match(html, /Personalized from your saved learning state/);
  assert.match(html, /full video and transcript/);
});

test("renders starter copy for a new learner", () => {
  const html = renderToString(<VideoDifficultyEstimateView state={{
    status: "ready",
    estimate: {
      band: "challenging",
      likelyComprehension: { min: 20, max: 45 },
      source: "fallback",
      reasonCodes: ["new-learner"]
    }
  }} />);

  assert.match(html, /Starter estimate/);
  assert.match(html, /based on transcript signals only/);
});
