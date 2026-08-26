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
    <section className="rounded-xl border border-hairline bg-surface-elevated p-4" aria-label="AI provider settings">
      <h2 className="mb-1 font-semibold text-ink">AI provider</h2>
      <p className="mb-3 text-xs leading-5 text-ink-muted">
        Bring your own key for an OpenAI-compatible provider. Saved settings stay in this browser and are never exported.
      </p>
      <label className="block text-xs font-medium text-ink-secondary" htmlFor="ai-api-key">API key</label>
      <input
        id="ai-api-key"
        type="password"
        autoComplete="off"
        value={settings.apiKey}
        onChange={(event) => onChange({ ...settings, apiKey: event.target.value })}
        placeholder="sk-…"
        className="mt-1 w-full rounded-lg border border-hairline-strong bg-surface-elevated px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <label className="mt-3 block text-xs font-medium text-ink-secondary" htmlFor="ai-model">Model</label>
      <input
        id="ai-model"
        type="text"
        value={settings.model}
        onChange={(event) => onChange({ ...settings, model: event.target.value })}
        placeholder="gpt-4o-mini"
        className="mt-1 w-full rounded-lg border border-hairline-strong bg-surface-elevated px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <label className="mt-3 block text-xs font-medium text-ink-secondary" htmlFor="ai-base-url">
        Base URL <span className="text-ink-muted">(optional)</span>
      </label>
      <input
        id="ai-base-url"
        type="text"
        value={settings.baseUrl ?? ""}
        onChange={(event) => onChange({ ...settings, baseUrl: event.target.value })}
        placeholder="https://api.openai.com/v1"
        className="mt-1 w-full rounded-lg border border-hairline-strong bg-surface-elevated px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <p className="mt-3 text-xs leading-5 text-ink-muted">
        Browser storage is local convenience, not a secure secret vault. Remove the key on shared or untrusted devices.
      </p>
      <div className="mt-4 flex gap-2">
        <button type="button" disabled={!ready || !canSave} onClick={save} className="flex-1 rounded-lg bg-primary-hover px-3 py-1.5 text-sm font-medium text-on-primary transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50">
          {saved ? "Save changes" : "Save settings"}
        </button>
        <button type="button" disabled={!ready || !saved} onClick={remove} className="rounded-lg border border-hairline-strong px-3 py-1.5 text-sm text-ink-secondary transition-colors hover:border-error hover:text-error focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50">
          Remove
        </button>
      </div>
      {message ? <p className="mt-2 text-xs text-ink-secondary" role="status">{message}</p> : null}
    </section>
  );
}
