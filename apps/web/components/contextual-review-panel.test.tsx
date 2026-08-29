import assert from "node:assert/strict";
import test from "node:test";
import { renderToString } from "react-dom/server";

import { ContextualReviewPanel } from "./contextual-review-panel.tsx";

test("contextual review declares a Korean-first recall surface", () => {
  const html = renderToString(<ContextualReviewPanel refreshKey={0} onReviewComplete={() => {}} />).replaceAll("<!-- -->", "");
  assert.match(html, /Contextual review/);
  assert.match(html, /Recall from the original video/);
});
