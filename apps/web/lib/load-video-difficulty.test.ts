import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";

import { loadVideoDifficulty } from "./load-video-difficulty";
import type { ExplanationDatabase } from "@korean-learning/storage";

test("loadVideoDifficulty returns ready status on successful load", async () => {
  const mockDatabase = {
    learningItems: {
      toArray: async () => [{ id: "item1", term: "hello" }]
    }
  } as unknown as ExplanationDatabase;
  const segments = [{ text: "hello world" }];

  const result = await loadVideoDifficulty(mockDatabase, segments);

  assert.equal(result.status, "ready");
  if (result.status === "ready") {
    assert.ok(result.estimate);
  }
});

test("loadVideoDifficulty returns error status when toArray throws an Error", async () => {
  const mockDatabase = {
    learningItems: {
      toArray: async () => {
        throw new Error("Database read failed");
      }
    }
  } as unknown as ExplanationDatabase;
  const segments = [{ text: "hello world" }];

  const result = await loadVideoDifficulty(mockDatabase, segments);

  assert.equal(result.status, "error");
  if (result.status === "error") {
    assert.equal(result.message, "Database read failed");
  }
});

test("loadVideoDifficulty returns fallback error status when toArray throws a non-Error", async () => {
  const mockDatabase = {
    learningItems: {
      toArray: async () => {
        throw "String error";
      }
    }
  } as unknown as ExplanationDatabase;
  const segments = [{ text: "hello world" }];

  const result = await loadVideoDifficulty(mockDatabase, segments);

  assert.equal(result.status, "error");
  if (result.status === "error") {
    assert.equal(result.message, "The video estimate could not be loaded.");
  }
});
