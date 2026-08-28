import type { AssistanceLevel } from "@korean-learning/storage/assistance-settings";

export interface AssistancePresentation {
  showEnglishMeaning: boolean;
  showPhraseMeanings: boolean;
  expandGrammarByDefault: boolean;
  expandNuanceByDefault: boolean;
  showExamplesByDefault: false;
}

export function assistancePresentation(
  level: AssistanceLevel,
  englishHelpRevealed = false
): AssistancePresentation {
  const showEnglish = level !== "immersion" || englishHelpRevealed;

  return {
    showEnglishMeaning: showEnglish,
    showPhraseMeanings: showEnglish,
    expandGrammarByDefault: level === "full" && showEnglish,
    expandNuanceByDefault: level === "full" && showEnglish,
    showExamplesByDefault: false
  };
}
