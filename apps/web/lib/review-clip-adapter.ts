import type { ReviewClipWindow } from "./review-context";

export type ReviewClipStatus = "available" | "unavailable";

export interface ReviewClipAdapter {
  loadClip(input: { videoId: string; window: ReviewClipWindow; seek?: boolean }): ReviewClipStatus;
  play(): void;
  pause(): void;
}

/**
 * Reuses the active Watch/Study player. A source from another video remains
 * reviewable through the non-blocking timestamp fallback instead of spawning
 * a second provider-specific player.
 */
export function createSessionReviewClipAdapter(input: {
  activeVideoId: string;
  seekTo: (seconds: number) => void;
  play: () => void;
  pause: () => void;
}): ReviewClipAdapter {
  let loaded: { videoId: string; window: ReviewClipWindow } | undefined;
  let stopTimer: ReturnType<typeof setTimeout> | undefined;

  function clearStopTimer() {
    if (stopTimer) clearTimeout(stopTimer);
    stopTimer = undefined;
  }

  return {
    loadClip({ videoId, window, seek = true }) {
      clearStopTimer();
      if (videoId !== input.activeVideoId) return "unavailable";
      loaded = { videoId, window };
      if (seek) {
        input.seekTo(window.startTimeMs / 1000);
        input.pause();
      }
      return "available";
    },
    play() {
      if (!loaded) return;
      clearStopTimer();
      input.seekTo(loaded.window.startTimeMs / 1000);
      input.play();
      stopTimer = setTimeout(() => input.pause(), Math.max(0, loaded.window.endTimeMs - loaded.window.startTimeMs));
    },
    pause() {
      clearStopTimer();
      input.pause();
    }
  };
}
