---
timestamp: 2026-08-25T16:37:30Z
agent: pi-coding-agent
model: unknown
trigger: user-prompt
status: proposed
ticket: no-ticket
---

# Word and phrase learner-item flow

> In the context of adding persistent learner state to contextual word explanations, facing a choice between a separate save step and inline actions with ambiguous word identity, I decided to keep state actions in the explanation card and save the clicked word or phrase/form as the learner item to achieve a short study loop with reusable source context, accepting that surface forms may produce more learner items than dictionary-form normalization alone.

## Context

- V0.1 requires the learner to mark contextual words or phrases as known or learning without leaving the study session.
- The existing domain model supports learner states and source contexts, while persistence is owned by the storage package rather than the UI.
- A word or phrase can recur across sentences and videos, so the model must reuse the learner item and accumulate contexts.

## Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Separate save modal or step | Gives the save decision a dedicated surface and room for extra metadata | Adds a navigation interruption to the study loop and separates the action from the explanation it applies to |
| Inline actions in the explanation card | Keeps meaning, source context, and learner action together; supports persistent confirmation and undo without leaving the session | The card needs clear states for unsaved, saved, and already-known items |
| Inline actions that normalize every item to its dictionary form | Reduces duplicate lexical entries and simplifies lemma-level review | Loses useful phrase/form distinctions from authentic content and can merge meanings that differ by construction |

## Decision

Chosen: **inline actions with clicked word/phrase identity**, because the product's core loop is contextual study and the selected surface form is the learner's immediate object of attention. Dictionary form remains supporting metadata when available. Repeated encounters reuse the same clicked item and add source contexts; existing state changes the available action rather than showing duplicate actions.

## Consequences

- The learner can save an item without leaving the explanation card.
- Confirmation remains visible until another item is selected, and `Undo` can restore the unsaved state.
- The storage model must support one learner item with multiple source contexts.
- Surface-form identity may create separate items for forms that would share a dictionary form; revisit this if review data shows excessive duplication.

## Artifacts

- `docs/BACKLOG.md` items #11 and #12
- `docs/ARCHITECTURE.md` learner model
