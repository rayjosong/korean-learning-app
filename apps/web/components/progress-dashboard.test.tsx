import assert from "node:assert/strict";
import test from "node:test";
import { renderToString } from "react-dom/server";

import { ProgressDashboardView } from "./progress-dashboard.tsx";

test("renders honest progress metrics and review denominator", () => {
  const html = renderToString(<ProgressDashboardView state={{ status: "ready", snapshot: {
    knownItems: 8,
    learningItems: 3,
    reviewSuccess: { successful: 8, total: 10, percentage: 80 },
    explanationFrequency: { count: 4, windowDays: 7 },
    contentStudied: 2
  } }} />).replaceAll("<!-- -->", "");
  assert.match(html, /Known items/);
  assert.match(html, /8\/10 successful \(80%\)/);
  assert.match(html, /4 in the last 7 days/);
  assert.match(html, /Content studied/);
});

test("renders an empty review state without false precision", () => {
  const html = renderToString(<ProgressDashboardView state={{ status: "ready", snapshot: {
    knownItems: 0, learningItems: 0,
    reviewSuccess: { successful: 0, total: 0, percentage: null },
    explanationFrequency: { count: 0, windowDays: 7 },
    contentStudied: 0
  } }} />);
  assert.match(html, /No reviews yet/);
});
