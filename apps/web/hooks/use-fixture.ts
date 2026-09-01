"use client";

import { useEffect, useState } from "react";
import { type FixtureScenario, seedFixtureStorage } from "@/lib/fixture-session";

export function useFixture() {
  const [fixtureScenario] = useState<FixtureScenario | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    const value = new URLSearchParams(window.location.search).get("fixture");
    return value === "watch-study" || value === "long" || value === "populated" || value === "review-unavailable" || value === "review-no-context" || value === "loading" || value === "error" || value === "home-empty" || value === "home-populated" || value === "home-due-only"
      ? value
      : undefined;
  });
  const isFixture = fixtureScenario !== undefined;
  const [fixtureReady, setFixtureReady] = useState(false);

  useEffect(() => {
    if (!isFixture) {
      setFixtureReady(true);
      return;
    }
    void seedFixtureStorage(fixtureScenario ?? "watch-study").then(() => {
      setFixtureReady(true);
    });
  }, [fixtureScenario, isFixture]);

  return { fixtureScenario, isFixture, fixtureReady };
}
