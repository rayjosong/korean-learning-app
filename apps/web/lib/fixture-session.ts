import type { LanguageModel } from "@korean-learning/ai";
import type { TranscriptSegment } from "@/lib/transcript";
import type { SentenceExplanation } from "@korean-learning/ai";
import {
  ExplanationDatabase,
  putCachedExplanation,
  putLearningContext,
  putLearningItem,
  putReviewRecord,
  recordStudiedContent
} from "@korean-learning/storage";
import { putAiProviderSettings } from "@korean-learning/storage/ai-settings";

export type FixtureScenario = "watch-study" | "long" | "populated" | "review-unavailable" | "review-no-context" | "loading" | "error" | "home-empty" | "home-populated" | "home-due-only";

export const FIXTURE_VIDEO_ID = "fixture-29d-video";
export const FIXTURE_SEGMENTS: readonly TranscriptSegment[] = Array.from(
  { length: 24 },
  (_, index) => ({
    id: `fixture-${index + 1}`,
    startTimeMs: index * 4000,
    endTimeMs: index * 4000 + 3500,
    text: [
      "오늘은 날씨가 정말 좋네요.",
      "그래서 그냥 걸어가려고요.",
      "생각보다 길이 조금 멀어요.",
      "그래도 천천히 가면 괜찮아요.",
      "여기서 잠깐 쉬었다 갈까요?"
    ][index % 5]
    })
);

export const LONG_FIXTURE_SEGMENTS: readonly TranscriptSegment[] = Array.from(
  { length: 72 },
  (_, index) => ({
    id: `fixture-${index + 1}`,
    startTimeMs: index * 4000,
    endTimeMs: index * 4000 + 3500,
    text: [
      "오늘은 날씨가 정말 좋네요.",
      "그래서 그냥 걸어가려고요.",
      "생각보다 길이 조금 멀어요.",
      "그래도 천천히 가면 괜찮아요.",
      "여기서 잠깐 쉬었다 갈까요?"
    ][index % 5]
  })
);

const FIXTURE_NOW = "2026-01-15T00:00:00.000Z";
const FIXTURE_EXPLANATION: SentenceExplanation = {
  sentence: "그래서 그냥 걸어가려고요.",
  naturalMeaning: "So I’m just going to walk there.",
  breakdown: [
    { text: "그래서", meaning: "so / therefore", role: "connective" },
    { text: "그냥", meaning: "just / simply", role: "adverb" },
    { text: "걸어가려고요", meaning: "planning to walk there", role: "intention" }
  ],
  grammar: [{ form: "-려고요", explanation: "A gentle way to state an intention." }],
  nuance: "Conversational and lightly explanatory.",
  speechLevel: "해요체"
};

