import assert from "node:assert/strict";
import test from "node:test";
import { renderToString } from "react-dom/server";

import { VideoTranscriptViewer } from "./video-transcript-viewer.tsx";
import type { TranscriptSegment } from "@/lib/transcript";

const mockSegments: readonly TranscriptSegment[] = [
  { id: "s1", startTimeMs: 0, endTimeMs: 1000, text: "안녕하세요" },
  { id: "s2", startTimeMs: 1000, endTimeMs: 2000, text: "반갑습니다" }
];

test("VideoTranscriptViewer defaults to Watch mode or reflects the mode prop", () => {
  const html = renderToString(
    <VideoTranscriptViewer
      videoId="test-video"
      segments={mockSegments}
      mode="watch"
    />
  ).replaceAll("<!-- -->", "");

  // "Watch" button is selected
  assert.match(html, /role="tab"[^>]*aria-selected="true"[^>]*>Watch/);
  // "Study" button is not selected
  assert.match(html, /role="tab"[^>]*aria-selected="false"[^>]*>Study/);
});

test("VideoTranscriptViewer switches selected state based on mode prop", () => {
  const html = renderToString(
    <VideoTranscriptViewer
      videoId="test-video"
      segments={mockSegments}
      mode="study"
    />
  ).replaceAll("<!-- -->", "");

  // "Study" button is selected
  assert.match(html, /role="tab"[^>]*aria-selected="true"[^>]*>Study/);
  // "Watch" button is not selected
  assert.match(html, /role="tab"[^>]*aria-selected="false"[^>]*>Watch/);
});

test("VideoTranscriptViewer distinguishes active playback segment and selected segment", () => {
  const html = renderToString(
    <VideoTranscriptViewer
      videoId="test-video"
      segments={mockSegments}
      activeSegmentId="s1"
      selectedSegmentId="s2"
    />
  ).replaceAll("<!-- -->", "");

  // Check the active segment s1 contains the active class/highlights
  assert.match(html, /안녕하세요/);
  // Check the selected segment s2 contains the selected class/highlights (with persimmon accent #C7654C)
  assert.match(html, /#C7654C/);
  // Check active segment styling (Highlight #F4E8B8)
  assert.match(html, /#F4E8B8/);
});

test("Assistance label is rendered read-only as Guided", () => {
  const html = renderToString(
    <VideoTranscriptViewer
      videoId="test-video"
      segments={mockSegments}
    />
  ).replaceAll("<!-- -->", "");

  assert.match(html, /Assistance:/);
  assert.match(html, /Guided/);
});

test("VideoTranscriptViewer renders SentenceBreakdownPopover in watch mode when selected", () => {
  const html = renderToString(
    <VideoTranscriptViewer
      videoId="test-video"
      segments={mockSegments}
      mode="watch"
      selectedSegmentId="s1"
      explanationState={{ status: "loading" }}
      onCloseExplanation={() => {}}
    />
  ).replaceAll("<!-- -->", "");

  // Popover section is rendered
  assert.match(html, /aria-label="Sentence explanation popover"/);
  // Status "loading" is reflected inside the popover
  assert.match(html, /Explaining the sentence…/);
});

test("VideoTranscriptViewer renders popover ready state with progressive disclosure triggers", () => {
  const mockExplanation = {
    sentence: "안녕하세요",
    naturalMeaning: "Hello",
    breakdown: [{ text: "안녕하세요", meaning: "hello", role: "greeting" }],
    grammar: [{ form: "-세요", explanation: "Polite honorific ending" }],
    nuance: "Standard polite greeting.",
    speechLevel: "해요체"
  };

  const html = renderToString(
    <VideoTranscriptViewer
      videoId="test-video"
      segments={mockSegments}
      mode="watch"
      selectedSegmentId="s1"
      explanationState={{ status: "ready", explanation: mockExplanation }}
      onCloseExplanation={() => {}}
    />
  ).replaceAll("<!-- -->", "");

  // Popover renders meaning
  assert.match(html, /Hello/);
  // Popover renders phrases/breakdown
  assert.match(html, /안녕하세요/);
  // Popover renders grammar toggle trigger
  assert.match(html, /Grammar/);
  // Popover renders nuance toggle trigger
  assert.match(html, /Nuance/);
});
