# ARCHITECTURE.md

## Goals

- clean domain boundaries;
- local-first data;
- vendor-independent AI;
- replaceable transcript adapters;
- testable learning logic;
- simple enough for open-source contributors.

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

The word/phrase explanation card owns the learner-state action for the selected item. Saving replaces the action buttons with a persistent confirmation and `Undo` until the learner selects another item. Existing state is shown when an item is revisited: a `learning` item offers "I know this", while a `known` item offers "Learn this again".

## AI output

Use structured output + Zod validation.

Store provider/model/prompt-version metadata with cached explanations.

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

## First vertical slice

```text
Paste URL
-> load transcript
-> render transcript
-> click sentence
-> structured AI explanation
-> cache locally
```

Build this before broader learner features.
