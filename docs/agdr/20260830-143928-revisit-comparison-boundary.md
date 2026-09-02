---
timestamp: 2026-08-30T14:39:28Z
agent: pi-coding-agent
model: gpt-5
trigger: user-prompt
status: proposed
ticket: no-ticket
pr: 83
---

# Keep revisit comparison local to a video session

> In the context of backlog #22, facing the need to show useful Then versus Now evidence without inventing a global comprehension score, I decided to compare local snapshots for the same video at meaningful revisit boundaries to achieve an honest replay-and-comparison flow, accepting that the result is an estimate rather than a direct test of comprehension.

## Context

- #22 requires prior-content detection, replay, and a Then versus Now comparison; `PRODUCT.md` makes content-level comprehension evidence the primary outcome.
- Existing local-only storage already has `contentProgressSnapshots`, and the learning engine can derive a deterministic difficulty-based likely-comprehension range from learner state.
- `DESIGN.md` assigns deliberate reinspection to Study and reserves Progress for calm, comprehension-first evidence. No account, cloud analytics, or AI request is in scope.

## Options Considered

| Option | Pros | Cons |
| --- | --- | --- |
| Compare snapshots for the same video at a meaningful revisit boundary | Reuses local data and existing domain/storage seams; keeps the claim scoped to one video; supports Replay directly. | Gives an estimated range, not a direct comprehension test. |
| Show a global learner-profile change as the video's Then versus Now result | Requires less per-video data. | Cannot truthfully attribute the change to a particular video and does not meet the content-comparison intent. |
| Require a new comprehension quiz before every comparison | Could produce a direct score. | Adds an interruptive, exercise-first flow outside the V0.1 Watch/Study experience. |

## Decision

Chosen: **compare snapshots for the same video at a meaningful revisit boundary**, because `ContentProgressSnapshot`, the Dexie table, and the pure `compareContentProgress` seam already model a local per-video record. The UI will call the result an estimated likely-comprehension comparison, retain the range and date, and avoid a global score claim.

## Consequences

- Replay can open the existing video workspace with no new top-level destination or provider dependency.
- The feature needs clear capture semantics so remounts and passive renders do not create misleading visits.
- A future direct comprehension check can add a new evidence type without replacing the local snapshot boundary.

## Artifacts

- `docs/IMPLEMENTATION-22.md`
- Backlog #22 in `docs/BACKLOG.md`
