/** A normalized, timestamped caption segment from a video's transcript. */
export interface TranscriptSegment {
  id: string;
  text: string;
  startTimeMs: number;
  endTimeMs: number;
}
export interface VideoContent {
  id: string; source: "youtube"; sourceVideoId: string; url: string; title: string;
  transcriptLanguage: "ko"; durationMs?: number; thumbnailUrl?: string;
}
export { parseYouTubeUrl, YouTubeUrlParseError, type ParsedYouTubeUrl } from "./youtube-url.ts";
export {
  YouTubeTimedTextProvider, YouTubeTranscriptSource, TranscriptSourceError, type TranscriptSource,
  type TranscriptResult, type YouTubeCaptionProvider, type YouTubeCaptionTrack,
  type YouTubeCaptionSegment
} from "./youtube-transcript.ts";