export async function seedFixtureStorage(scenario: FixtureScenario): Promise<void> {
  const database = new ExplanationDatabase();
  await Promise.all([
    database.explanations.clear(),
    database.wordExplanations.clear(),
    database.learningItems.clear(),
    database.learningContexts.clear(),
    database.reviewRecords.clear(),
    database.aiProviderSettings.clear(),
    database.studiedContent.clear(),
    database.contentProgressSnapshots.clear(),
    database.contentResume.clear(),
  ]);

  if (scenario === "home-empty") {
    database.close();
    return;
  }

  const shouldSeedReview = scenario === "populated" || scenario === "review-unavailable" || scenario === "review-no-context" || scenario === "home-populated" || scenario === "home-due-only";
  if (!shouldSeedReview) {
    database.close();
    return;
  }

  const context = {
    id: `${FIXTURE_VIDEO_ID}:fixture-2:그래서`,
    itemId: "fixture-learning-item",
    videoId: scenario === "review-unavailable" ? "fixture-unavailable-video" : scenario === "review-no-context" ? "" : FIXTURE_VIDEO_ID,
    transcriptSegmentId: "fixture-2",
    sentence: "그래서 그냥 걸어가려고요.",
    startTimeMs: 4000,
    endTimeMs: 7500,
    createdAt: FIXTURE_NOW
  };
  await putLearningItem(database, {
    id: "fixture-learning-item",
    kind: "word",
    text: "그래서",
    state: "learning",
    dictionaryForm: "그래서",
    recognitionConfidence: 70,
    productionConfidence: 40,
    encounters: 3,
    successes: 2,
    failures: 1,
    contextIds: [context.id],
    lastSeenAt: FIXTURE_NOW,
    nextReviewAt: "2020-01-01T00:00:00.000Z"
  });
  await putLearningContext(database, context);
  await putLearningItem(database, {
    id: "fixture-known-item",
    kind: "word",
    text: "그냥",
    state: "known",
    recognitionConfidence: 90,
    productionConfidence: 80,
    encounters: 5,
    successes: 4,
    failures: 1,
    contextIds: [],
    lastSeenAt: FIXTURE_NOW
  });
  await putReviewRecord(database, {
    id: "fixture-review-success",
    itemId: "fixture-learning-item",
    mode: "recognition",
    outcome: "success",
    reviewedAt: "2026-01-14T00:00:00.000Z"
  });
  await putReviewRecord(database, {
    id: "fixture-review-failure",
    itemId: "fixture-learning-item",
    mode: "production",
    outcome: "failure",
    reviewedAt: "2026-01-13T00:00:00.000Z"
  });
  await putReviewRecord(database, {
    id: "fixture-review-failure-2",
    itemId: "fixture-learning-item",
    mode: "production",
    outcome: "failure",
    reviewedAt: "2026-01-12T00:00:00.000Z"
  });
  await putCachedExplanation(database, {
    key: "fixture-v1:그래서 그냥 걸어가려고요.",
    sentence: FIXTURE_EXPLANATION.sentence,
    promptVersion: "fixture-v1",
    explanation: FIXTURE_EXPLANATION,
    provider: "fixture",
    model: "fixture-model",
    createdAt: "2026-01-14T00:00:00.000Z"
  });
  await recordStudiedContent(database, {
    videoId: FIXTURE_VIDEO_ID,
    sourceUrl: "https://youtu.be/fixture-29d-video",
    title: "성시경 먹을텐데 - fixture",
    studiedAt: FIXTURE_NOW
  });
  if (scenario === "home-populated") {
    await recordStudiedContent(database, {
      videoId: "fixture-recent-video",
      sourceUrl: "https://youtu.be/fixture-recent-video",
      title: "서울에서 보낸 하루",
      studiedAt: "2026-01-14T00:00:00.000Z"
    });
  }
  await putAiProviderSettings(database, {
    provider: "openai-compatible",
    apiKey: "sk-fixture-only",
    model: "fixture-model",
    baseUrl: "https://example.invalid/v1",
    updatedAt: FIXTURE_NOW
  });
  await database.contentProgressSnapshots.put({
    id: `${FIXTURE_VIDEO_ID}:previous-session`,
    videoId: FIXTURE_VIDEO_ID,
    capturedAt: "2025-12-01T00:00:00.000Z",
    difficultyBand: "challenging",
    likelyComprehension: { min: 35, max: 55 },
    comprehensionMidpoint: 45,
    source: "fallback"
  });
  if (scenario === "home-populated") {
    await database.contentResume.put({
      videoId: FIXTURE_VIDEO_ID,
      sourceUrl: "https://youtu.be/fixture-29d-video",
      title: "성시경 먹을텐데 - fixture",
      lastPositionMs: 125000,
      completed: false,
      updatedAt: "2026-01-15T00:00:00.000Z"
    });
  }
  if (scenario === "home-due-only") {
    await database.contentResume.clear();
    await database.studiedContent.clear();
  }
  database.close();
}

export function createFixtureLanguageModel(scenario: FixtureScenario = "watch-study"): LanguageModel {
  return {
    async explainSentence({ sentence }) {
      if (scenario === "error") throw new Error("Fixture explanation failed. Try again.");
      if (scenario === "loading" && typeof window !== "undefined") {
        await new Promise<void>((resolve) => {
          window.addEventListener("fixture:release-explanation", () => resolve(), { once: true });
        });
      }
      return {
        sentence,
        naturalMeaning: sentence === "그래서 그냥 걸어가려고요." ? "So I’m just going to walk there." : "This is a natural Korean sentence.",
        breakdown: [
          { text: "그래서", meaning: "so / therefore", role: "connective" },
          { text: "그냥", meaning: "just / simply", role: "adverb" },
          { text: "걸어가려고요", meaning: "planning to walk there", role: "intention" }
        ],
        grammar: [{ form: "-려고요", explanation: "A gentle way to state an intention." }],
        nuance: "Conversational and lightly explanatory.",
        speechLevel: "해요체"
      };
    },
    async explainWord({ word }) {
      return { word, meaning: word === "그래서" ? "so / therefore" : "a phrase from the sentence", dictionaryForm: word, nuance: "Fixture explanation for deterministic browser tests." };
    }
  };
}
