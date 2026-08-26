"use client";

import { useEffect, useState } from "react";

import { loadLearnerProfile, type LearnerProfileLoadResult } from "@/lib/load-learner-profile";
import type { LearnerProfile } from "@korean-learning/learning-engine/profile";
import type { ExplanationDatabase } from "@korean-learning/storage";

export type LearnerProfilePanelState =
  | { status: "loading" }
  | LearnerProfileLoadResult;

const EMPTY_PROFILE: LearnerProfile = {
  knownCount: 0,
  learningCount: 0,
  recognitionConfidence: { count: 0, average: null },
  productionConfidence: { count: 0, average: null },
  grammar: [],
  speechLevels: []
};

function confidenceLabel(value: number | null): string {
  return value === null ? "No reviews yet" : `${value}% average`;
}

function familiarityLabel(value: "exposed" | "familiar" | "well-exposed"): string {
  if (value === "well-exposed") return "Repeated exposure";
  if (value === "familiar") return "Some exposure";
  return "Seen once";
}

export function LearnerProfileView({ state }: { state: LearnerProfilePanelState }) {
  if (state.status === "loading") {
    return <p className="text-sm text-slate-400">Building your local profile…</p>;
  }

  if (state.status === "error") {
    return (
      <p role="alert" className="rounded-lg border border-rose-900/80 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
        Learner profile unavailable: {state.message}
      </p>
    );
  }

  const { profile } = state;
  const isEmpty = profile.knownCount === 0 && profile.learningCount === 0 && profile.grammar.length === 0 && profile.speechLevels.length === 0;

  if (isEmpty) {
    return (
      <p className="text-sm leading-6 text-slate-400">
        Your profile will appear as you save words, review them, and open sentence explanations. Everything stays on this device.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-950/70 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Known</p>
          <p className="mt-1 text-2xl font-semibold text-white">{profile.knownCount}</p>
        </div>
        <div className="rounded-xl bg-slate-950/70 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Learning</p>
          <p className="mt-1 text-2xl font-semibold text-white">{profile.learningCount}</p>
        </div>
      </div>

      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <p className="rounded-lg border border-slate-800 px-3 py-2 text-slate-300">
          <span className="block text-xs text-slate-500">Recognition confidence</span>
          {confidenceLabel(profile.recognitionConfidence.average)}
        </p>
        <p className="rounded-lg border border-slate-800 px-3 py-2 text-slate-300">
          <span className="block text-xs text-slate-500">Production confidence</span>
          {confidenceLabel(profile.productionConfidence.average)}
        </p>
      </div>

      <div>
        <h3 className="text-sm font-medium text-white">Grammar encountered</h3>
        {profile.grammar.length ? (
          <ul className="mt-2 space-y-1 text-sm text-slate-300">
            {profile.grammar.map((item) => (
              <li key={item.form} className="flex justify-between gap-3">
                <span>{item.form}</span><span className="text-slate-500">{item.count}×</span>
              </li>
            ))}
          </ul>
        ) : <p className="mt-1 text-sm text-slate-500">No grammar observations yet.</p>}
      </div>

      <div>
        <h3 className="text-sm font-medium text-white">Speech levels encountered</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">Familiarity here means exposure, not mastery.</p>
        {profile.speechLevels.length ? (
          <ul className="mt-2 space-y-1 text-sm text-slate-300">
            {profile.speechLevels.map((item) => (
              <li key={item.level} className="flex justify-between gap-3">
                <span>{item.level}</span>
                <span className="text-slate-500">{familiarityLabel(item.familiarity)} · {item.count}×</span>
              </li>
            ))}
          </ul>
        ) : <p className="mt-1 text-sm text-slate-500">No speech-level observations yet.</p>}
      </div>
    </div>
  );
}

export function LearnerProfilePanel({
  database,
  refreshKey
}: {
  database?: ExplanationDatabase;
  refreshKey: number;
}) {
  const [state, setState] = useState<LearnerProfilePanelState>({ status: "ready", profile: EMPTY_PROFILE });

  useEffect(() => {
    if (!database) return;
    let cancelled = false;
    setState({ status: "loading" });
    void loadLearnerProfile(database).then((result) => {
      if (!cancelled) setState(result);
    });
    return () => { cancelled = true; };
  }, [database, refreshKey]);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl" aria-label="Learner profile">
      <h2 className="mb-1 font-semibold text-white">Learner profile</h2>
      <p className="mb-4 text-xs leading-5 text-slate-500">A local, explainable snapshot from your saved learning and review history.</p>
      <LearnerProfileView state={state} />
    </section>
  );
}
