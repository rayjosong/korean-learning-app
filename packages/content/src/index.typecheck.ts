import type { TranscriptSegment, VideoContent } from "./index.js";

const segment: TranscriptSegment = {
  id: "segment-1",
  text: "안녕하세요",
  startTimeMs: 0,
  endTimeMs: 800
};

const video: VideoContent = {
  id: "video-1",
  source: "youtube",
  sourceVideoId: "abc123",
  url: "https://www.youtube.com/watch?v=abc123",
  title: "인사말",
  transcriptLanguage: "ko"
};

void segment;
void video;
