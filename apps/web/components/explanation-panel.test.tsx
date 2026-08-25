import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { renderToString } from "react-dom/server";
import type { ReactElement } from "react";

import { ExplanationPanel } from "./explanation-panel.tsx";

const segment = { id: "one", text: "뭐 해? 나 지금 거기 안 가.", startTimeMs: 0, endTimeMs: 2500 };

function render(panel: ReactElement) {
  return renderToString(panel).replaceAll("<!-- -->", "").replaceAll("&#x27;", "'");
}

const explanation = {
  sentence: "뭐 해? 나 지금 거기 안 가.",
  naturalMeaning: "What are you doing? I'm not going there now.",
  breakdown: [
    { text: "뭐", meaning: "what (contraction of 무엇)", role: "pronoun" },
    { text: "안", meaning: "not", role: "negation" }
  ],
  grammar: [{ form: "안 + verb", explanation: "Short-form negation meaning 'not'." }],
  nuance: "Blunt casual tone between close friends.",
  speechLevel: "해체 (casual/반말)"
};

test("ready state shows the selected sentence with natural meaning prioritized", () => {
  const html = render(
    <ExplanationPanel segment={segment} state={{ status: "ready", explanation }} />
  );

  assert.match(html, /뭐 해\? 나 지금 거기 안 가\./);
  assert.match(html, /What are you doing\? I'm not going there now\./);

  const naturalMeaningAt = html.indexOf("What are you doing?");
  const breakdownAt = html.indexOf("contraction of 무엇");
  const grammarAt = html.indexOf("Short-form negation");
  const nuanceAt = html.indexOf("Blunt casual tone");
  assert.ok(naturalMeaningAt !== -1 && breakdownAt !== -1 && grammarAt !== -1 && nuanceAt !== -1);
  assert.ok(naturalMeaningAt < breakdownAt, "natural meaning renders before breakdown");
  assert.ok(naturalMeaningAt < grammarAt, "natural meaning renders before grammar");
  assert.ok(naturalMeaningAt < nuanceAt, "natural meaning renders before nuance");
});

test("ready state shows breakdown, grammar, speech level, and nuance", () => {
  const html = render(
    <ExplanationPanel segment={segment} state={{ status: "ready", explanation }} />
  );

  assert.match(html, /해체 \(casual\/반말\)/);
  assert.match(html, /안/);
  assert.match(html, /what \(contraction of 무엇\)/);
  assert.match(html, /· pronoun/);
  assert.match(html, /안 \+ verb/);
  assert.match(html, /Short-form negation meaning 'not'\./);
  assert.match(html, /Blunt casual tone between close friends\./);
});

test("nuance section is omitted when there is nothing notable", () => {
  const html = render(
    <ExplanationPanel
      segment={segment}
      state={{
        status: "ready",
        explanation: {
          sentence: "안녕하세요.",
          naturalMeaning: "Hello.",
          breakdown: [{ text: "안녕하세요", meaning: "hello" }],
          grammar: []
        }
      }}
    />
  );

  assert.doesNotMatch(html, /Nuance/);
  assert.doesNotMatch(html, /Grammar/);
});

test("loading state shows the sentence and a pending indicator", () => {
  const html = render(<ExplanationPanel segment={segment} state={{ status: "loading" }} />);

  assert.match(html, /Explaining the sentence…/);
  assert.match(html, /뭐 해\? 나 지금 거기 안 가\./);
});

test("error state shows the message with a retry action", () => {
  const html = render(
    <ExplanationPanel
      segment={segment}
      state={{ status: "error", error: "The AI provider returned an error." }}
      onRetry={() => {}}
    />
  );

  assert.match(html, /The AI provider returned an error\./);
  assert.match(html, /Try again/);
});

test("idle state invites the learner to click a sentence", () => {
  const html = render(<ExplanationPanel state={{ status: "idle" }} />);

  assert.match(html, /Click a Korean sentence in the transcript/);
});

test("transcript clicks are wired to segment selection", async () => {
  const viewerSource = await readFile(new URL("./video-transcript-viewer.tsx", import.meta.url), "utf8");

  assert.match(viewerSource, /onSegmentClick\?\.\(segment\)/);
  assert.match(viewerSource, /seekToSegment\(segment\)/);
});

test("breakdown words render as clickable lookups", () => {
  const html = render(
    <ExplanationPanel
      segment={segment}
      state={{ status: "ready", explanation }}
      wordState={{ status: "idle" }}
      onWordClick={() => {}}
    />
  );

  const wordButton = html.match(/<button[^>]*>\s*뭐\s*<\/button>/);
  assert.ok(wordButton, "breakdown words should be buttons");
});

test("word card shows loading state for the selected word", () => {
  const html = render(
    <ExplanationPanel
      segment={segment}
      state={{ status: "ready", explanation }}
      wordState={{ status: "loading", word: "뭐" }}
      onWordClick={() => {}}
    />
  );

  assert.match(html, /Looking up/);
  assert.match(html, /뭐<\/span>…/);
});

test("word card shows contextual meaning, dictionary form, and nuance", () => {
  const html = render(
    <ExplanationPanel
      segment={segment}
      state={{ status: "ready", explanation }}
      wordState={{
        status: "ready",
        word: "뭐",
        explanation: {
          word: "뭐",
          meaning: "what (casual)",
          dictionaryForm: "무엇",
          nuance: "Very casual register."
        }
      }}
      onWordClick={() => {}}
    />
  );

  assert.match(html, /what \(casual\)/);
  assert.match(html, /Dictionary form:/);
  assert.match(html, /무엇/);
  assert.match(html, /Very casual register\./);
});

test("word card shows an error state", () => {
  const html = render(
    <ExplanationPanel
      segment={segment}
      state={{ status: "ready", explanation }}
      wordState={{ status: "error", word: "뭐", error: "The AI provider returned an error." }}
      onWordClick={() => {}}
    />
  );

  assert.match(html, /The AI provider returned an error\./);
});

test("word card is omitted while idle", () => {
  const html = render(
    <ExplanationPanel
      segment={segment}
      state={{ status: "ready", explanation }}
      wordState={{ status: "idle" }}
    />
  );

  assert.doesNotMatch(html, /Word explanation/);
});

test("word card offers an I-know-this action in the explanation card", () => {
  const html = render(
    <ExplanationPanel
      segment={segment}
      state={{ status: "ready", explanation }}
      wordState={{
        status: "ready",
        word: "뭐",
        explanation: { word: "뭐", meaning: "what (casual)" }
      }}
      learnerState={{ status: "ready" }}
      onMarkKnown={() => {}}
    />
  );

  assert.match(html, /I know this/);
});

test("existing learning items still offer I know this, not duplicate save actions", () => {
  const html = render(
    <ExplanationPanel
      segment={segment}
      state={{ status: "ready", explanation }}
      wordState={{
        status: "ready",
        word: "뭐",
        explanation: { word: "뭐", meaning: "what (casual)" }
      }}
      learnerState={{
        status: "ready",
        item: {
          id: "item-1",
          kind: "word",
          text: "뭐",
          state: "learning",
          recognitionConfidence: 0.3,
          productionConfidence: 0,
          encounters: 2,
          successes: 1,
          failures: 0,
          contextIds: []
        }
      }}
      onMarkKnown={() => {}}
    />
  );

  const matches = html.match(/I know this/g);
  assert.equal(matches?.length, 1);
});

test("already-known items show their state instead of the action", () => {
  const html = render(
    <ExplanationPanel
      segment={segment}
      state={{ status: "ready", explanation }}
      wordState={{
        status: "ready",
        word: "뭐",
        explanation: { word: "뭐", meaning: "what (casual)" }
      }}
      learnerState={{
        status: "ready",
        item: {
          id: "item-1",
          kind: "word",
          text: "뭐",
          state: "known",
          recognitionConfidence: 1,
          productionConfidence: 0,
          encounters: 3,
          successes: 2,
          failures: 0,
          contextIds: []
        }
      }}
      onMarkKnown={() => {}}
    />
  );

  assert.doesNotMatch(html, /I know this/);
  assert.match(html, /You already marked this as known\./);
});

test("saving shows a persistent confirmation with Undo", () => {
  const html = render(
    <ExplanationPanel
      segment={segment}
      state={{ status: "ready", explanation }}
      wordState={{
        status: "ready",
        word: "뭐",
        explanation: { word: "뭐", meaning: "what (casual)" }
      }}
      learnerState={{
        status: "ready",
        item: {
          id: "item-1",
          kind: "word",
          text: "뭐",
          state: "known",
          recognitionConfidence: 0,
          productionConfidence: 0,
          encounters: 1,
          successes: 0,
          failures: 0,
          contextIds: ["video-1:one:뭐"]
        },
        saved: {
          item: {
            id: "item-1",
            kind: "word",
            text: "뭐",
            state: "known",
            recognitionConfidence: 0,
            productionConfidence: 0,
            encounters: 1,
            successes: 0,
            failures: 0,
            contextIds: ["video-1:one:뭐"]
          },
          isNew: true,
          contextId: "video-1:one:뭐"
        }
      }}
      onMarkKnown={() => {}}
      onUndo={() => {}}
    />
  );

  assert.match(html, /Marked as known/);
  assert.match(html, /Undo/);
  assert.doesNotMatch(html, /I know this/);
});
