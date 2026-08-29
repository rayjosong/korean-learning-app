import assert from "node:assert/strict";
import test from "node:test";

import { selectRecommendation } from "../src/recommendation.ts";

const now = "2026-08-29T00:00:00.000Z";

function base(overrides = {}) {
  return {
    now,
    dueItems: [],
    recentReviews: [],
    studiedContent: [],
    progressSnapshots: [],
    dismissals: [],
    ...overrides
  };
}

test("prioritizes due review and explains repeated production failures", () => {
  const result = selectRecommendation(base({
    dueItems: [{ id: "due", nextReviewAt: "2026-08-28T00:00:00.000Z" }],
    recentReviews: [
      { mode: "production", outcome: "failure", reviewedAt: "2026-08-20T00:00:00.000Z" },
      { mode: "production", outcome: "failure", reviewedAt: "2026-08-21T00:00:00.000Z" },
      { mode: "recognition", outcome: "failure", reviewedAt: "2026-08-22T00:00:00.000Z" }
    ]
  }));

  assert.deepEqual(result?.action, { type: "review" });
  assert.deepEqual(result?.reason, {
    code: "recent-review-weakness",
    mode: "production",
    failures: 2,
    windowDays: 14
  });
});

test("uses production as the deterministic tie-breaker", () => {
  const result = selectRecommendation(base({
    dueItems: [{ id: "due", nextReviewAt: "2026-08-29T00:00:00.000Z" }],
    recentReviews: [
      { mode: "production", outcome: "failure", reviewedAt: "2026-08-20T00:00:00.000Z" },
      { mode: "recognition", outcome: "failure", reviewedAt: "2026-08-21T00:00:00.000Z" },
      { mode: "recognition", outcome: "failure", reviewedAt: "2026-08-22T00:00:00.000Z" }
    ]
  }));

  assert.equal(result?.reason.code, "recent-review-weakness");
  assert.equal(result?.reason.mode, "recognition");
});

test("excludes the exact active dismissal and promotes the next candidate", () => {
  const due = selectRecommendation(base({
    dueItems: [{ id: "due", nextReviewAt: "2026-08-28T00:00:00.000Z" }],
    resume: {
      videoId: "video",
      sourceUrl: "https://youtu.be/video",
      lastPositionMs: 5000,
      completed: false,
      updatedAt: now
    }
  }));
  assert.equal(due?.action.type, "review");

  const next = selectRecommendation(base({
    dueItems: [{ id: "due", nextReviewAt: "2026-08-28T00:00:00.000Z" }],
    resume: {
      videoId: "video",
      sourceUrl: "https://youtu.be/video",
      lastPositionMs: 5000,
      completed: false,
      updatedAt: now
    },
    dismissals: [{ fingerprint: due.fingerprint, dismissedUntil: "2026-09-05T00:00:00.000Z" }]
  }));
  assert.deepEqual(next?.action, {
    type: "resume",
    videoId: "video",
    sourceUrl: "https://youtu.be/video",
    positionMs: 5000
  });
});

test("respects the inclusive review and revisit boundaries and honest fallback", () => {
  const result = selectRecommendation(base({
    studiedContent: [{
      videoId: "old",
      sourceUrl: "https://youtu.be/old",
      title: "Old video",
      lastStudiedAt: "2026-08-15T00:00:00.000Z"
    }],
    progressSnapshots: [{
      videoId: "old",
      capturedAt: "2026-08-15T00:00:00.000Z"
    }]
  }));

  assert.equal(result?.action.type, "revisit");
  assert.equal(result?.reason.code, "revisit-ready");

  const fallback = selectRecommendation(base({ activityRevision: "revision-1" }));
  assert.deepEqual(fallback?.action, { type: "start-new" });
  assert.equal(fallback?.fingerprint, "start-new:v1:revision-1");
});

test("ignores invalid resume, future reviews, and old review failures", () => {
  const result = selectRecommendation(base({
    dueItems: [{ id: "future", nextReviewAt: "2026-08-30T00:00:00.000Z" }],
    resume: {
      videoId: "invalid",
      sourceUrl: "",
      lastPositionMs: 0,
      completed: false,
      updatedAt: now
    },
    recentReviews: [
      { mode: "production", outcome: "failure", reviewedAt: "2026-07-01T00:00:00.000Z" }
    ]
  }));

  assert.deepEqual(result?.action, { type: "start-new" });
});

test("expired dismissals no longer suppress a recommendation", () => {
  const result = selectRecommendation(base({
    activityRevision: "same",
    dismissals: [{ fingerprint: "start-new:v1:same", dismissedUntil: now }]
  }));

  assert.deepEqual(result?.action, { type: "start-new" });
});
