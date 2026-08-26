# DESIGN.md

## Purpose

`DESIGN.md` is the canonical source of truth for how the Korean Learning App should look, feel, and behave in the user interface.

Agents working on user-facing features MUST read this document before changing UI. `docs/PRODUCT.md` defines product intent; this document translates that intent into concrete interaction and visual rules.

The canonical V0.1 experience is **desktop web first**. Mobile web should remain usable, but desktop UX must not be weakened merely to make every interaction identical on small screens.

## Design direction — Warm Korean Editorial

The product should feel like:

> A calm Korean media environment where the learner can deeply inspect anything, with a thoughtful tutor available only when needed.

Primary influences:

- **Claude** — warm editorial canvas, restrained humanist feel;
- **Notion** — compact contextual interactions and information density;
- **Spotify** — media-first hierarchy where content supplies most visual richness;
- **Apple** — subtraction, clarity, whitespace, and visual restraint.

This is an influence stack, not a mandate to clone any product.

The target feeling is:

```text
Korean reading room
+ media player
+ contextual tutor
```

not:

```text
generic SaaS dashboard
+ chatbot
+ gamified course
```

## UX model

The product has three explicit learning modes:

```text
WATCH  ->  STUDY  ->  REVIEW
```

They are parts of one learning loop, not unrelated features.

```text
                    REAL KOREAN CONTENT
                           |
               +-----------+-----------+
               |                       |
             WATCH                   STUDY
               |                       |
        consume naturally      inspect deliberately
               |                       |
               +-----------+-----------+
                           |
                      LEARN PHRASE
                           |
                           v
                         REVIEW
                           |
                    original context
                           |
                           v
                    REAL KOREAN AGAIN
```

### Watch

Default mode. Optimize for continuous consumption.

Visible by default:

- video;
- timestamped Korean transcript;
- current playback state;
- quiet mode / assistance controls.

Do not permanently show:

- English translation;
- grammar panels;
- vocabulary lists;
- AI chat;
- large learning dashboards.

Clicking a transcript sentence pauses playback and opens a contextual sentence breakdown popover/overlay.

### Study

Deliberate sentence-by-sentence inspection.

Study mode uses the same content and playback context, but gives more space to:

- the selected Korean sentence;
- natural meaning;
- meaningful phrase chunks;
- grammar and nuance on demand;
- learner-state actions.

Watch and Study should feel related, not like unrelated applications.

### Review

Review should reuse the original media context whenever available.

The preferred review pattern is:

```text
original video clip
      +
Korean sentence / phrase
      +
recall meaning
      +
reveal
      +
Again / Got it
```

Do not default to decontextualized flashcards when original video context is available.

## Core interaction decisions

These decisions are canonical unless explicitly changed by the user:

1. Opening a video defaults to **Watch**.
2. Watch shows **video + Korean transcript** by default.
3. Clicking a sentence **automatically pauses video playback**.
4. Sentence explanation opens as a **contextual popup / overlay** in Watch mode rather than permanently occupying a third panel.
5. Learning should be **phrase-first**, not morphology-first or isolated-word-first.
6. Deeper grammar, nuance, and examples use progressive disclosure.
7. Learning assistance is **learner-driven**, not proactively interruptive.
8. `Learn this` should be low-friction: save immediately, show a small confirmation, and stay in context.
9. The home screen mixes continue-learning, due reviews, and relevant content rather than acting as a metrics dashboard.
10. Desktop is the canonical V0.1 interaction surface. Mobile web remains KIV beyond functional responsiveness.

## Information architecture

Keep top-level navigation simple:

```text
Home   Library   Review   Progress   Settings
```

Do not create separate top-level destinations for every capability.

### Home

Home answers:

> What should I do next?

Preferred priority:

1. Continue learning;
2. due reviews;
3. recent / recommended content;
4. lightweight progress context.

### Library

Content the learner has added or studied.

### Review

Contextual review queue using original source context where practical.

### Progress

Comprehension-oriented progress, not vanity metrics.

### Settings

AI provider, data, appearance, and learning-assistance preferences.

## Canonical desktop screens

ASCII layouts are structural references. They define hierarchy and placement, not exact pixels.

### Home — desktop

