import { parseYouTubeUrl, YouTubeUrlParseError } from "./youtube-url.ts";
import type { TranscriptSegment } from "./index.js";

export interface TranscriptSource {
  getTranscript(input: { videoUrl: string; preferredLanguage: "ko" }): Promise<TranscriptResult>;
}
export interface TranscriptResult { videoId: string; language: "ko"; segments: TranscriptSegment[]; }
export interface YouTubeCaptionTrack { languageCode: string; kind: "manual" | "auto"; id: string; }
export interface YouTubeCaptionSegment { text: string; startTimeMs: number; endTimeMs: number; }
export interface YouTubeCaptionProvider {
  listTracks(videoId: string): Promise<YouTubeCaptionTrack[]>;
  fetchTrack(videoId: string, trackId: string): Promise<YouTubeCaptionSegment[]>;
}
export class TranscriptSourceError extends Error {
  readonly code: "NO_TRANSCRIPT" | "NO_KOREAN_TRANSCRIPT" | "INVALID_VIDEO" | "PROVIDER_ERROR";
  constructor(code: "NO_TRANSCRIPT" | "NO_KOREAN_TRANSCRIPT" | "INVALID_VIDEO" | "PROVIDER_ERROR", message: string) { super(message); this.code = code; this.name = "TranscriptSourceError"; }
}
export class YouTubeTranscriptSource implements TranscriptSource {
  private readonly provider: YouTubeCaptionProvider;
  constructor(provider: YouTubeCaptionProvider) { this.provider = provider; }
  async getTranscript(input: { videoUrl: string; preferredLanguage: "ko" }): Promise<TranscriptResult> {
    let videoId: string;
    try { videoId = parseYouTubeUrl(input.videoUrl).videoId; }
    catch (error) { if (error instanceof YouTubeUrlParseError) throw new TranscriptSourceError("INVALID_VIDEO", error.message); throw error; }
    let tracks: YouTubeCaptionTrack[];
    try { tracks = await this.provider.listTracks(videoId); }
    catch (error) { throw providerError(error); }
    if (tracks.length === 0) throw new TranscriptSourceError("NO_TRANSCRIPT", "This video has no captions available.");
    const korean = tracks.filter((track) => track.languageCode.toLowerCase() === "ko" || track.languageCode.toLowerCase().startsWith("ko-"));
    if (korean.length === 0) throw new TranscriptSourceError("NO_KOREAN_TRANSCRIPT", "This video has captions, but no Korean transcript.");
    const track = korean.find((candidate) => candidate.kind === "manual") ?? korean.find((candidate) => candidate.kind === "auto");
    if (!track) throw new TranscriptSourceError("NO_KOREAN_TRANSCRIPT", "This video has no supported Korean transcript.");
    let captions: YouTubeCaptionSegment[];
    try { captions = await this.provider.fetchTrack(videoId, track.id); } catch (error) { throw providerError(error); }
    const segments = captions.map((caption, index) => normalize(caption, index));
    if (segments.length === 0) throw new TranscriptSourceError("NO_TRANSCRIPT", "The selected Korean transcript is empty.");
    return { videoId, language: "ko", segments };
  }
}
function normalize(caption: YouTubeCaptionSegment, index: number): TranscriptSegment {
  const text = caption.text.replace(/\s+/g, " ").trim();
  if (!text || !Number.isFinite(caption.startTimeMs) || !Number.isFinite(caption.endTimeMs) || caption.startTimeMs < 0 || caption.endTimeMs < caption.startTimeMs) throw new TranscriptSourceError("PROVIDER_ERROR", "The caption provider returned an invalid transcript segment.");
  return { id: String(index), text, startTimeMs: caption.startTimeMs, endTimeMs: caption.endTimeMs };
}
function providerError(error: unknown): TranscriptSourceError {
  const message = error instanceof Error ? error.message : "Unknown provider failure.";
  return new TranscriptSourceError("PROVIDER_ERROR", `YouTube caption provider failed: ${message}`);
}
