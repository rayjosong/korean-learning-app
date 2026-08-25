import { NextResponse } from "next/server";

import {
  TranscriptSourceError,
  YouTubeTimedTextProvider,
  YouTubeTranscriptSource
} from "@korean-learning/content";

const transcriptSource = new YouTubeTranscriptSource(new YouTubeTimedTextProvider());

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Request body must be valid JSON." }, { status: 400 });
  }

  const videoUrl = body && typeof body === "object" && "videoUrl" in body ? body.videoUrl : undefined;
  if (typeof videoUrl !== "string" || !videoUrl.trim()) {
    return NextResponse.json({ message: "Enter a YouTube video URL." }, { status: 400 });
  }

  try {
    const result = await transcriptSource.getTranscript({ videoUrl, preferredLanguage: "ko" });
    return NextResponse.json(result);
  } catch (error) {
    if (!(error instanceof TranscriptSourceError)) {
      return NextResponse.json({ message: "The transcript could not be loaded." }, { status: 502 });
    }
    const status = error.code === "INVALID_VIDEO" ? 400 : error.code === "PROVIDER_ERROR" ? 502 : 404;
    return NextResponse.json({ code: error.code, message: error.message }, { status });
  }
}