```text
+--------------------------------------------------------------------------+
| Korean                     Home  Library  Review  Progress  Settings       |
+--------------------------------------------------------------------------+
|                                                                          |
|  안녕하세요.                                                              |
|                                                                          |
|  Continue learning                                                       |
|  +--------------------------------------------------------------------+  |
|  | [thumbnail]  성시경 먹을텐데                                        |  |
|  |              12:43 / 24:18                                         |  |
|  |              Continue ->                                           |  |
|  +--------------------------------------------------------------------+  |
|                                                                          |
|  8 phrases ready for review                              Review ->        |
|  Review them in the videos where you found them.                         |
|                                                                          |
|  Recommended / recent content                                            |
|  [thumbnail]          [thumbnail]          [thumbnail]                    |
|  title                title                title                          |
|                                                                          |
+--------------------------------------------------------------------------+
```

Do not turn Home into a grid of KPI cards.

### Watch — desktop

```text
+--------------------------------------------------------------------------+
| Korean                     Home  Library  Review  Progress  Settings       |
+--------------------------------------+-----------------------------------+
|                                      |                                   |
|                                      |  TRANSCRIPT                       |
|            YOUTUBE VIDEO             |                                   |
|                                      |  12:38                            |
|                                      |  오늘 진짜 날씨가 좋네요.          |
|                                      |                                   |
|                                      |  12:43                            |
|                                      |  그래서 그냥 걸어가려고요.         |
|                                      |                                   |
|                                      |  12:49                            |
|                                      |  근데 생각보다 멀어요.             |
|                                      |                                   |
+--------------------------------------+-----------------------------------+
|  Watch   Study                                    Assistance: Guided  v   |
+--------------------------------------------------------------------------+
```

The video and transcript are the dominant surfaces.

### Watch — sentence selected

Selecting a transcript sentence pauses playback and opens an anchored contextual explanation.

```text
+--------------------------------------+-----------------------------------+
|                                      |                                   |
|            VIDEO PAUSED              |  오늘 진짜 날씨가 좋네요.          |
|                                      |                                   |
|                                      |  +-----------------------------+  |
|                                      |  | 그래서 그냥 걸어가려고요.    |  |
|                                      |  |                             |  |
|                                      |  | So I'm just going to walk   |  |
|                                      |  | there.                      |  |
|                                      |  |                             |  |
|                                      |  | 그래서       so / therefore |  |
|                                      |  | 그냥         just / simply  |  |
|                                      |  | 걸어가려고요 planning to walk|  |
|                                      |  |                             |  |
|                                      |  | Grammar · Nuance · Examples |  |
|                                      |  |                  Learn this |  |
|                                      |  +-----------------------------+  |
|                                      |                                   |
|                                      |  근데 생각보다 멀어요.             |
+--------------------------------------+-----------------------------------+
```

The overlay must not destroy transcript context. Closing it returns the learner to Watch. Resuming playback may close or visually de-emphasize the overlay.

### Study — desktop

```text
+--------------------------------------------------------------------------+
| Korean                     Home  Library  Review  Progress  Settings       |
+-------------------------------+------------------------------------------+
|                               |                                          |
|          VIDEO                |  CURRENT SENTENCE                        |
|                               |                                          |
|                               |  그래서 그냥 걸어가려고요.               |
+-------------------------------+                                          |
|                               |  So I'm just going to walk there.        |
| Nearby transcript             |                                          |
|                               |  PHRASES                                 |
| 이전 문장                     |                                          |
| -> 그래서 그냥 걸어가려고요. |  그래서          so / therefore          |
| 다음 문장                     |  그냥            just / simply           |
|                               |  걸어가려고요    planning to walk there  |
|                               |                                          |
|                               |  Grammar · Nuance · More examples        |
|                               |                                          |
|                               |  I know this              Learn this     |
+-------------------------------+------------------------------------------+
|  Watch   Study                                    Assistance: Guided  v   |
+--------------------------------------------------------------------------+
```

Study mode can devote persistent space to explanation because the learner explicitly entered deliberate study.

### Review — desktop

