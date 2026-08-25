export interface TranscriptSegment {
  id: string;
  text: string;
  startTimeMs: number;
  endTimeMs: number;
}

export function findSegmentAtTime(
  segments: readonly TranscriptSegment[],
  timeMs: number
): TranscriptSegment | undefined {
  return segments.find(
    (segment) => timeMs >= segment.startTimeMs && timeMs < segment.endTimeMs
  );
}

export function formatTimestamp(timeMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(timeMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
