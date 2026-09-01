import test from "node:test";
import assert from "node:assert/strict";
import "fake-indexeddb/auto";
import { ExplanationDatabase } from "../src/index.ts";
import { importLearnerData } from "../src/import.ts";

test("successfully imports valid learner data", async () => {
  const db = new ExplanationDatabase("test-import-valid-db");
  await db.delete();
  await db.open();

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    learningItems: [{ id: "item1", kind: "word", text: "word", state: "learning", recognitionConfidence: 0, productionConfidence: 0, encounters: 1, successes: 0, failures: 0, contextIds: [] }],
    learningContexts: [],
    reviewRecords: [],
    studiedContent: [],
    contentProgressSnapshots: [],
    contentResume: [],
    explanations: [],
    wordExplanations: []
  };

  await importLearnerData(db, payload);

  const items = await db.learningItems.toArray();
  assert.equal(items.length, 1);
  assert.equal(items[0].id, "item1");

  db.close();
});

test("safely rejects corrupt learner data (missing fields)", async () => {
  const db = new ExplanationDatabase("test-import-corrupt-db");
  await db.delete();
  await db.open();

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    learningItems: [{ id: "item2" }], // Missing required fields
    learningContexts: [],
    reviewRecords: [],
    studiedContent: [],
    contentProgressSnapshots: [],
    contentResume: [],
    explanations: [],
    wordExplanations: []
  };

  await assert.rejects(importLearnerData(db, payload), /Corrupt or invalid learner data file/);

  db.close();
});

test("safely rejects wrong schema version", async () => {
  const db = new ExplanationDatabase("test-import-version-db");
  await db.delete();
  await db.open();

  const payload = {
    version: 2, // Unsupported version
    exportedAt: new Date().toISOString(),
    learningItems: [],
    learningContexts: [],
    reviewRecords: [],
    studiedContent: [],
    contentProgressSnapshots: [],
    contentResume: [],
    explanations: [],
    wordExplanations: []
  };

  await assert.rejects(importLearnerData(db, payload), /Corrupt or invalid learner data file/);

  db.close();
});

test("merges/upserts existing data based on primary key", async () => {
  const db = new ExplanationDatabase("test-import-merge-db");
  await db.delete();
  await db.open();

  await db.learningItems.put({ id: "item-existing", kind: "word", text: "word", state: "unknown", recognitionConfidence: 0, productionConfidence: 0, encounters: 1, successes: 0, failures: 0, contextIds: [] });

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    learningItems: [{ id: "item-existing", kind: "word", text: "word", state: "known", recognitionConfidence: 10, productionConfidence: 0, encounters: 2, successes: 1, failures: 0, contextIds: [] }],
    learningContexts: [],
    reviewRecords: [],
    studiedContent: [],
    contentProgressSnapshots: [],
    contentResume: [],
    explanations: [],
    wordExplanations: []
  };

  await importLearnerData(db, payload);

  const items = await db.learningItems.toArray();
  assert.equal(items.length, 1);
  assert.equal(items[0].id, "item-existing");
  assert.equal(items[0].state, "known"); // Status should have been updated from 'unknown' to 'known'
  assert.equal(items[0].encounters, 2);

  db.close();
});
