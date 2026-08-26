"use client";

import { useState } from "react";

import type { AiSettings } from "@/lib/ai-settings";

export interface AiProviderSettingsProps {
  settings: AiSettings;
  ready: boolean;
  saved: boolean;
  onChange: (settings: AiSettings) => void;
  onSave: () => void;
  onRemove: () => void;
}

export function AiProviderSettings({
  settings,
  ready,
  saved,
  onChange,
  onSave,
  onRemove
}: AiProviderSettingsProps) {
  const [message, setMessage] = useState<string>();
  const canSave = settings.apiKey.trim().length > 0 && settings.model.trim().length > 0;

  function save() {
    if (!canSave) {
      setMessage("Add an API key and model before saving.");
      return;
    }
    setMessage("Saved on this device.");
    onSave();
  }

  function remove() {
    setMessage("Removed from this device.");
    onRemove();
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl" aria-label="AI provider settings">
      <h2 className="mb-1 font-semibold text-white">AI provider</h2>
      <p className="mb-3 text-xs leading-5 text-slate-500">
        Bring your own key for an OpenAI-compatible provider. Saved settings stay in this browser and are never exported.
      </p>
      <label className="block text-xs font-medium text-slate-400" htmlFor="ai-api-key">API key</label>
      <input
        id="ai-api-key"
        type="password"
        autoComplete="off"
        value={settings.apiKey}
        onChange={(event) => onChange({ ...settings, apiKey: event.target.value })}
        placeholder="sk-…"
        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-sky-400 focus:outline-none"
      />
      <label className="mt-3 block text-xs font-medium text-slate-400" htmlFor="ai-model">Model</label>
      <input
        id="ai-model"
        type="text"
        value={settings.model}
        onChange={(event) => onChange({ ...settings, model: event.target.value })}
        placeholder="gpt-4o-mini"
        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-sky-400 focus:outline-none"
      />
      <label className="mt-3 block text-xs font-medium text-slate-400" htmlFor="ai-base-url">
        Base URL <span className="text-slate-600">(optional)</span>
      </label>
      <input
        id="ai-base-url"
        type="text"
        value={settings.baseUrl ?? ""}
        onChange={(event) => onChange({ ...settings, baseUrl: event.target.value })}
        placeholder="https://api.openai.com/v1"
        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-sky-400 focus:outline-none"
      />
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Browser storage is local convenience, not a secure secret vault. Remove the key on shared or untrusted devices.
      </p>
      <div className="mt-4 flex gap-2">
        <button type="button" disabled={!ready || !canSave} onClick={save} className="flex-1 rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-medium text-slate-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50">
          {saved ? "Save changes" : "Save settings"}
        </button>
        <button type="button" disabled={!ready || !saved} onClick={remove} className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:border-rose-400 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50">
          Remove
        </button>
      </div>
      {message ? <p className="mt-2 text-xs text-sky-300" role="status">{message}</p> : null}
    </section>
  );
}