```text
+--------------------------------------------------------------------------+
| Review                                                        8 left     |
+--------------------------------------------------------------------------+
|                                                                          |
|                    +--------------------------+                          |
|                    |                          |                          |
|                    |      ORIGINAL CLIP       |                          |
|                    |          5 sec           |                          |
|                    |                          |                          |
|                    +--------------------------+                          |
|                                                                          |
|                       그래서 그냥 걸어가려고요.                           |
|                                                                          |
|                         What does this mean?                             |
|                                                                          |
|                              Reveal                                      |
|                                                                          |
+--------------------------------------------------------------------------+
```

After reveal:

```text
그래서 그냥 걸어가려고요.

"So I'm just going to walk there."

Source context may appear here when useful.

[Again]                                               [Got it]
```

### Progress — desktop

Progress should emphasize genuine comprehension changes and learning behavior.

```text
+--------------------------------------------------------------------------+
| Progress                                                                 |
+--------------------------------------------------------------------------+
|                                                                          |
|  Your Korean                                                             |
|                                                                          |
|  Recent improvement                                                      |
|  +--------------------------------------------------------------------+  |
|  | You watched this video 6 weeks ago.                                |  |
|  |                                                                    |  |
|  | Then: 47% understood          Now: 79% understood                  |  |
|  +--------------------------------------------------------------------+  |
|                                                                          |
|  Learning                                                               |
|  48 phrases learning · 131 known · review trend                          |
|                                                                          |
|  Content studied                                                         |
|  ...                                                                     |
+--------------------------------------------------------------------------+
```

Metrics are supporting evidence, not the product's emotional center.

## Mobile web — KIV reference

Mobile web should remain functional, but V0.1 UX decisions are desktop-first.

Do not force desktop and mobile into identical layouts.

A plausible future mobile Watch structure is:

```text
+------------------------+
| VIDEO                  |
+------------------------+
| current sentence       |
| 지금 뭐 하고 있어?    |
+------------------------+
| transcript             |
|                        |
| 오늘은...              |
| 그래서...              |
| 그런데...              |
|                        |
+------------------------+
```

Sentence explanations may become a bottom sheet:

```text
+------------------------+
| Explanation            |
|                        |
| 지금 뭐 하고 있어?    |
| What are you up to?    |
|                        |
| phrase breakdown       |
| Grammar · Nuance       |
|                        |
|           Learn this   |
+------------------------+
```

These are exploratory references, not V0.1 acceptance criteria.

## Assistance levels

The app should support a quiet assistance control:

```text
Assistance: Full | Guided | Immersion
```

Default: **Guided**.

### Full

- Korean remains primary;
- translation is easier to reveal;
- phrase breakdown is readily available;
- explanations may be more verbose after learner interaction.

### Guided

- Korean first;
- English appears after interaction;
- concise explanation first;
- grammar / nuance / examples on demand.

### Immersion

- Korean-only by default;
- minimal English;
- explanation requires intentional action;
- no proactive difficulty interruption.

Assistance level controls presentation, not what the learner is allowed to access.

## Phrase-first language interaction

Korean should be taught in meaningful chunks.

Prefer:

```text
생각보다
than expected
```

and:

```text
뭐 하고 있어?
what are you up to?
```

rather than immediately decomposing every sentence into isolated morphemes.

Morphology and dictionary forms are supporting depth, not the default interaction unit.

Do not render every Korean token as a visible button. Sentences must still read naturally.

## Progressive disclosure

Default explanation hierarchy:

```text
Korean sentence

Natural meaning

Meaningful phrase breakdown

Grammar · Nuance · More examples
```

Natural meaning comes before literal translation.

Do not show every grammar, nuance, morphology, example, and AI explanation at once.

## Learner-state actions

`Learn this` and `I know this` live where the relevant phrase is being inspected.

Saving should be immediate.

Preferred feedback:

```text
✓ Added to review
```

Do not interrupt the learner with deck selection, tagging, scheduling, or difficulty forms unless a future product decision explicitly requires them.

## Visual atmosphere

The interface should feel:

- warm;
- focused;
- thoughtful;
- quiet;
- contemporary;
- slightly editorial;
- comfortable during long study sessions.

It should not feel:

- childish;
- corporate;
- cyberpunk;
- aggressively dark;
- dashboard-heavy;
- neon;
- heavily gamified.

## Color system

### Light theme

