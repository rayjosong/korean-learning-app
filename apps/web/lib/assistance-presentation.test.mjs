import assert from "node:assert/strict";
import test from "node:test";

import { assistancePresentation } from "./assistance-presentation.ts";

test("Guided keeps concise English help and deeper detail collapsed", () => {
  assert.deepEqual(assistancePresentation("guided"), {
    showEnglishMeaning: true,
    showPhraseMeanings: true,
    expandGrammarByDefault: false,
    expandNuanceByDefault: false,
    showExamplesByDefault: false
  });
});

test("Full expands grammar and nuance but not examples", () => {
  const presentation = assistancePresentation("full");
  assert.equal(presentation.expandGrammarByDefault, true);
  assert.equal(presentation.expandNuanceByDefault, true);
  assert.equal(presentation.showExamplesByDefault, false);
});

test("Immersion omits English until explicitly revealed", () => {
  assert.equal(assistancePresentation("immersion").showEnglishMeaning, false);
  assert.deepEqual(assistancePresentation("immersion", true), assistancePresentation("guided"));
});
