import type { ExplanationDatabase } from "./index.ts";
import type { LearningItem } from "@korean-learning/learning-engine";
import type { ContentProgressSnapshot } from "@korean-learning/learning-engine/revisit";
import type { LearningContextRecord, ReviewRecord, StudiedContentRecord, ContentResumeRecord, ExplanationRecord, WordExplanationRecord } from "./index.ts";

export interface LearnerDataExport {
  version: 1;
  exportedAt: string;
  learningItems: LearningItem[];
  learningContexts: LearningContextRecord[];
  reviewRecords: ReviewRecord[];
  studiedContent: StudiedContentRecord[];
  contentProgressSnapshots: ContentProgressSnapshot[];
  contentResume: ContentResumeRecord[];
  explanations: ExplanationRecord[];
  wordExplanations: WordExplanationRecord[];
}

export async function exportLearnerData(
  database: ExplanationDatabase
): Promise<LearnerDataExport> {
  const result = await database.transaction(
    "r",
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
      return Promise.all([
        database.learningItems.toArray(),
        database.learningContexts.toArray(),
        database.reviewRecords.toArray(),
        database.studiedContent.toArray(),
        database.contentProgressSnapshots.toArray(),
        database.contentResume.toArray(),
        database.explanations.toArray(),
        database.wordExplanations.toArray()
      ]);
    }
  );

  const [
    learningItems,
    learningContexts,
    reviewRecords,
    studiedContent,
    contentProgressSnapshots,
    contentResume,
    explanations,
    wordExplanations
  ] = result;

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    learningItems,
    learningContexts,
    reviewRecords,
    studiedContent,
    contentProgressSnapshots,
    contentResume,
    explanations,
    wordExplanations
  };
}
