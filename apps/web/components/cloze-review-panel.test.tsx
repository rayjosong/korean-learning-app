import assert from "node:assert/strict";
import test from "node:test";
import { renderToString } from "react-dom/server";

import { ClozeReviewPanel, maskAnswer } from "./cloze-review-panel.tsx";

test("masks the selected Korean word in its source sentence", () => {
  assert.equal(maskAnswer("저는 김밥을 먹어요.", "김밥"), "저는 ____을 먹어요.");
});

test("cloze review has a bounded empty state", () => {
  const html = renderToString(<ClozeReviewPanel refreshKey={0} sessionLimit={3} onReviewComplete={() => {}} />).replaceAll("<!-- -->", "");
  assert.match(html, /Cloze review/);
  assert.match(html, /Recall the missing word/);
});
