import type { LanguageModel } from "@korean-learning/ai";
import type { TranscriptSegment } from "@/lib/transcript";

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
export function createFixtureLanguageModel(): LanguageModel {
  return {
    async explainSentence({ sentence }) {
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
