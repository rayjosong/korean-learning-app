import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";

import { markKnown } from "@korean-learning/learning-engine";

import {
  deleteLearningContext,
  deleteLearningItem,
  ExplanationDatabase,
  getLearningItemByText,
  putLearningContext,
  putLearningItem
} from "../src/index.ts";

const segment = { id: "segment-3", text: "지금 가고 있어요.", startTimeMs: 42000, endTimeMs: 44500 };

function contextRecord(itemId, overrides = {}) {
  return {
    id: `video-1:${segment.id}:뭐`,
    videoId: "video-1",
    transcriptSegmentId: segment.id,
    sentence: segment.text,
    startTimeMs: segment.startTimeMs,
    endTimeMs: segment.endTimeMs,
    itemId,
    createdAt: "2026-08-26T00:00:00.000Z",
    ...overrides
  };
}

test("learner items persist locally and are found by their surface text", async () => {
  const name = "items-persist-test";
  const { item } = markKnown({ text: "뭐", context: { id: "video-1:segment-3:뭐", videoId: "video-1", transcriptSegmentId: "segment-3", sentence: "뭐 해?", startTimeMs: 0, endTimeMs: 1 }, now: "2026-08-26T00:00:00.000Z" });

  await putLearningItem(new ExplanationDatabase(name), item);
  await putLearningContext(new ExplanationDatabase(name), contextRecord(item.id));

  const reopened = new ExplanationDatabase(name);
  const stored = await getLearningItemByText(reopened, "뭐");
  assert.ok(stored);
  assert.equal(stored.id, item.id);
  assert.equal(stored.state, "known");
  assert.deepEqual(stored.contextIds, ["video-1:segment-3:뭐"]);

  const storedContext = await reopened.learningContexts.get("video-1:segment-3:뭐");
  assert.ok(storedContext);
  assert.equal(storedContext.itemId, item.id);
  assert.equal(storedContext.sentence, "지금 가고 있어요.");
});

test("item lookup normalizes whitespace in the clicked text", async () => {
  const database = new ExplanationDatabase("items-normalize-test");
  const { item } = markKnown({ text: "가고 있어요", context: { id: "video-1:segment-3:가고 있어요", videoId: "video-1", transcriptSegmentId: "segment-3", sentence: "지금 가고 있어요.", startTimeMs: 0, endTimeMs: 1 }, now: "now" });
  await putLearningItem(database, item);

  assert.equal((await getLearningItemByText(database, "  가고 있어요 "))?.id, item.id);
});

test("deleting a learner item removes its contexts but not others", async () => {
  const database = new ExplanationDatabase("items-delete-test");
  const first = markKnown({ text: "뭐", context: { id: "video-1:segment-3:뭐", videoId: "video-1", transcriptSegmentId: "segment-3", sentence: "뭐 해?", startTimeMs: 0, endTimeMs: 1 }, now: "now" }).item;
  const second = markKnown({ text: "해", context: { id: "video-1:segment-3:해", videoId: "video-1", transcriptSegmentId: "segment-3", sentence: "뭐 해?", startTimeMs: 0, endTimeMs: 1 }, now: "now" }).item;

  await putLearningItem(database, first);
  await putLearningItem(database, second);
  await putLearningContext(database, contextRecord(first.id));
  await putLearningContext(database, contextRecord(second.id, { id: "video-1:segment-3:해" }));

  await deleteLearningItem(database, first.id);

  assert.equal(await database.learningItems.count(), 1);
  assert.equal(await database.learningContexts.count(), 1);
  assert.ok(await database.learningContexts.get("video-1:segment-3:해"));
});

test("a single context can be removed for undo", async () => {
  const database = new ExplanationDatabase("items-delete-context-test");
  await putLearningContext(database, contextRecord("item-1"));

  await deleteLearningContext(database, "video-1:segment-3:뭐");

  assert.equal(await database.learningContexts.count(), 0);
});
