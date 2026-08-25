const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

/** A parsed YouTube video URL, normalized for use by content adapters. */
export interface ParsedYouTubeUrl {
  /** The stable YouTube video identifier. */
  videoId: string;
  /** The canonical watch URL for the video. */
  canonicalUrl: string;
}

/** Thrown when a value is not a supported YouTube watch URL. */
export class YouTubeUrlParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YouTubeUrlParseError";
  }
}

/**
 * Extracts a video identifier from a supported YouTube URL.
 *
 * Supported formats are `youtube.com/watch?v=...` and `youtu.be/...`.
 */
export function parseYouTubeUrl(value: string): ParsedYouTubeUrl {
  const input = value.trim();

  if (input.length === 0) {
    throw new YouTubeUrlParseError("Enter a YouTube video URL.");
  }

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new YouTubeUrlParseError(
      "Enter a valid YouTube URL, such as https://www.youtube.com/watch?v=VIDEO_ID."
    );
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new YouTubeUrlParseError("YouTube URLs must use http or https.");
  }

  const host = url.hostname.toLowerCase();
  const videoId = getVideoId(url, host);

  if (videoId === undefined) {
    throw new YouTubeUrlParseError(
      "Use a YouTube watch URL (youtube.com/watch?v=...) or short URL (youtu.be/...)."
    );
  }

  if (!YOUTUBE_VIDEO_ID_PATTERN.test(videoId)) {
    throw new YouTubeUrlParseError("The YouTube URL contains an invalid video ID.");
  }

  return {
    videoId,
    canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`
  };
}

function getVideoId(url: URL, host: string): string | undefined {
  if (host === "youtube.com" || host === "www.youtube.com" || host === "m.youtube.com") {
    return url.pathname === "/watch" ? url.searchParams.get("v") ?? undefined : undefined;
  }

  if (host === "youtu.be" || host === "www.youtu.be") {
    const [videoId, ...remainingPath] = url.pathname.slice(1).split("/");
    return remainingPath.length === 0 && videoId.length > 0 ? videoId : undefined;
  }

  return undefined;
}
