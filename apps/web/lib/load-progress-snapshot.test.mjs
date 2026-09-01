import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";

import { ExplanationDatabase } from "@korean-learning/storage";
import { loadProgressSnapshot } from "./load-progress-snapshot.ts";

test("loadProgressSnapshot loads progress", async () => {
  const database = new ExplanationDatabase("progress-snapshot-test-1");
  const result = await loadProgressSnapshot(database, "2026-08-26T10:00:00.000Z");
  assert.equal(result.status, "ready");
});

test("loadProgressSnapshot catches errors and returns an error status", async () => {
  const database = new ExplanationDatabase("progress-snapshot-test-2");

  database.close();

  const result = await loadProgressSnapshot(database, "2026-08-26T10:00:00.000Z");

  assert.equal(result.status, "error");
  // The error message might be specific to Dexie, like "Database closed"
  assert.equal(typeof result.message, "string");
  assert.ok(result.message.length > 0);
});

test("loadProgressSnapshot returns fallback error message for non-Error throws", async () => {
  const database = new ExplanationDatabase("progress-snapshot-test-3");

  // To trigger a non-Error throw, mocking database.transaction or another method
  // is actually necessary because Dexie always throws Error objects for DB failures.
  const originalTransaction = database.transaction.bind(database);
  database.transaction = async () => {
    throw "Simulated string error";
  };

  const result = await loadProgressSnapshot(database, "2026-08-26T10:00:00.000Z");

  assert.equal(result.status, "error");
  assert.equal(result.message, "Your progress could not be loaded.");

  database.transaction = originalTransaction;
});
