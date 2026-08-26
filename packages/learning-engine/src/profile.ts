import type { LearningItem } from "./index";

export interface GrammarObservation {
  form: string;
}

export interface SpeechLevelObservation {
  level: string;
}

export interface LearnerProfileInput {
  items: readonly LearningItem[];
  grammar: readonly GrammarObservation[];
  speechLevels: readonly SpeechLevelObservation[];
}

export interface ConfidenceSummary {
  count: number;
  average: number | null;
}

export interface GrammarFormSummary {
  form: string;
  count: number;
}

export type SpeechLevelFamiliarity = "exposed" | "familiar" | "well-exposed";

export interface SpeechLevelSummary {
  level: string;
  count: number;
  familiarity: SpeechLevelFamiliarity;
}

export interface LearnerProfile {
  knownCount: number;
  learningCount: number;
  recognitionConfidence: ConfidenceSummary;
  productionConfidence: ConfidenceSummary;
  grammar: readonly GrammarFormSummary[];
  speechLevels: readonly SpeechLevelSummary[];
}

function normalizeLabel(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function confidenceSummary(values: readonly number[]): ConfidenceSummary {
  if (values.length === 0) return { count: 0, average: null };
  const total = values.reduce((sum, value) => sum + Math.max(0, Math.min(100, value)), 0);
  return { count: values.length, average: Math.round((total / values.length) * 10) / 10 };
}

function countLabels(values: readonly string[]): Map<string, { label: string; count: number }> {
  const counts = new Map<string, { label: string; count: number }>();
  for (const raw of values) {
    const label = normalizeLabel(raw);
    if (!label) continue;
    const key = label.toLocaleLowerCase();
    const existing = counts.get(key);
    counts.set(key, existing ? { ...existing, count: existing.count + 1 } : { label, count: 1 });
  }
  return counts;
}

/**
 * Builds a deterministic, explainable local learner snapshot.
 *
 * Confidence is the arithmetic mean across saved known/learning items. Grammar
 * and speech-level observations are exposure counts only; they never imply
 * mastery. Speech-level familiarity intentionally describes repeated exposure:
 * one encounter is "exposed", two or three are "familiar", and four or more
 * are "well-exposed".
 */
export function aggregateLearnerProfile(input: LearnerProfileInput): LearnerProfile {
  const savedItems = input.items.filter((item) => item.state === "known" || item.state === "learning");
  const grammarCounts = countLabels(input.grammar.map((observation) => observation.form));
  const speechCounts = countLabels(input.speechLevels.map((observation) => observation.level));

  return {
    knownCount: savedItems.filter((item) => item.state === "known").length,
    learningCount: savedItems.filter((item) => item.state === "learning").length,
    recognitionConfidence: confidenceSummary(savedItems.map((item) => item.recognitionConfidence)),
    productionConfidence: confidenceSummary(savedItems.map((item) => item.productionConfidence)),
    grammar: [...grammarCounts.values()]
      .map(({ label, count }) => ({ form: label, count }))
      .sort((left, right) => right.count - left.count || left.form.localeCompare(right.form)),
    speechLevels: [...speechCounts.values()]
      .map(({ label, count }) => ({
        level: label,
        count,
        familiarity: count >= 4 ? "well-exposed" : count >= 2 ? "familiar" : "exposed"
      }) satisfies SpeechLevelSummary)
      .sort((left, right) => right.count - left.count || left.level.localeCompare(right.level))
  };
}
