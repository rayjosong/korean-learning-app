# ARCHITECTURE.md

## Goals

- clean domain boundaries;
- local-first data;
- vendor-independent AI;
- replaceable transcript adapters;
- testable learning logic;
- simple enough for open-source contributors;
- UI structure that can support Watch, Study, and Review without coupling domain logic to React components.

## High-level architecture

```text
Web UI (Next.js / React)
        ↓
Application / use cases
        ↓
Learning engine + Korean domain
        ↓
Interfaces
   ┌────┼────────┐
   ↓    ↓        ↓
  AI  Content  Storage
adapter adapter adapter
```

## Core rule

Prefer:

```text
UI
 -> application use case
 -> domain service/interface
 -> adapter
```

Avoid:

```text
React component
 -> direct model SDK call
 -> random localStorage write
```

## Authoritative documents

```text
AGENTS.md              agent operating rules
DESIGN.md              visual + interaction design system
docs/PRODUCT.md        product intent and UX behavior
docs/ARCHITECTURE.md   technical boundaries
docs/BACKLOG.md        execution order and completion state
```

These documents should agree, but each owns a different concern. Do not duplicate implementation logic into `DESIGN.md`, or visual design rules into domain packages.

## Suggested repo layout

```text
apps/
  web/

packages/
  learning-engine/
  korean/
  ai/
  content/
  storage/

docs/
  PRODUCT.md
  ARCHITECTURE.md
  BACKLOG.md

AGENTS.md
DESIGN.md
README.md
```

## Recommended stack

- Next.js
- React
- TypeScript
- Tailwind
- pnpm workspaces
- IndexedDB via Dexie
- Zod

UI primitives may use shadcn/ui or Radix where useful, but project behavior and visual rules come from `DESIGN.md` rather than library defaults.

## UI application structure

The canonical desktop experience has product surfaces/modes:

```text
Home
Watch
Study
Review
Progress
Settings
```

Watch and Study should share the same underlying video/transcript session state rather than duplicating content state in independent implementations.

Suggested conceptual split:

```text
VideoStudySession
  ├─ playback state
  ├─ transcript position
  ├─ selected sentence
  ├─ assistance preference
  └─ active mode: watch | study

UI
  ├─ Watch workspace
  ├─ SentenceBreakdownPopover
  └─ Study workspace
```

The exact React composition may evolve, but domain and adapter logic must remain outside these view components.

## Playback and sentence-selection behavior

Product behavior requires:

```text
click transcript sentence
        ↓
pause playback
        ↓
select transcript segment
        ↓
request/cache explanation as needed
        ↓
show contextual explanation
```

Playback coordination is application/UI behavior. It must not be implemented inside transcript adapters, AI adapters, storage adapters, or learner-state domain transitions.

Selecting a sentence and learning a phrase are separate concepts:

- **selected sentence** is ephemeral session/UI state;
- **learning item** is persisted learner-domain state;
- **sentence explanation** may be cached persistence state;
- **source context** links learner items/reviews back to video + segment + timestamp.

Do not collapse these into one model for convenience.

## Explanation presentation vs explanation data

`SentenceExplanation` and related structured AI output describe explanation content, not where that content renders.

Watch may render the explanation in a contextual popover/overlay.

Study may render the same explanation data persistently in the study workspace.

Therefore:

```text
structured explanation data
        ↓
shared application state / use case
        ↓
Watch presentation OR Study presentation
```

Do not create separate AI calls merely because the presentation changes between modes.

## Phrase-first interaction

The product presents meaningful phrase/form chunks before morphology-first decomposition.

Domain identity remains consistent with the existing learner model:

- a learner item represents the clicked Korean word or phrase/form;
- dictionary form is supporting metadata when available;
- repeated encounters reuse one learner item and add source contexts.

UI phrase grouping may be derived from structured explanations. Do not mutate learner-state identity simply to match a display grouping without an explicit domain decision.

## Assistance preference

The UI exposes:

```text
full | guided | immersion
```

as a presentation/learning-assistance preference.

Keep this preference separate from provider configuration.

It may influence:
- which explanation fields are initially visible;
- how easily translation is revealed;
- default explanation verbosity;
- amount of English presented.

It should not silently alter persisted learner knowledge state.

Store the preference through the settings/storage boundary when persistence is implemented.

## Core interfaces

```ts
export interface TranscriptSource {
  getTranscript(input: {
    videoUrl: string;
    preferredLanguage: "ko";
  }): Promise<TranscriptResult>;
}

export interface LanguageModel {
  explainSentence(input: ExplainSentenceInput): Promise<SentenceExplanation>;
  explainWord(input: ExplainWordInput): Promise<WordExplanation>;
}
```

## Learner model

Keep V0.1 explainable:
- unknown / learning / known;
- A learner item represents the clicked Korean word or phrase/form. Its dictionary form is supporting metadata when available, not the saved item identity.
- Repeated encounters with the same word or phrase/form reuse one learner item rather than creating duplicates.
- recognition confidence;
- production confidence;
- encounters;
- successes/failures;
- last seen;
- next review;
- source contexts. Each context preserves the source sentence, video, transcript segment, and timestamp.

The word/phrase explanation surface owns the learner-state action for the selected item. Saving replaces the action buttons with a confirmation and `Undo` until the learner selects another item or the temporary confirmation is dismissed by the UX. Existing state is shown when an item is revisited: a `learning` item offers "I know this", while a `known` item offers "Learn this again".

## AI output

Use structured output + Zod validation.

Store provider/model/prompt-version metadata with cached explanations.

The AI output should support natural meaning, meaningful phrase breakdown, grammar, and nuance without forcing all fields to be simultaneously visible in UI.

## Persistence

Use IndexedDB/Dexie for:
- videos;
- transcripts;
- explanations;
- learning items;
- contexts;
- reviews;
- settings.

API keys must never be exported or logged.

Persist source context strongly enough that Review can return to the source video and timestamp and, where technically practical, replay a short contextual clip.

## Contextual review architecture

The scheduler remains independent from the review presentation.

```text
review scheduler
      ↓
due review item
      ↓
source context lookup
      ↓
Review UI
  ├─ source video/timestamp
  ├─ sentence / phrase
  ├─ reveal
  └─ success/failure action
```

Review UI should prefer original video context where available, but review scheduling must still work if clip playback is unavailable.

Do not make YouTube playback availability a prerequisite for updating SRS state.

## Review scheduling

Start deterministic and simple. Keep it behind an interface so FSRS/other algorithms can replace it later.

## Highest-risk dependency

YouTube transcript acquisition should be treated as an adapter and validated early.

Handle:
- manual captions;
- auto captions;
- no captions;
- no Korean captions;
- invalid/unsupported videos;
- rate limiting/provider errors.

YouTube playback/clip behavior is also an external integration concern. Review should degrade gracefully to sentence + source timestamp when a precise clip cannot be replayed.

## Responsive strategy

Desktop web is canonical for V0.1.

The architecture should avoid desktop-only domain assumptions, but UI components do not need identical desktop/mobile compositions.

Do not create domain abstractions solely to anticipate a future native mobile app.

## First vertical slice

```text
Paste URL
-> load transcript
-> render Watch workspace
-> click sentence
-> pause playback
-> structured AI explanation
-> contextual Watch presentation
-> cache locally
```

Then extend the same session into phrase learning, Study mode, and contextual Review.
