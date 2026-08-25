import assert from "node:assert/strict";
import test from "node:test";

import { parseYouTubeUrl, YouTubeUrlParseError } from "../src/youtube-url.ts";

const VIDEO_ID = "dQw4w9WgXcQ";

test("parses a youtube.com watch URL", () => {
  assert.deepEqual(parseYouTubeUrl(`https://www.youtube.com/watch?v=${VIDEO_ID}`), {
    videoId: VIDEO_ID,
    canonicalUrl: `https://www.youtube.com/watch?v=${VIDEO_ID}`
  });
});

test("parses a youtu.be short URL", () => {
  assert.deepEqual(parseYouTubeUrl(`https://youtu.be/${VIDEO_ID}?si=share-token`), {
    videoId: VIDEO_ID,
    canonicalUrl: `https://www.youtube.com/watch?v=${VIDEO_ID}`
  });
});

test("reports useful errors for unsupported and invalid URLs", () => {
  assert.throws(
    () => parseYouTubeUrl("https://example.com/watch?v=dQw4w9WgXcQ"),
    (error) => error instanceof YouTubeUrlParseError && error.message.includes("youtube.com/watch?v=...")
  );
  assert.throws(
    () => parseYouTubeUrl("not a url"),
    (error) => error instanceof YouTubeUrlParseError && error.message.includes("valid YouTube URL")
  );
});
