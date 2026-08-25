import assert from "node:assert/strict";
import test from "node:test";

import { inferLearnerItemKind, learningContextId, markKnown } from "../src/index.ts";

const context = (overrides = {}) => ({
  id: "video-1:segment-3:뭐",
  videoId: "video-1",
  transcriptSegmentId: "segment-3",
  sentence: "뭐 해?",
  startTimeMs: 42000,
  endTimeMs: 44500,
  ...overrides
});

const learningItem = (overrides = {}) => ({
  id: "item-1",
  kind: "word",
  text: "뭐",
  state: "learning",
  recognitionConfidence: 0.3,
  productionConfidence: 0,
  encounters: 2,
  successes: 1,
  failures: 0,
  contextIds: ["video-1:segment-1:뭐"],
  lastSeenAt: "2026-08-25T00:00:00.000Z",
  ...overrides
});

test("marking an unseen form creates a known learner item with its source context", () => {
  const { item, previousItem, isNew } = markKnown({
    text: "뭐",
    context: context(),
    now: "2026-08-26T00:00:00.000Z"
  });

  assert.equal(isNew, true);
  assert.equal(previousItem, undefined);
  assert.equal(item.state, "known");
  assert.equal(item.text, "뭐");
  assert.equal(item.kind, "word");
  assert.equal(item.encounters, 1);
  assert.deepEqual(item.contextIds, ["video-1:segment-3:뭐"]);
  assert.equal(item.lastSeenAt, "2026-08-26T00:00:00.000Z");
  assert.ok(item.id);
});

test("multi-word forms are saved as phrases and keep their surface identity", () => {
  const { item } = markKnown({ text: "가고 있어요", context: context(), now: "now" });

  assert.equal(item.kind, "phrase");
  assert.equal(item.text, "가고 있어요");
});

test("the dictionary form is stored as supporting metadata when available", () => {
  const { item } = markKnown({
    text: "가고 있어요",
    dictionaryForm: "가다",
    context: context(),
    now: "now"
  });

  assert.equal(item.dictionaryForm, "가다");
  assert.equal(item.text, "가고 있어요");
});

test("repeated encounters reuse the learner item and add the new context", () => {
  const newContext = context({ id: "video-2:segment-9:뭐", videoId: "video-2", transcriptSegmentId: "segment-9" });
  const existing = learningItem();

  const { item, previousItem, isNew } = markKnown({
    existing,
    text: "뭐",
    context: newContext,
    now: "2026-08-26T00:00:00.000Z"
  });

  assert.equal(isNew, false);
  assert.equal(item.id, existing.id);
  assert.equal(item.state, "known");
  assert.equal(item.encounters, 3);
  assert.deepEqual(item.contextIds, ["video-1:segment-1:뭐", "video-2:segment-9:뭐"]);
  assert.equal(previousItem, existing);
});

test("a learning item becomes known while its earlier progress is preserved", () => {
  const existing = learningItem();

  const { item } = markKnown({ existing, text: "뭐", context: context(), now: "now" });

  assert.equal(item.state, "known");
  assert.equal(item.recognitionConfidence, 0.3);
  assert.equal(item.successes, 1);
  assert.equal(item.failures, 0);
});

test("re-clicking the same form in the same segment does not duplicate the context", () => {
  const existing = learningItem({ contextIds: ["video-1:segment-3:뭐"] });

  const { item } = markKnown({ existing, text: "뭐", context: context(), now: "now" });

  assert.deepEqual(item.contextIds, ["video-1:segment-3:뭐"]);
  assert.equal(item.encounters, 3);
});

test("context ids are deterministic per form, video, and segment", () => {
  const id = learningContextId({ text: "  뭐 ", videoId: "video-1", transcriptSegmentId: "segment-3" });

  assert.equal(id, "video-1:segment-3:뭐");
  assert.equal(
    id,
    learningContextId({ text: "뭐", videoId: "video-1", transcriptSegmentId: "segment-3" })
  );
  assert.notEqual(
    id,
    learningContextId({ text: "뭐", videoId: "video-1", transcriptSegmentId: "segment-4" })
  );
  assert.notEqual(
    id,
    learningContextId({ text: "해", videoId: "video-1", transcriptSegmentId: "segment-3" })
  );
});

test("word and phrase kinds follow whitespace", () => {
  assert.equal(inferLearnerItemKind("뭐"), "word");
  assert.equal(inferLearnerItemKind("가고 있어요"), "phrase");
  assert.equal(inferLearnerItemKind("  뭐 "), "word");
});
