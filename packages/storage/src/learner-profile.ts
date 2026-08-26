import type { LearnerProfileInput } from "@korean-learning/learning-engine/profile";

import type { ExplanationDatabase } from "./index";

/**
 * Loads the local evidence needed by the learner-profile domain aggregator.
 * React must consume this through an application use case instead of querying
 * Dexie tables directly.
 */
export async function getLearnerProfileInput(
  database: ExplanationDatabase
): Promise<LearnerProfileInput> {
  const [items, explanations] = await Promise.all([
    database.learningItems.toArray(),
    database.explanations.toArray()
  ]);

  return {
    items,
    grammar: explanations.flatMap((record) =>
      record.explanation.grammar.map((grammar) => ({ form: grammar.form }))
    ),
    speechLevels: explanations.flatMap((record) => {
      const level = record.explanation.speechLevel?.trim();
      return level ? [{ level }] : [];
    })
  };
}
