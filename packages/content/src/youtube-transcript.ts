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
  private readonly watchPageContexts = new Map<string, WatchPageContext>();

  constructor(options: YouTubeTimedTextProviderOptions = {}) {
    this.fetcher = options.fetch ?? globalThis.fetch;
    this.endpoint = options.endpoint ?? "https://www.youtube.com/api/timedtext";
  }

  async listTracks(videoId: string): Promise<YouTubeCaptionTrack[]> {
    const response = await this.fetcher(`${this.endpoint}?type=list&v=${encodeURIComponent(videoId)}`);
    if (!response.ok) throw providerResponseError(response.status);
    const xml = await response.text();
    const tracks = parseTrackList(xml);
    return tracks.length > 0 ? tracks : this.listWatchPageTracks(videoId);
  }

  private async listWatchPageTracks(videoId: string): Promise<YouTubeCaptionTrack[]> {
    const response = await this.fetcher(`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`);
    if (!response.ok) throw providerResponseError(response.status);
    const html = await response.text();
    const context = extractWatchPageContext(html);
    this.watchPageContexts.set(videoId, context);
    return parseWatchPageTracks(html);
  }

  async fetchTrack(videoId: string, trackId: string): Promise<YouTubeCaptionSegment[]> {
    const track = decodeTrackId(trackId);
    let body = "";
    try {
      const params = new URLSearchParams({
        v: videoId,
        lang: track.languageCode,
        fmt: "json3"
      });
      if (track.kind === "auto") params.set("kind", "asr");
      if (track.name) params.set("name", track.name);
      if (track.vssId) params.set("vss_id", track.vssId);

      const url = track.baseUrl ? new URL(track.baseUrl) : new URL(this.endpoint);
      if (!track.baseUrl) params.forEach((value, key) => url.searchParams.set(key, value));
      else url.searchParams.set("fmt", "json3");

      const response = await this.fetcher(url.toString());
      if (response.ok) {
        body = await response.text();
      }
    } catch {
      // Ignore error to allow fallback
    }

    if (!body || body.trim().length === 0) {
      return this.fetchTrackViaGetPanel(videoId, track);
    }
    return parseTimedText(body);
  }

  private async fetchTrackViaGetPanel(videoId: string, track: TimedTextTrack): Promise<YouTubeCaptionSegment[]> {
    let context = this.watchPageContexts.get(videoId);
    if (!context) {
      const response = await this.fetcher(`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`);
      if (!response.ok) throw providerResponseError(response.status);
      const html = await response.text();
      context = extractWatchPageContext(html);
      this.watchPageContexts.set(videoId, context);
    }

    if (!context.apiKey || !context.getPanelParams) {
      throw new Error("YouTube returned an invalid transcript response.");
    }

    const url = `https://www.youtube.com/youtubei/v1/get_panel?key=${context.apiKey}&prettyPrint=false`;
    const payload = {
      context: {
        client: {
          clientName: "WEB",
          clientVersion: context.clientVersion,
          hl: track.languageCode,
          gl: "KR",
          utcOffsetMinutes: 540,
          ...(context.visitorData ? { visitorData: context.visitorData } : {})
        }
      },
      panelId: "PAmodern_transcript_view",
      params: context.getPanelParams
    };

    const response = await this.fetcher(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-YouTube-Client-Name": "1",
        "X-YouTube-Client-Version": context.clientVersion,
        ...(context.visitorData ? { "X-Goog-Visitor-Id": context.visitorData } : {})
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw providerResponseError(response.status);
    const data = await response.json();
    const segments = extractTranscriptFromGetPanel(data);
    if (segments.length === 0) {
      throw new Error("YouTube returned an invalid transcript response.");
    }
    return segments;
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
  baseUrl?: string;
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

function parseWatchPageTracks(html: string): YouTubeCaptionTrack[] {
  const playerResponse = extractJsonObject(html, "ytInitialPlayerResponse") as {
    captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: unknown } };
  } | undefined;
  const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!Array.isArray(captionTracks)) return [];

  return captionTracks.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];
    const track = candidate as { languageCode?: unknown; kind?: unknown; name?: { simpleText?: unknown }; baseUrl?: unknown };
    if (typeof track.languageCode !== "string" || typeof track.baseUrl !== "string") return [];
    const normalized: TimedTextTrack = {
      languageCode: track.languageCode,
      kind: track.kind === "asr" ? "auto" : "manual",
      baseUrl: track.baseUrl,
      ...(track.name && typeof track.name.simpleText === "string" ? { name: track.name.simpleText } : {})
    };
    return [{ id: encodeTrackId(normalized), languageCode: normalized.languageCode, kind: normalized.kind }];
  });
}

