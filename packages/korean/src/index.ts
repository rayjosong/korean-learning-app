/** A word or phrase in an explained Korean sentence. */
export interface SentenceBreakdownItem {
  text: string;
  meaning: string;
  role?: string;
}

/** A grammar point that helps explain a sentence in context. */
export interface GrammarExplanation {
  form: string;
  explanation: string;
}

/** Structured, contextual help for one Korean sentence. */
export interface SentenceExplanation {
  sentence: string;
  naturalMeaning: string;
  breakdown: readonly SentenceBreakdownItem[];
  grammar: readonly GrammarExplanation[];
  nuance?: string;
  speechLevel?: string;
}
