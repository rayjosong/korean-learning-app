import assert from "node:assert/strict";
import test from "node:test";
import { renderToString } from "react-dom/server";

import { LearningHistoryPanel } from "./learning-history-panel.tsx";

test("history panel explains its empty local-learning state", () => {
  const html = renderToString(<LearningHistoryPanel refreshKey={0} />).replaceAll("<!-- -->", "");

  assert.match(html, /Learning history/);
  assert.match(html, /stored only on this device/);
});