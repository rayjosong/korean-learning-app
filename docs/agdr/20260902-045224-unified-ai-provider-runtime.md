---
timestamp: 2026-09-02T04:52:24Z
agent: pi-coding-agent
model: gpt-5
trigger: user-prompt
status: proposed
ticket: no-ticket
---

# Unified AI provider selection and runtime

> In the context of adding local CLI providers to a local-first Korean learning app, facing a split OpenAI form, CLI setup flow, and active-model selector, I decided to use one provider registry and one qualified active model with a provider-neutral same-origin request path to achieve coherent switching and enforce runtime checks, accepting a small server adapter for transient browser BYOK credentials while keeping deployment-managed credentials as separate #28 work.

## Context

- The browser currently calls OpenAI-compatible endpoints directly, while Claude and Codex run through Next.js server routes.
- `docs/PRODUCT.md` requires local-first BYOK, vendor independence, and no account for V0.1.
- Backlog #33 adds local CLI providers; backlog #28 separately owns deployment-managed OpenAI defaults.
- The current UI stores provider records and an active qualified model independently, so save, enable, remove, and select operations can disagree.

## Options Considered

| Option | Pros | Cons |
| --- | --- | --- |
| Keep browser-direct OpenAI and patch the current UI | Smallest runtime diff; preserves current credential storage | Retains two execution paths, browser CORS failures, and duplicated error handling |
| Store every provider credential on the server | One runtime and closest to Open Net Worth | Conflicts with the current browser-local BYOK contract and expands #33 into accounts/server secret storage |
| Keep BYOK in IndexedDB but send it transiently through one same-origin provider route | One runtime contract; removes provider CORS; preserves browser-local persistence; deployment defaults can be added later | The server sees the key during a request and must guarantee no persistence or logging |

## Decision

Chosen: **Keep BYOK in IndexedDB but send it transiently through one same-origin provider route**, because it fixes the current execution split without replacing the product's local-first storage model. The route will resolve and validate the qualified provider/model, reject disabled or unavailable server providers, bound requests, normalize errors, and never persist or log transient credentials.

Deployment-managed defaults remain backlog #28. Local CLI execution remains disabled by default for an untrusted/public deployment until that deployment has an access-control boundary.

## Consequences

- Settings, Watch, and Study can use the same active `provider:model` reference and the same client adapter.
- OpenAI-compatible endpoints no longer need browser CORS support.
- Provider lifecycle rules become application behavior rather than independent IndexedDB writes in React components.
- The request contract carries a transient OpenAI credential when local BYOK is active. Tests and logging checks must prove it is neither stored nor emitted.
- A future server-managed default can implement the same credential resolver without changing UI selection or explanation call sites.

## Artifacts

- `docs/IMPLEMENTATION-33-PROVIDER-EXPERIENCE.md`
- `docs/agdr/20260902-local-cli-ai-providers.md`
- `docs/BACKLOG.md` items #28 and #33
