---
timestamp: 2026-08-26T12:21:15Z
agent: pi-coding-agent
model: GPT-5
trigger: user-prompt
status: executed
ticket: no-ticket
---

# Persistent AI provider settings

In the context of making BYO AI practical for a local-first open-source Korean learning app, facing the choice between browser-only session state, local persistence, and account/server storage, I decided to persist one OpenAI-compatible provider profile in IndexedDB behind `@korean-learning/storage` to restore settings across visits while keeping accounts and hosted credential management out of V0.1, accepting that browser storage is not a secure secret vault.

## Context

- `PRODUCT.md` requires learner ownership, local-first behavior, no account initially, and BYO AI keys.
- `ARCHITECTURE.md` requires persistence behind storage adapters and forbids credentials in exports or logs.
- The existing AI adapter is client-side and already accepts an API key, model, and optional base URL.
- Dexie schema migrations are already tested for prior versions.

## Options considered

| Option | Pros | Cons |
|--------|------|------|
| Session-only React state | No credential at-rest persistence; smallest change | Repeated setup on every visit; poor product experience |
| Local IndexedDB profile | Works without accounts or a server; matches existing Dexie persistence; survives reloads | Browser storage is accessible to same-origin JavaScript and is not a secure vault |
| Account-synced/server vault | Cross-device settings and centralized secret controls | Requires accounts, backend storage, authentication, and a larger security boundary outside V0.1 |

## Decision

Use a single local `default` profile in a new Dexie table at schema version 6. The web application loads and saves it through application helpers; the settings component does not access Dexie directly. The profile stores provider type, model, optional base URL, and API key. It is never included in explanation, learner, history, or export records.

Deployment-managed defaults remain backlog item #28 because they require a deliberate server-side credential and request boundary.

## Consequences

- Users configure the provider once per browser.
- Existing in-memory behavior remains available while IndexedDB loads.
- Removing the profile clears the API key from local persistence.
- The UI must state the storage limitation clearly.
- A future account or self-hosted deployment implementation can replace the application settings source without changing the `LanguageModel` interface.