function extractJsonObject(source: string, marker: string): unknown {
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) return undefined;
  const start = source.indexOf("{", markerIndex);
  if (start < 0) return undefined;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') { inString = true; continue; }
    if (character === "{") depth += 1;
    else if (character === "}" && --depth === 0) {
      try { return JSON.parse(source.slice(start, index + 1)); } catch { return undefined; }
    }
  }
  return undefined;
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

interface WatchPageContext {
  apiKey: string | null;
  clientVersion: string;
  visitorData: string | null;
  getPanelParams: string | null;
}

function extractWatchPageContext(html: string): WatchPageContext {
  const apiKeyMatch = html.match(/"INNERTUBE_API_KEY"\s*:\s*"([^"]+)"/) || html.match(/"apiKey"\s*:\s*"([^"]+)"/);
  const apiKey = apiKeyMatch ? apiKeyMatch[1] : null;

  const clientVersionMatch = html.match(/"clientVersion"\s*:\s*"([^"]+)"/);
  const clientVersion = clientVersionMatch ? clientVersionMatch[1] : "2.20260824.10.00";

  const visitorDataMatch = html.match(/"visitorData"\s*:\s*"([^"]+)"/);
  const visitorData = visitorDataMatch ? visitorDataMatch[1] : null;

  const targetTagIndex = html.indexOf('"tag":"PAmodern_transcript_view"');
  let getPanelParams: string | null = null;
  if (targetTagIndex >= 0) {
    const searchArea = html.substring(targetTagIndex, targetTagIndex + 500);
    const paramsMatch = searchArea.match(/"params"\s*:\s*"([^"]+)"/);
    if (paramsMatch) {
      getPanelParams = paramsMatch[1];
    }
  }

  return { apiKey, clientVersion, visitorData, getPanelParams };
}

function parseTimestampToMs(timestamp: string): number {
  const parts = timestamp.split(":").map(Number);
  if (parts.some(isNaN)) return 0;
  let seconds = 0;
  if (parts.length === 2) {
    seconds = parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 1) {
    seconds = parts[0];
  }
  return seconds * 1000;
}

function extractTranscriptFromGetPanel(data: any): YouTubeCaptionSegment[] {
  const segments: { text: string; startTimeMs: number }[] = [];

  const traverse = (obj: any) => {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      for (const item of obj) traverse(item);
    } else {
      if (obj.transcriptSegmentViewModel) {
        const vm = obj.transcriptSegmentViewModel;
        const text = vm.simpleText;
        const timestamp = vm.timestamp;
        if (typeof text === "string" && typeof timestamp === "string") {
          segments.push({
            text,
            startTimeMs: parseTimestampToMs(timestamp)
          });
        }
      } else {
        for (const value of Object.values(obj)) {
          traverse(value);
        }
      }
    }
  };

  traverse(data);

  return segments.map((seg, index) => {
    const nextSeg = segments[index + 1];
    const endTimeMs = nextSeg ? nextSeg.startTimeMs : seg.startTimeMs + 5000;
    return {
      text: seg.text,
      startTimeMs: seg.startTimeMs,
      endTimeMs
    };
  });
}
