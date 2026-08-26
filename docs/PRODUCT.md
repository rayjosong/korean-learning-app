# PRODUCT.md

## Product vision

Build the best open-source way to learn Korean through real Korean content.

The product helps learners move from needing subtitles and explanations toward understanding real Korean naturally by turning authentic content into a personalized learning loop.

The desired product experience is:

> A Korean media environment where the learner can deeply inspect anything without leaving the content.

## First target learner

A learner who can form simple Korean sentences and wants to:
- understand Korean YouTube without subtitles;
- navigate Korea comfortably;
- learn through real content and realistic situations;
- learn grammar when it appears naturally;
- use AI as tutor, mistake detector, and conversation partner.

## Core loop

```text
Real Korean content
        ↓
Watch with Korean transcript
        ↓
Inspect only what is unclear
        ↓
Learn meaningful phrases in context
        ↓
Review them in original context
        ↓
Update learner model
        ↓
Recommend what to do next
        ↓
Repeat with harder Korean
```

## Product modes

The core experience has three explicit learning modes:

```text
WATCH -> STUDY -> REVIEW
```

### Watch

The default mode for consuming real Korean naturally.

Default visible information:
- video;
- timestamped Korean transcript;
- current transcript position;
- quiet assistance controls.

English translation and deeper explanation are not permanently visible. The learner chooses when to inspect something.

Clicking a transcript sentence pauses video playback and opens a contextual sentence breakdown.

### Study

A deliberate sentence-by-sentence mode for deeper inspection.

Study prioritizes:
- the selected Korean sentence;
- natural meaning;
- meaningful phrase chunks;
- grammar and nuance on demand;
- learner-state actions.

Study remains tied to the source video and nearby transcript context.

### Review

Review should preserve original source context whenever practical.

Preferred review interaction:

```text
short original video clip
        ↓
Korean sentence / learned phrase
        ↓
learner recalls meaning
        ↓
reveal meaning / context
        ↓
Again / Got it
```

Avoid making decontextualized flashcards the primary experience when the original media context exists.

## Product principles

1. **Real Korean first** — authentic spoken Korean, slang, contractions, fillers, casual speech, honorifics, and speech levels.
2. **Grammar in context** — explain grammar when it naturally appears instead of forcing a grammar-first course.
3. **Progress over gamification** — prefer comprehension gains over XP, leagues, or streak pressure.
4. **Learner ownership** — local-first, no account required initially, export/import, BYO AI key.
5. **Opinionated guidance** — the app should recommend useful next actions from actual weaknesses.
6. **AI is a component** — learner state, reviews, history, and product logic must not depend on one vendor.
7. **Korean before English** — Korean content is visually and cognitively primary; English appears as assistance.
8. **Progressive disclosure** — show concise help first and reveal grammar, nuance, morphology, and examples only when requested.
9. **Phrase-first learning** — prefer meaningful spoken chunks and expressions over immediately fragmenting everything into isolated words or morphemes.
10. **Protect the media flow** — learning tools should enhance real content rather than make the content feel like an exercise embedded inside a lesson.

## Assistance levels

The product should support an assistance preference:

```text
Full | Guided | Immersion
```

Default: **Guided**.

- **Full** — translation and phrase help are easier to reveal; explanations may be more complete after interaction.
- **Guided** — Korean first, concise explanation after interaction, deeper detail on demand.
- **Immersion** — Korean only by default, minimal English, intentional explanation requests.

Assistance remains learner-driven. The app should not proactively interrupt playback simply because content appears difficult.

## Information architecture

Keep top-level navigation simple:

```text
Home   Library   Review   Progress   Settings
```

### Home

Home answers: **What should I do next?**

It should mix:
- continue the current / recent video;
- due review;
- recent or recommended content;
- lightweight progress context.

It should not become a generic KPI dashboard.

### Library

Content the learner has added or studied.

### Review

Contextual review queue.

### Progress

Evidence of actual comprehension and learning improvement.

### Settings

AI provider, learning assistance, appearance, data portability, and related preferences.

## Platform priority

V0.1 is **desktop web first**.

Desktop is the canonical learning workspace because persistent video + transcript + contextual study interactions benefit from horizontal space.

Mobile web should remain functional and responsive, but mobile-specific UX is intentionally KIV. Do not weaken the desktop experience solely to make mobile and desktop layouts identical.

Native mobile remains out of scope for V0.1.

## V0.1 core experience

```text
Paste Korean YouTube URL
        ↓
Load video + Korean transcript
        ↓
Watch with Korean transcript
        ↓
Click sentence
        ↓
Video pauses + contextual breakdown opens
        ↓
Natural meaning + phrase breakdown
        ↓
Grammar / nuance / examples on demand
        ↓
"I know this" / "Learn this"
        ↓
Persist locally
        ↓
Contextual review using source video/clip when practical
```

Required:
- accept any Korean YouTube video;
- timestamped Korean transcript when available;
- interactive transcript;
- Watch and Study modes in the same media workspace;
- clicking a sentence pauses playback;
- contextual sentence breakdown in Watch mode;
- natural spoken Korean support;
- phrase-first interaction;
- natural meaning prioritized over literal translation;
- learner-driven progressive disclosure;
- local learner state;
- basic contextual SRS;
- review tied to original media context when available;
- Guided assistance as the default presentation model;
- BYO AI key;
- OpenAI-compatible provider first;
- export/import;
- desktop-first responsive web implementation.

## Interaction expectations

### Sentence selection

When the learner selects a transcript sentence:
- pause video automatically;
- preserve the learner's place in the transcript;
- show a contextual sentence breakdown;
- prioritize natural meaning;
- show meaningful phrase chunks;
- keep grammar, nuance, morphology, and examples secondary until requested.

### Learning actions

`Learn this` should be low-friction:
- save immediately;
- schedule review;
- preserve source video, sentence, segment, and timestamp;
- show a small confirmation;
- do not force deck, tag, or scheduling configuration into the media flow.

### Review

When source video context exists, review should prefer a short source clip plus the Korean sentence/phrase before answer reveal.

The learner should be able to mark a review as needing another repetition or understood without unnecessary configuration.

## Out of scope for V0.1

- native mobile;
- polished mobile-first interaction design;
- user accounts;
- cloud sync;
- social features;
- achievements/streaks;
- pronunciation coaching;
- live AI roleplay;
- TOPIK preparation;
- community curriculum;
- multi-language support.

## Progress philosophy

The app should prove real improvement, for example:

```text
You watched this 6 weeks ago.

Then: 47% understood
Now: 79% understood
```

Supporting metrics such as learned phrases, review success, and content studied are useful, but should not replace comprehension as the meaningful outcome.

## V0.1 success criterion

> I can use my own app to watch and study one real Korean YouTube video from beginning to end, inspect anything I do not understand, learn useful phrases, and review them in context without leaving the app.

## UX source of truth

`/DESIGN.md` defines the canonical visual language, desktop reference layouts, interaction hierarchy, and UI guardrails for this product.
