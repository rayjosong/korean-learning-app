import assert from "node:assert/strict";
import test from "node:test";
import { renderToString } from "react-dom/server";

import { ProgressDashboardView } from "./progress-dashboard.tsx";

test("renders recent review recall as the primary learning evidence", () => {
  const html = renderToString(<ProgressDashboardView state={{ status: "ready", snapshot: {
    knownItems: 8,
    learningItems: 3,
    reviewSuccess: { successful: 8, total: 10, percentage: 80, windowDays: 30 },
    explanationFrequency: { count: 4, windowDays: 7 },
    contentStudied: 2,
    revisits: []
  } }} />).replaceAll("<!-- -->", "");

  assert.match(html, /Recent improvement/);
  assert.match(html, /Review recall/);
  assert.match(html, /8 of 10 recalled \(80%\)/);
  assert.match(html, /last 30 days/);
  assert.match(html, /Known phrases and words/);
  assert.match(html, /Explanations in the last 7 days/);
  assert.match(html, /Distinct content studied/);
});

test("renders no-recent-review copy without false precision", () => {
  const html = renderToString(<ProgressDashboardView state={{ status: "ready", snapshot: {
    knownItems: 2, learningItems: 0,
    reviewSuccess: { successful: 0, total: 0, percentage: null, windowDays: 30 },
    explanationFrequency: { count: 1, windowDays: 7 },
    contentStudied: 1,
    revisits: []
  } }} />);

  assert.match(html, /No recent reviews/);
  assert.doesNotMatch(html, /0%/);
});

test("renders one coherent empty state instead of zero metric cards", () => {
  const html = renderToString(<ProgressDashboardView state={{ status: "ready", snapshot: {
    knownItems: 0, learningItems: 0,
    reviewSuccess: { successful: 0, total: 0, percentage: null, windowDays: 30 },
    explanationFrequency: { count: 0, windowDays: 7 },
    contentStudied: 0,
    revisits: []
  } }} />);

  assert.match(html, /Your learning evidence will build here/);
  assert.match(html, /Start learning/);
  assert.doesNotMatch(html, /Known phrases and words/);
});
