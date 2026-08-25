# PRODUCT.md

## Product vision

Build the best open-source way to learn Korean through real Korean content.

The product helps learners move from needing subtitles and explanations toward understanding real Korean naturally by turning authentic content into a personalized learning loop.

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
Understand what the learner knows
        ↓
Explain only what matters
        ↓
Practice weak areas
        ↓
Update learner model
        ↓
Recommend what to do next
        ↓
Repeat with harder Korean
```

## Product principles

1. **Real Korean first** — authentic spoken Korean, slang, contractions, fillers, casual speech, honorifics, and speech levels.
2. **Grammar in context** — explain grammar when it naturally appears instead of forcing a grammar-first course.
3. **Progress over gamification** — prefer comprehension gains over XP, leagues, or streak pressure.
4. **Learner ownership** — local-first, no account required initially, export/import, BYO AI key.
5. **Opinionated guidance** — the app should recommend useful next actions from actual weaknesses.
6. **AI is a component** — learner state, reviews, history, and product logic must not depend on one vendor.

## V0.1 scope

```text
Paste Korean YouTube URL
        ↓
Load video + Korean transcript
        ↓
Click sentence
        ↓
Natural meaning + breakdown + grammar + nuance
        ↓
Click word / phrase
        ↓
"I know this" / "Learn this"
        ↓
Persist locally
        ↓
Contextual review
```

Required:
- accept any Korean YouTube video;
- timestamped Korean transcript when available;
- interactive transcript;
- contextual sentence explanation;
- natural spoken Korean support;
- word/phrase interaction;
- local learner state;
- basic contextual SRS;
- BYO AI key;
- OpenAI-compatible provider first;
- export/import.

## Out of scope for V0.1

- native mobile;
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

## V0.1 success criterion

> I can use my own app to study one real Korean YouTube video from beginning to end and learn from it without leaving the app.
