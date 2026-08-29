import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";

import { ExplanationDatabase, putContentResume, recordStudiedContent } from "@korean-learning/storage";
import { loadHomeSnapshot } from "./home.ts";

test("Home selects a resumable item, due count, and recent content without duplicating resume", async () => {
  const database = new ExplanationDatabase("home-loader-test");
  await putContentResume(database, {
    videoId: "resume",
    sourceUrl: "https://youtu.be/resume",
    title: "Continue this video",
    lastPositionMs: 12500,
    completed: false,
    updatedAt: "2026-08-26T03:00:00.000Z"
  });
  await recordStudiedContent(database, {
    videoId: "resume",
    sourceUrl: "https://youtu.be/resume",
    title: "Continue this video",
    studiedAt: "2026-08-26T03:00:00.000Z"
  });
  await recordStudiedContent(database, {
    videoId: "recent",
    sourceUrl: "https://youtu.be/recent",
    title: "Recent Korean video",
    studiedAt: "2026-08-26T04:00:00.000Z"
  });

  const result = await loadHomeSnapshot(database, "2026-08-26T10:00:00.000Z", [{
    videoId: "recommended",
    sourceUrl: "https://youtu.be/recommended",
    title: "Recommended Korean video"
  }]);

  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;
  assert.equal(result.snapshot.resume?.lastPositionMs, 12500);
  assert.equal(result.snapshot.dueReviewCount, 0);
  assert.deepEqual(result.snapshot.recentContent.map((content) => content.videoId), ["recent"]);
  assert.equal(result.snapshot.recommendedContent?.[0].videoId, "recommended");
});

