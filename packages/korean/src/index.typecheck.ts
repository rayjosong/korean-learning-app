import type { SentenceExplanation } from "./index.js";

const explanation: SentenceExplanation = {
  sentence: "지금 가고 있어요.",
  naturalMeaning: "I'm on my way now.",
  breakdown: [
    { text: "지금", meaning: "now" },
    { text: "가고 있어요", meaning: "am going", role: "progressive verb" }
  ],
  grammar: [{ form: "-고 있다", explanation: "expresses an action in progress" }],
  speechLevel: "polite informal"
};

void explanation;
