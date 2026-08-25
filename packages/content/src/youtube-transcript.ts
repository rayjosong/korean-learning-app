import { parseYouTubeUrl, YouTubeUrlParseError } from "./youtube-url.ts";
import type { TranscriptSegment } from "./index.ts";

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
export interface YouTubeTimedTextProviderOptions {
  fetch?: typeof globalThis.fetch;
  endpoint?: string;
}
export class YouTubeTimedTextProvider implements YouTubeCaptionProvider {
  private readonly fetcher: typeof globalThis.fetch;
  private readonly endpoint: string;

  constructor(options: YouTubeTimedTextProviderOptions = {}) {
    this.fetcher = options.fetch ?? globalThis.fetch;
    this.endpoint = options.endpoint ?? "https://www.youtube.com/api/timedtext";
  }

  async listTracks(videoId: string): Promise<YouTubeCaptionTrack[]> {
    const response = await this.fetcher(`${this.endpoint}?type=list&v=${encodeURIComponent(videoId)}`);
    if (!response.ok) throw providerResponseError(response.status);
    const xml = await response.text();
    return parseTrackList(xml);
  }

  async fetchTrack(videoId: string, trackId: string): Promise<YouTubeCaptionSegment[]> {
    const track = decodeTrackId(trackId);
    const params = new URLSearchParams({
      v: videoId,
      lang: track.languageCode,
      fmt: "json3"
    });
    if (track.kind === "auto") params.set("kind", "asr");
    if (track.name) params.set("name", track.name);
    if (track.vssId) params.set("vss_id", track.vssId);

    const response = await this.fetcher(`${this.endpoint}?${params.toString()}`);
    if (!response.ok) throw providerResponseError(response.status);
    return parseTimedText(await response.text());
  }
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

interface TimedTextTrack {
  languageCode: string;
  kind: "manual" | "auto";
  name?: string;
  vssId?: string;
}

function parseTrackList(xml: string): YouTubeCaptionTrack[] {
  return [...xml.matchAll(/<track\b([^>]*)\/?\s*>/gi)]
    .map((match) => {
      const attributes = parseXmlAttributes(match[1] ?? "");
      const languageCode = attributes.lang_code;
      if (!languageCode) return undefined;
      const track: TimedTextTrack = {
        languageCode,
        kind: attributes.kind === "asr" ? "auto" : "manual",
        ...(attributes.name ? { name: decodeXmlEntities(attributes.name) } : {}),
        ...(attributes.vss_id ? { vssId: attributes.vss_id } : {})
      };
      return { id: encodeTrackId(track), languageCode: track.languageCode, kind: track.kind };
    })
    .filter((track): track is YouTubeCaptionTrack => Boolean(track));
}

function parseTimedText(json: string): YouTubeCaptionSegment[] {
  let payload: unknown;
  try {
    payload = JSON.parse(json);
  } catch {
    throw new Error("YouTube returned an invalid transcript response.");
  }
  if (!payload || typeof payload !== "object" || !Array.isArray((payload as { events?: unknown }).events)) {
    throw new Error("YouTube returned an invalid transcript response.");
  }

  return (payload as { events: unknown[] }).events.flatMap((event) => {
    if (!event || typeof event !== "object") return [];
    const item = event as { tStartMs?: unknown; dDurationMs?: unknown; segs?: unknown };
    const text = Array.isArray(item.segs)
      ? item.segs
          .filter((segment): segment is { utf8?: unknown } => Boolean(segment) && typeof segment === "object")
          .map((segment) => (typeof segment.utf8 === "string" ? segment.utf8 : ""))
          .join("")
      : "";
    if (typeof item.tStartMs !== "number" || typeof item.dDurationMs !== "number" || !text.trim()) return [];
    return [{ text, startTimeMs: item.tStartMs, endTimeMs: item.tStartMs + item.dDurationMs }];
  });
}

function parseXmlAttributes(source: string): Record<string, string> {
  return Object.fromEntries(
    [...source.matchAll(/([\w-]+)\s*=\s*["']([^"']*)["']/g)].map((match) => [match[1], match[2]])
  );
}

function decodeXmlEntities(value: string): string {
  return value.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function encodeTrackId(track: TimedTextTrack): string {
  return encodeURIComponent(JSON.stringify(track));
}

function decodeTrackId(trackId: string): TimedTextTrack {
  try {
    const track = JSON.parse(decodeURIComponent(trackId)) as Partial<TimedTextTrack>;
    if ((track.kind !== "manual" && track.kind !== "auto") || typeof track.languageCode !== "string") throw new Error();
    return track as TimedTextTrack;
  } catch {
    throw new Error("YouTube returned an invalid caption track identifier.");
  }
}

function providerResponseError(status: number): Error {
  if (status === 429) return new Error("YouTube caption provider rate limited the request.");
  return new Error(`YouTube caption provider returned HTTP ${status}.`);
}
