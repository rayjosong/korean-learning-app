import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";

import { loadLearnerProfile } from "./load-learner-profile";
import type { ExplanationDatabase } from "@korean-learning/storage";

test("loadLearnerProfile returns ready status on successful load", async () => {
  const mockDatabase = {
    learningItems: {
      toArray: async () => [{ id: "item1", state: "learning" }]
    },
    explanations: {
      toArray: async () => []
    }
  } as unknown as ExplanationDatabase;

  const result = await loadLearnerProfile(mockDatabase);

  assert.equal(result.status, "ready");
  if (result.status === "ready") {
    assert.ok(result.profile);
  }
});

test("loadLearnerProfile returns error status when toArray throws an Error", async () => {
  const mockDatabase = {
    learningItems: {
      toArray: async () => {
        throw new Error("Database read failed");
      }
    },
    explanations: {
      toArray: async () => []
    }
  } as unknown as ExplanationDatabase;

  const result = await loadLearnerProfile(mockDatabase);

  assert.equal(result.status, "error");
  if (result.status === "error") {
    assert.equal(result.message, "Database read failed");
  }
});

test("loadLearnerProfile returns fallback error status when toArray throws a non-Error", async () => {
  const mockDatabase = {
    learningItems: {
      toArray: async () => {
        throw "String error";
      }
    },
    explanations: {
      toArray: async () => []
    }
  } as unknown as ExplanationDatabase;

  const result = await loadLearnerProfile(mockDatabase);

  assert.equal(result.status, "error");
  if (result.status === "error") {
    assert.equal(result.message, "Your learner profile could not be loaded.");
  }
});
