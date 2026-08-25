/** A normalized, timestamped caption segment from a video's transcript. */
export interface TranscriptSegment {
  /** Stable identifier within its transcript. */
  id: string;
  /** Caption text in the transcript language. */
  text: string;
  /** Inclusive start position in milliseconds. */
  startTimeMs: number;
  /** Exclusive end position in milliseconds. */
  endTimeMs: number;
}

/** Metadata and transcript availability for an item of video content. */
export interface VideoContent {
  /** Stable identifier for the content item. */
  id: string;
  /** Source system that owns the video. */
  source: "youtube";
  /** Identifier assigned by the source system. */
  sourceVideoId: string;
  /** Canonical URL supplied by the source system. */
  url: string;
  /** Display title when known. */
  title: string;
  /** ISO 639-1 language code of the selected transcript. */
  transcriptLanguage: "ko";
  /** Total video duration when known. */
  durationMs?: number;
  /** Thumbnail URL when provided by the source. */
  thumbnailUrl?: string;
}

export {
  parseYouTubeUrl,
  YouTubeUrlParseError,
  type ParsedYouTubeUrl
} from "./youtube-url.js";
