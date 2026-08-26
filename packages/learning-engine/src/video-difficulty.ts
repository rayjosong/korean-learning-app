import type { LearningItem } from "./index";

export type VideoDifficultyBand = "beginner-friendly" | "intermediate" | "challenging";
export type DifficultyEstimateSource = "personalized" | "fallback";

export interface DifficultyEstimateInput {
  segments: readonly { text: string }[];
  items?: readonly LearningItem[];
}

export interface DifficultyEstimate {
  band: VideoDifficultyBand;
  likelyComprehension: { min: number; max: number };
  source: DifficultyEstimateSource;
  reasonCodes: readonly ("known-coverage" | "long-segments" | "repetition" | "new-learner")[];
}

const MIN_COMPREHENSION = 5;
const MAX_COMPREHENSION = 95;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function normalize(value: string): string {
  return value.replace(/\\s+/g, " ").trim();
}

function koreanCharacterCount(text: string): number {
  return [...text].filter((character) => /[\\uAC00-\\uD7A3]/u.test(character)).length;
}

function segmentStats(segments: readonly { text: string }[]) {
  const texts = segments.map((segment) => normalize(segment.text)).filter(Boolean);
  const koreanCharacters = texts.reduce((total, text) => total + koreanCharacterCount(text), 0);
  const averageSegmentLength = texts.length
    ? texts.reduce((total, text) => total + koreanCharacterCount(text), 0) / texts.length
    : 0;
  const uniqueTexts = new Set(texts.map((text) => text.toLocaleLowerCase()));
  const repetitionRatio = texts.length ? 1 - uniqueTexts.size / texts.length : 0;
  return { texts, koreanCharacters, averageSegmentLength, repetitionRatio };
}

function coverage(
  texts: readonly string[],
  items: readonly LearningItem[],
  koreanCharacters: number
): number {
  if (!koreanCharacters || !items.length) return 0;
  const transcript = texts.join(" ");
  const occupied = new Set<number>();
  let weightedCharacters = 0;

  // Match longer saved phrases first so a phrase and its component word cannot
  // claim the same transcript span twice.
  const candidates = [...items]
    .filter((item) => item.state !== "unknown")
    .map((item) => ({ text: normalize(item.text), item }))
    .filter(({ text }) => text.length > 0)
    .sort((left, right) => right.text.length - left.text.length);

  for (const candidate of candidates) {
    let offset = 0;
    while (offset < transcript.length) {
      const match = transcript.indexOf(candidate.text, offset);
      if (match < 0) break;
      const end = match + candidate.text.length;
      const positions = [...Array(end - match).keys()].map((index) => match + index);
      if (!positions.some((position) => occupied.has(position))) {
        positions.forEach((position) => occupied.add(position));
        const koreanLength = koreanCharacterCount(candidate.text);
        const confidence = candidate.item.state === "known"
          ? Math.max(0.8, Math.min(1, candidate.item.recognitionConfidence / 100))
          : Math.max(0, Math.min(1, candidate.item.recognitionConfidence / 100));
        weightedCharacters += koreanLength * confidence;
      }
      offset = end;
    }
  }

  return Math.min(1, weightedCharacters / koreanCharacters);
}

export function estimateVideoDifficulty(input: DifficultyEstimateInput): DifficultyEstimate {
  const stats = segmentStats(input.segments);
  const items = input.items ?? [];
  const hasLearnerState = items.some((item) => item.state !== "unknown");
  const learnerCoverage = coverage(stats.texts, items, stats.koreanCharacters);

  if (!stats.koreanCharacters) {
    return {
      band: "challenging",
      likelyComprehension: { min: MIN_COMPREHENSION, max: 25 },
      source: hasLearnerState ? "personalized" : "fallback",
      reasonCodes: hasLearnerState ? ["known-coverage"] : ["new-learner"]
    };
  }

  const reasons: ("known-coverage" | "long-segments" | "repetition" | "new-learner")[] = [];
  if (hasLearnerState) reasons.push("known-coverage");
  else reasons.push("new-learner");
  if (stats.averageSegmentLength >= 42) reasons.push("long-segments");
  if (stats.repetitionRatio >= 0.25) reasons.push("repetition");

  const baseComprehension = hasLearnerState
    ? learnerCoverage * 100
    : 52 + Math.min(18, stats.repetitionRatio * 40) - Math.max(0, stats.averageSegmentLength - 24) * 0.35;
  const midpoint = clamp(baseComprehension, MIN_COMPREHENSION, MAX_COMPREHENSION);
  const spread = hasLearnerState ? 10 : 18;
  const min = clamp(midpoint - spread, MIN_COMPREHENSION, MAX_COMPREHENSION);
  const max = clamp(midpoint + spread, MIN_COMPREHENSION, MAX_COMPREHENSION);

  return {
    band: midpoint >= 70 ? "beginner-friendly" : midpoint >= 40 ? "intermediate" : "challenging",
    likelyComprehension: { min: Math.min(min, max), max },
    source: hasLearnerState ? "personalized" : "fallback",
    reasonCodes: reasons
  };
}