```text
Canvas             #FAF9F5
Surface Subtle     #F6F2EA
Surface            #EFE9DE
Surface Elevated   #FFFFFF
Primary Ink        #191816
Secondary Ink      #484641
Muted Ink          #75716A
Hairline           #E5DFD5
Hairline Strong    #D5CEC2
```

### Brand accent — muted persimmon

```text
Primary            #C7654C
Primary Hover      #B75943
Primary Soft       #F4E1DA
On Primary         #FFFFFF
```

Use sparingly for selected state, primary action, focus, and learning state.

### Secondary semantic accent — jade

```text
Jade               #4F8373
Jade Soft          #E2EEE9
```

Use quietly for known / successful states.

### Warm highlight

```text
Highlight           #F4E8B8
Highlight Soft      #FAF4DA
```

Useful for current transcript playback and temporary annotation.

Never turn the interface into Korean-flag red/blue theming.

## Learning-state presentation

Color is supporting information only.

### Unknown

Default text presentation. Do not mark all unknown content aggressively.

### Selected

Use Primary Soft plus a stronger indicator where needed.

### Learning

Use restrained persimmon accent.

### Known

Use restrained jade only when state needs to be communicated. Do not paint every known word green.

### Needs review

Use a muted warm amber semantic state.

## Typography

Korean readability has priority over brand novelty.

### Korean

Preferred:

```text
Pretendard
```

Fallback:

```text
Noto Sans KR
Apple SD Gothic Neo
system-ui
sans-serif
```

### Latin / UI

Use one consistent sans such as Inter or Geist.

A restrained serif may be used for occasional editorial headings outside the core study surface, but never for transcript, phrase breakdown, or learning controls.

### Baseline sizes

Korean study sentence:

```text
22–28px desktop
500 weight
1.55–1.7 line height
```

Transcript:

```text
17–19px
400–500 weight
1.65 line height
```

Translation:

```text
15–16px
400 weight
Secondary Ink
```

UI body:

```text
16px / 1.55
```

Korean must remain visually primary when paired with English.

## Spacing

Use a 4px-based scale:

```text
4  8  12  16  24  32  48  64  96
```

Prefer whitespace over additional containers.

## Radius

```text
Small        6px
Default      8px
Large       12px
Extra Large 16px
Pill         9999px
```

Avoid oversized generic-SaaS rounded cards.

## Depth

Prefer, in order:

1. whitespace;
2. background contrast;
3. hairline borders;
4. shadow only where necessary.

Shadows are appropriate for temporary overlays, contextual popovers, and modals. Avoid floating-card shadow everywhere.

## Cards

Cards are not the default layout primitive.

Use cards when an object genuinely has a boundary, such as:

- a video in Library;
- a review item;
- a recommended content item;
- a contained settings section.

Do not place every transcript sentence, metric, explanation, and action inside independent cards.

## Buttons and actions

### Primary

One strong contextual action such as:

```text
Continue
Learn this
Review
```

### Secondary

Neutral surface / border actions such as:

```text
I know this
Skip
```

### Tertiary

Many learning actions should be quiet text or ghost controls:

```text
Grammar · Nuance · Examples · Explain
```

Do not make every capability visually compete.

## Transcript behavior

The transcript is a first-class interface.

Each line may contain:

```text
timestamp
Korean sentence
playback / learning state
```

Current playback state should be visible but subtle.

Hover can reveal secondary controls such as seek / bookmark where useful. Those controls should not permanently clutter the transcript.

Selecting a sentence pauses playback and opens explanation.

## AI-specific UI

AI is a capability, not the visual identity.

Prefer:

```text
Explain this
Why did they say it this way?
More natural examples
What's the nuance?
```

not:

```text
Ask OpenAI
Chat with AI
```

Provider branding belongs in Settings unless required for transparency or errors.

AI output should use normal product typography and contextual surfaces rather than default chat bubbles.

## Media principle

Let authentic content create visual richness.

Use actual YouTube thumbnails, video frames, creator identity, and Korean text rather than filling the product with generic decorative illustrations.

The interface frames the content; it does not compete with it.

## Motion

Use restrained motion to clarify state changes.

Typical duration:

```text
150–220ms ease-out
```

Use for overlays, selection, expanding detail, and hover state.

