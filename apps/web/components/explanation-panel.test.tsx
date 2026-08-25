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
