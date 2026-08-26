import assert from "node:assert/strict";
import test from "node:test";
import { renderToString } from "react-dom/server";

import { RevisitNoticeView } from "./revisit-notice.tsx";

test("renders an honest insufficient-history state", () => {
  const html = renderToString(<RevisitNoticeView state={{
      status: "ready",
      comparison: {
        status: "insufficient-history",
        current: {
          id: "video-1:visit-1", videoId: "video-1", capturedAt: "2026-08-26T00:00:00.000Z",
          difficultyBand: "intermediate", likelyComprehension: { min: 40, max: 60 },
          comprehensionMidpoint: 50, source: "fallback"
        }
      }
  }} />);
  assert.match(html, /Study history saved/);
  assert.match(html, /compare your comprehension/);
  assert.doesNotMatch(html, /higher than before/);
});