Avoid bouncing, confetti, decorative loops, or excessive spring animation.

## Dark theme

Dark mode is allowed but should remain warm and comfortable rather than true-black cyberpunk.

Suggested base:

```text
Canvas             #181715
Surface            #201F1C
Surface Elevated   #292724
Primary Ink        #F6F1E8
Secondary Ink      #C7C1B8
Muted              #918B82
Hairline           #38352F
```

Dark mode is an alternative theme, not the main brand identity.

## Accessibility

Minimum expectations:

- WCAG AA contrast where applicable;
- visible keyboard focus;
- controls usable without hover;
- minimum 44px mobile touch targets for primary actions;
- learning state never communicated by color alone;
- transcript keyboard navigation where practical;
- selected sentence and currently playing sentence remain distinguishable.

## Icons

Use one simple icon family such as Lucide.

Icons should be functional, familiar, and restrained. Do not place decorative icons beside every label.

## Loading and errors

Preserve layout with calm skeletons where useful.

Errors should be understandable and actionable.

Prefer:

```text
We couldn't load Korean captions for this video.
Try another video
```

rather than exposing internal adapter names or raw exceptions by default.

Technical details may be available behind a `Details` affordance.

## Component vocabulary

Create reusable domain components that reflect the product model:

```text
<VideoStudyLayout />
<Transcript />
<TranscriptLine />
<SentenceBreakdownPopover />
<KoreanSentence />
<KoreanPhrase />
<Translation />
<SentenceExplanation />
<GrammarExplanation />
<NuanceExplanation />
<LearningState />
<LearnPhraseAction />
<ReviewClip />
<ContentCard />
<ProgressComparison />
<AssistanceControl />
```

Generic primitives such as `<Card />`, `<Button />`, and `<Popover />` may exist underneath them but should not be the only design vocabulary.

## Component library

Tailwind, shadcn/ui, and Radix primitives are acceptable implementation tools.

They are not the design language.

Default library aesthetics MUST be adapted to project tokens and rules before becoming canonical product UI.

## Korean cultural influence

Use Korean influence subtly through:

- warm paper-like neutrals;
- muted persimmon;
- muted jade;
- Korean-first typography;
- generous negative space;
- contemporary Korean editorial sensibility.

Avoid:

- flag motifs throughout the UI;
- random Hangul as decoration;
- stereotypical traditional patterns;
- K-pop neon clichés;
- ornamental East Asian styling without meaning.

The Korean content itself provides most cultural identity.

## Anti-patterns

Do not:

- create generic SaaS KPI dashboards;
- turn every section into a card;
- use many competing brand colors;
- make the product childish;
- use terminal / developer-tool aesthetics;
- make AI the dominant visual object;
- expose translations more prominently than Korean;
- show all explanatory depth simultaneously;
- introduce navigation items for every feature;
- weaken the desktop workspace solely for mobile parity.

## Agent rules for user-facing work

Before implementation, agents MUST:

1. read `docs/PRODUCT.md`;
2. read this `DESIGN.md`;
3. identify which mode the feature belongs to: Home, Watch, Study, Review, Progress, Settings;
4. reuse existing domain-specific UI patterns where possible;
5. preserve Korean-first hierarchy and progressive disclosure.

Agents MUST NOT casually introduce:

- new brand colors;
- new fonts;
- arbitrary spacing values;
- new top-level navigation;
- new learning modes;
- gamification patterns;
- provider-branded AI UI;
- broad visual redesigns unrelated to the assigned task.

## Agent visual self-review

Before finishing a user-facing feature, ask:

```text
Is Korean the first thing my eye sees?
Does authentic content dominate the screen?
Is this the correct mode for this interaction?
Could anything visible be removed?
Is advanced explanation hidden until requested?
Did I accidentally create a SaaS dashboard?
Did I introduce unnecessary cards?
Are translations subordinate to Korean?
Does AI feel contextual rather than bolted on?
Would this remain comfortable during a 60-minute study session?
Does this still feel like Warm Korean Editorial?
```

If an important answer is no, revise before claiming the UI is complete.

## One-sentence test

Every major learning screen should pass:

> **Does this feel like a beautiful place to spend an hour understanding real Korean?**
