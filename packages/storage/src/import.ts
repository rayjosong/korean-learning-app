import { z } from "zod";
import type { ExplanationDatabase } from "./index.ts";
import type { LearningItem } from "@korean-learning/learning-engine";
import type { ContentProgressSnapshot } from "@korean-learning/learning-engine/revisit";
import type {
  LearningContextRecord,
  ReviewRecord,
  StudiedContentRecord,
  ContentResumeRecord,
  ExplanationRecord,
  WordExplanationRecord
} from "./index.ts";

const LearningItemSchema = z.object({
  id: z.string(),
  kind: z.enum(["word", "phrase"]),
  text: z.string(),
  state: z.enum(["unknown", "learning", "known"]),
  dictionaryForm: z.string().optional(),
  recognitionConfidence: z.number(),
  productionConfidence: z.number(),
  encounters: z.number(),
  successes: z.number(),
  failures: z.number(),
  contextIds: z.array(z.string()),
  lastSeenAt: z.string().optional(),
  nextReviewAt: z.string().optional()
});

const LearningContextRecordSchema = z.object({
  id: z.string(),
  videoId: z.string(),
  transcriptSegmentId: z.string(),
  sentence: z.string(),
  startTimeMs: z.number(),
  endTimeMs: z.number(),
  itemId: z.string(),
  createdAt: z.string()
});

const ReviewRecordSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  mode: z.enum(["recognition", "production", "cloze"]),
  outcome: z.enum(["success", "failure"]),
  reviewedAt: z.string()
});

const StudiedContentRecordSchema = z.object({
  videoId: z.string(),
  firstStudiedAt: z.string(),
  lastStudiedAt: z.string(),
  sourceUrl: z.string().optional(),
  title: z.string().optional()
});

const ContentProgressSnapshotSchema = z.object({
  id: z.string(),
  videoId: z.string(),
  capturedAt: z.string(),
  difficultyBand: z.enum(["beginner-friendly", "intermediate", "challenging"]),
  likelyComprehension: z.object({ min: z.number(), max: z.number() }),
  comprehensionMidpoint: z.number(),
  source: z.enum(["personalized", "fallback"])
});

const ContentResumeRecordSchema = z.object({
  videoId: z.string(),
  sourceUrl: z.string(),
  title: z.string().optional(),
  lastPositionMs: z.number(),
  durationMs: z.number().optional(),
  completed: z.boolean(),
  updatedAt: z.string()
});

const SentenceBreakdownItemSchema = z.object({
  text: z.string(),
  meaning: z.string(),
  role: z.string().optional()
});

const GrammarExplanationSchema = z.object({
  form: z.string(),
  explanation: z.string()
});

const SentenceExplanationSchema = z.object({
  sentence: z.string(),
  naturalMeaning: z.string(),
  breakdown: z.array(SentenceBreakdownItemSchema),
  grammar: z.array(GrammarExplanationSchema),
  nuance: z.string().optional(),
  speechLevel: z.string().optional()
});

const ExplanationRecordSchema = z.object({
  key: z.string(),
  sentence: z.string(),
  promptVersion: z.string(),
  explanation: SentenceExplanationSchema,
  provider: z.string().optional(),
  model: z.string().optional(),
  createdAt: z.string()
});

const WordExplanationSchema = z.object({
  word: z.string(),
  meaning: z.string(),
  dictionaryForm: z.string().optional(),
  nuance: z.string().optional()
});

const WordExplanationRecordSchema = z.object({
  key: z.string(),
  word: z.string(),
  sentence: z.string(),
  promptVersion: z.string(),
  explanation: WordExplanationSchema,
  videoId: z.string(),
  transcriptSegmentId: z.string(),
  startTimeMs: z.number(),
  endTimeMs: z.number(),
  provider: z.string().optional(),
  model: z.string().optional(),
  createdAt: z.string()
});

export const LearnerDataExportSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  learningItems: z.array(LearningItemSchema),
  learningContexts: z.array(LearningContextRecordSchema),
  reviewRecords: z.array(ReviewRecordSchema),
  studiedContent: z.array(StudiedContentRecordSchema),
  contentProgressSnapshots: z.array(ContentProgressSnapshotSchema),
  contentResume: z.array(ContentResumeRecordSchema),
  explanations: z.array(ExplanationRecordSchema),
  wordExplanations: z.array(WordExplanationRecordSchema)
});

/**
 * Imports learner data from a JSON payload.
 *
 * Validates the data against the version 1 schema using Zod.
 * Corrupt or invalid files are safely rejected with an error.
 *
 * **Conflict behavior:** Existing records with the same primary keys are overwritten
 * (upserted). Records that only exist in the database are left untouched.
 *
 * @param database - The ExplanationDatabase to import into
 * @param payload - The unverified data, usually a parsed JSON object or string
 * @throws Error if validation fails or the schema version is unsupported
 */
export async function importLearnerData(
  database: ExplanationDatabase,
  payload: unknown
): Promise<void> {
  let parsedPayload = payload;
  if (typeof payload === "string") {
    try {
      parsedPayload = JSON.parse(payload);
    } catch (e) {
      throw new Error("Invalid JSON file provided for import.");
    }
  }

  const result = LearnerDataExportSchema.safeParse(parsedPayload);
  if (!result.success) {
    throw new Error(`Corrupt or invalid learner data file. Validation failed: ${result.error.message}`);
  }

  const data = result.data;

  await database.transaction(
    "rw",
    [
      database.learningItems,
      database.learningContexts,
      database.reviewRecords,
      database.studiedContent,
      database.contentProgressSnapshots,
      database.contentResume,
      database.explanations,
      database.wordExplanations
    ],
    async () => {
      if (data.learningItems.length > 0) await database.learningItems.bulkPut(data.learningItems as LearningItem[]);
      if (data.learningContexts.length > 0) await database.learningContexts.bulkPut(data.learningContexts as LearningContextRecord[]);
      if (data.reviewRecords.length > 0) await database.reviewRecords.bulkPut(data.reviewRecords as ReviewRecord[]);
      if (data.studiedContent.length > 0) await database.studiedContent.bulkPut(data.studiedContent as StudiedContentRecord[]);
      if (data.contentProgressSnapshots.length > 0) await database.contentProgressSnapshots.bulkPut(data.contentProgressSnapshots as ContentProgressSnapshot[]);
      if (data.contentResume.length > 0) await database.contentResume.bulkPut(data.contentResume as ContentResumeRecord[]);
      if (data.explanations.length > 0) await database.explanations.bulkPut(data.explanations as ExplanationRecord[]);
      if (data.wordExplanations.length > 0) await database.wordExplanations.bulkPut(data.wordExplanations as WordExplanationRecord[]);
    }
  );
}
