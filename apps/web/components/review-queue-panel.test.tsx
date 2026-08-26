import assert from "node:assert/strict";
import test from "node:test";
import { renderToString } from "react-dom/server";

import { ReviewQueuePanel } from "./review-queue-panel.tsx";

test("review queue describes its bounded empty state", () => {
  const html = renderToString(<ReviewQueuePanel refreshKey={0} sessionLimit={3} />).replaceAll("<!-- -->", "");

  assert.match(html, /Review queue/);
  assert.match(html, /Up to 3 due items/);
});
