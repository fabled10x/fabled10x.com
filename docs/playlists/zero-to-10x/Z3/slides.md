# Z3 — What AI Changed · Slides

**Runtime target:** 15–18 min
**Pillar:** Future
**Episode:** Z3 (Act 1: Orientation)
**Deck length:** 21 slides

---

## Slide 1 — Title

# Z3 — What AI Changed
### (and what it didn't)

*[Visual: Series card, episode 3 of 40, Act 1.]*

---

## Slide 2 — The loaded question

# Is AI replacing programmers?

*You've been asked this. You've wondered it. Your aunt has asked you at Thanksgiving.*

*The answer is more specific — and more interesting — than yes or no.*

*[Visual: Large text, single beat.]*

---

## Slide 3 — The short answer

## AI didn't replace programmers.
## It changed what programmers do.

**The skillset shifted. It didn't shrink.**

---

## Slide 4 — Quick history

## Programming has been getting easier for 70 years

- **1950s** — Punch cards
- **1970s** — Keyboards + text files
- **1990s** — IDEs + autocomplete
- **2010s** — GitHub Copilot (predictive autocomplete on steroids)
- **2022** — ChatGPT / Claude writing complete functions
- **2024–25** — Cursor, Claude Code — agentic coding tools
- **2026** — Where we are now

*[Visual: Horizontal timeline with milestone icons at each era.]*

---

## Slide 5 — The thing each layer did

## Every improvement made expressing intent **easier**.

- Punch cards → keyboards: faster expression
- Text files → IDEs: live feedback
- IDEs → autocomplete: less typing
- Autocomplete → AI: whole-feature generation

**None of them changed what the computer does. All of them changed how you talk to it.**

---

## Slide 6 — The shift, named

## Code author → Code director

|                  | Author             | Director                  |
|------------------|--------------------|---------------------------|
| Main output      | Code I typed       | Code I specified and reviewed |
| Bottleneck       | Typing speed       | Decision quality          |
| Skill gradient   | Who writes cleaner | Who judges sharper        |

*[Visual: Film director in a chair on the right side, typewriter on the left. Playful framing.]*

---

## Slide 7 — The junior analogy

## Working with AI is like having a very fast junior developer.

- **Eager** — will try anything
- **Fast** — types faster than you can read
- **Eager to please** — will confidently say "done!" before it is
- **Needs review** — because of all of the above

*If you've ever managed a junior, you already have intuition for this.*

---

## Slide 8 — What AI does well

## Things AI is genuinely great at:

- **Enumeration** — "give me 20 variants of this"
- **Pattern matching** — "like that, but with X"
- **Boilerplate** — setup, config, ceremony
- **Documentation drafts** — from code to prose
- **Test skeletons** — describe shape, get skeleton
- **Working from clear examples** — the more concrete, the better

*[Visual: Green checkmarks next to each bullet.]*

---

## Slide 9 — Why it's good at those

Each of those tasks has two properties:

1. **The pattern is visible** in the code or prompt
2. **Correctness is checkable** from nearby context

*When AI can see the pattern and verify against nearby signal, it wins.*

---

## Slide 10 — What AI does badly

## Things AI struggles with:

- **Judgment calls** — "is this architecture right for our team?"
- **Novel patterns** — things unlike its training data
- **State-shaped debugging** — bugs that depend on *when*, not *what*
- **Scope discipline** — it defaults to comprehensive
- **Business-domain context** — your users, your history, your constraints

*[Visual: Red X's next to each bullet.]*

---

## Slide 11 — Why it's bad at those

Each of those tasks has two properties:

1. **The pattern is not visible** in the code — it lives in the team, the history, the user
2. **Correctness depends on signal AI cannot see** — intent, trajectory, domain

*When the answer lives outside the context window, AI guesses plausibly and confidently wrong.*

*[Visual: A context window drawn as a small box. Arrows labeled "actual answer" pointing outside it.]*

---

## Slide 12 — This is Act 5, previewed

## Act 5 is eight full episodes on what AI can't do.

- Reading code critically (Z28)
- Systems thinking / debugging (Z29)
- Architecture decisions (Z30)
- Scope discipline (Z31)
- Security thinking (Z32)
- Performance intuition (Z33)
- The judgment test (Z34)

**When you get there, that's the most important act. Remember that now.**

*[Visual: Roadmap strip with Act 5 highlighted in accent color.]*

---

## Slide 13 — The new skillset map

## Old skills that stayed

- Systems thinking
- Debugging
- Architecture
- Code reading
- Communication

## New skills that arrived

- Prompting precisely
- Reviewing AI output
- Context management
- Delegating at scale

*[Visual: Two-column layout. Old and New.]*

---

## Slide 14 — The combined skillset is bigger

## The job didn't shrink.

- Everything you used to do — still matters
- **Plus** a new top layer of directing and reviewing AI
- Plus the judgment layer that AI makes more important, not less

*If anything, being a proficient developer in 2026 requires **more** skills than before. They're just differently distributed.*

---

## Slide 15 — Why this is good news for learners

## The old moat was memorization.
## The new moat is judgment.

- Memorization takes years and fades
- Judgment is teachable — and compounds
- The old moat was exclusionary (you had to already be good to catch up)
- The new moat is meritocratic (anyone who learns to judge well wins)

**This curriculum exists because of this shift.**

---

## Slide 16 — If AI can write working code, what's left for you?

## A short list:

- Deciding **what** to build
- Deciding **whether** what it built matches what you wanted
- Deciding **how** to integrate it with everything else
- Deciding **when** it's ready to ship
- Deciding **if** a better approach exists

*[Visual: Five decision icons in a horizontal row.]*

---

## Slide 17 — The prompt vs the answer

## AI produces answers. You produce questions.

- Bad prompt → bad answer (garbage in, garbage out)
- Good prompt → good answer (but you still have to review it)
- Great prompt → **you had to already know a lot to write the prompt**

**The bottleneck moved upstream. The skill moved upstream with it.**

---

## Slide 18 — Jobs that are worse vs better

### Worse positioned in 2026:
- Developers who only ever typed (the mass) 
- People trained on recall, not judgment
- Anyone whose main value was knowing syntax

### Better positioned:
- People who can read code critically
- People with domain taste
- People who can reason about systems
- **People learning now, from the judgment layer up**

---

## Slide 19 — The doom take, answered

## "AI is going to take all the dev jobs."

That take is half right.

- It will replace developers whose main job was what AI does well
- It will increase demand for developers who can do what AI does badly
- **Net effect depends entirely on which side of that line you fall on**

**This curriculum aims you at the second side.**

---

## Slide 20 — The hype take, answered

## "Prompting is the new programming."

That take is also half right.

- Prompting is a real skill
- But it works best when you already know what good code looks like
- A prompt without judgment is a gun without a target

**Prompting alone ≠ proficient. Prompting + judgment = proficient.**

---

## Slide 21 — Close

## The job didn't go away. It changed.
## The new job is more teachable than the old one.

**Next up: Z4 — the two mental models you'll use for the rest of your career.**

*[Visual: End card, Z4 preview. Subscribe prompt.]*
