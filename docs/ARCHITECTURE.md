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

Canonical product surfaces/modes:

```text
Home
Watch
Study
Review
Progress
Settings
```

Watch and Study should share the same underlying video/transcript session state.

Conceptually:

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

## Playback and sentence selection

Product behavior:

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

Playback coordination is UI/application behavior, not transcript/AI/storage adapter behavior.

Keep these concepts separate:
- selected sentence = ephemeral session/UI state;
- learning item = persisted learner-domain state;
- sentence explanation = structured/cached content;
- source context = video + segment + timestamp linkage.

## Explanation data vs presentation

The same structured explanation data may render differently:

```text
structured explanation
        ↓
shared application state/use case
        ↓
Watch popover OR Study persistent panel
```

Do not create separate AI calls just because presentation changes.

## Phrase-first interaction

The product presents meaningful phrase/form chunks before morphology-first decomposition.

Domain identity remains:
- learner item represents clicked Korean word or phrase/form;
- dictionary form is supporting metadata;
- repeated encounters reuse one learner item and add source contexts.

UI grouping must not silently redefine learner-item identity.

## Assistance preference

Expose:

```text
full | guided | immersion
```

as a presentation preference separate from provider configuration.

It may influence initial visibility of translation/explanation, but must not silently mutate learner knowledge state.

Persist through the settings/storage boundary.

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

The word/phrase explanation surface owns the learner-state action for the selected item. Existing state is shown when revisited: a `learning` item offers "I know this", while a `known` item offers "Learn this again".

## AI output

Use structured output + Zod validation.

Store provider/model/prompt-version metadata with cached explanations.

AI output should support natural meaning, meaningful phrase breakdown, grammar, and nuance without requiring every field to be visible at once.

## Persistence

Use IndexedDB/Dexie for:
- videos;
- transcripts;
- explanations;
- learning items;
- contexts;
- reviews;
- settings.

AI provider settings are stored in the storage package behind application-level helpers.

### Local CLI providers

```text
Browser UI
  -> Next.js AI route
  -> server provider factory
  -> isolated CLI adapter
  -> local executable
```

The browser sends only a qualified model reference and explanation input. It cannot select an executable. The server resolves provider binaries from its `PATH` or operator-controlled provider-specific overrides. Each request receives a fresh empty working directory, filtered environment, stdin prompt, bounded output, timeout, process termination, and cleanup. CLI adapters validate JSON event output against the existing Korean schemas and never return raw stderr. This is application-level process isolation rather than an OS sandbox. Claude and Codex have separate adapters; the factory never silently falls back between providers.
The current local-first credential resolution order is:

```text
saved local BYOK profile -> in-memory session settings -> no credentials
```

Local browser persistence is a convenience, not a secure secret vault. API keys must never be exported, copied into explanation records, or logged. Deployment-managed defaults and server-side credential handling are a separate future boundary.

Persist source context strongly enough that Review can return to the source video and timestamp and, where practical, replay a short contextual clip.

## Contextual review architecture

The scheduler is independent from presentation:

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

Prefer original video context, but scheduling must still work if clip playback is unavailable.

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

Review clip playback must degrade gracefully to sentence + source timestamp/context if precise playback is unavailable.

## Responsive strategy

Desktop web is canonical for V0.1.

Avoid desktop-only domain assumptions, but desktop and mobile UI composition do not need to be identical. Do not add speculative native-mobile abstractions.

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
