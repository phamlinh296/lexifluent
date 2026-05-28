# Flashcard System — Product Vision

## Core Philosophy

**Context over translation. Usage over memorization. Collocation over isolated words.**

Users do NOT want:
- Dictionary-style "word → definition" cards
- Translation-only learning
- Passive review without production

Users WANT:
- Practical collocations they can use immediately in writing/speaking
- Sentence-level contextual learning
- Fast, low-friction daily review

## Priority Card Types (implement in order)

| Type | Example Front | Example Back |
|------|--------------|--------------|
| CLOZE | "The policy had _____ effects on the economy." | "detrimental" |
| COLLOCATION | "_____ to the environment" | "detrimental to" |
| BASIC | "detrimental" | "harmful; causing damage (formal/IELTS)" |
| GRAMMAR_CORRECTION | "very important → ?" | "crucial / pivotal / plays a vital role" |

## Cloze-First Learning

Default to CLOZE cards whenever an example sentence is available.
Prefer blanking the **full collocation phrase** over just the single word.

✓ "Governments must _____ environmental degradation." → "address"
✓ "_____ to children's development" → "detrimental to"
✗ "The word _____ means harmful." → avoid

## IELTS Integration Goals

Each word should connect to:
- Task 2 essay topics: environment, technology, education, health, society, economy
- Band-level relevance: B2 words → 6.5–7.0; C1/C2 words → 7.5–8.0
- Writing upgrade: replace "good for" → "beneficial to", "bad for" → "detrimental to"

## Anti-Boredom Design Principles

- Cap daily session at 20 cards (reduces overwhelm)
- Due cards sorted to front of session
- Streak system for daily habit
- Varied card types within a session (CLOZE + COLLOCATION + BASIC)

## Planned Review Modes (future)

1. Cloze fill (current)
2. Collocation matching
3. Typing recall
4. Synonym selection
5. IELTS rewrite challenge

## What NOT to Build (yet)

- Audio/pronunciation recording
- PDF/YouTube import
- Image layer
- Full personalization ML engine
