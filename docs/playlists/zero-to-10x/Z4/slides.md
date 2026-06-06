# Z4 — The Mental Models You Need · Slides

**Runtime target:** 18–20 min
**Pillar:** Workflow
**Episode:** Z4 (Act 1: Orientation)
**Deck length:** 23 slides

---

## Slide 1 — Title

# Z4 — The Mental Models You Need
### Decomposition. State. Two tools. Forever.

*[Visual: Series card, Z4.]*

---

## Slide 2 — Why now

## Before we touch syntax —
## we build the thinking tools.

**Two mental models do most of the work in programming. Build them early. They transfer to every language, every framework, every AI tool, forever.**

*[Visual: Two icons side-by-side — a tree (decomposition) and a clock (state/time).]*

---

## Slide 3 — Two models, that's it

## Model one: Computational Thinking
### Decomposition · Abstraction · Pattern recognition

## Model two: Systems Thinking
### Cause · Effect · State over time

*Everything downstream is a flavor of these two.*

---

## Slide 4 — "I can get it to work" ≠ "I understand it"

## The gap between these two is where developers actually get made.

- "I can get AI to produce working code" — start
- "I understand what it's doing" — next
- "I can catch when it's subtly wrong" — proficient

**Mental models are how you close the gap.**

---

## Slide 5 — Model 1: Computational thinking

*[Visual: Poster-style slide. Three labeled sub-concepts: Decomposition, Abstraction, Pattern recognition. Clean typography.]*

---

## Slide 6 — Decomposition (non-code)

## Plan a birthday party.

Break the big problem into smaller ones:

- Guest list
- Venue
- Food
- Cake
- Decorations
- Invitations
- Day-of logistics

**Each sub-problem is smaller and more solvable than the whole.**

*[Visual: Tree diagram with "Birthday party" at the root and seven branches.]*

---

## Slide 7 — Decomposition (code)

## Same move. Different domain.

**"Build a blog."**

→ Break into:
- Show a list of posts
- Show a single post
- Write a new post
- Save a post to a database
- Handle comments

**→ Each becomes a function, a component, a file.**

---

## Slide 8 — Decomposition as a prompt

## The AI prompt for decomposition:

> "Before writing any code, break this feature into the smallest independently useful pieces. List them. Don't implement yet."

*This prompt alone dramatically improves AI output quality.*

---

## Slide 9 — Abstraction

## Abstraction: the simplest version that still works.

- Hide the details until you need them
- Name the thing at the level you're thinking about it
- Treat the parts below as a black box, for now

*[Visual: Nested boxes. Outer box labeled "sendEmail". Inner boxes getting progressively finer.]*

---

## Slide 10 — Abstraction in the wild

## Every "function" is an abstraction.
## Every "component" is an abstraction.
## Every "module" is an abstraction.

**When you call `sendEmail(user, subject, body)`, you don't care how SMTP works.**

*That's the power. You can think at one level while the others quietly work.*

---

## Slide 11 — Pattern recognition

## "Have I seen something like this before?"

- A login form is like a signup form
- A shopping cart is like a to-do list with prices
- A comment thread is like a chat with pagination

**Programming is pattern recognition at scale. AI is pattern recognition at scale too — yours has to be sharper to review its.**

---

## Slide 12 — Why pattern recognition matters with AI

## To catch AI's mistakes, you have to recognize when it has:

- Used a familiar pattern **where it doesn't fit**
- Missed a familiar pattern **where it would've helped**
- Drifted from the pattern it started with, mid-file

**Pattern drift is one of the four AI failure modes. You'll meet it in Act 5.**

---

## Slide 13 — Model 2: Systems thinking

*[Visual: Poster-style. Sub-concepts: State, Cause-and-effect, Change over time.]*

---

## Slide 14 — A program is not a snapshot

## A program is state that changes over time.

At any given moment, your app has:
- Values stored in variables
- Data in the database
- Users with sessions
- Requests in flight

**Every event changes that state. Debugging means asking: "what state led to this, and how did it get here?"**

---

## Slide 15 — Traffic light example

## The world's simplest state machine.

```
GREEN  ──30s──▶  YELLOW  ──5s──▶  RED  ──30s──▶ GREEN
```

**Three states. Three transitions. Time moves the world from one to the next.**

*[Visual: Animated traffic light cycling through the three states.]*

---

## Slide 16 — Real apps are bigger state machines

## A login flow:

```
LOGGED_OUT  ─(submits form)─▶  AUTHENTICATING
                                      │
                      ┌───(valid)─────┘
                      ▼
                   LOGGED_IN
                      │
                      └──(signs out)─▶ LOGGED_OUT
```

**Every feature has a state diagram. Most have one even when nobody drew it.**

---

## Slide 17 — State-shaped bugs

## Bugs that depend on what happened before.

- The user clicks "submit" twice
- Two API calls race each other
- A re-render triggers a stale effect

**You cannot see these in a static code read. You see them in the state-over-time picture.**

*This is Z29. Remember the term "state-shaped bug."*

---

## Slide 18 — Applying the models

## A real problem: "build a to-do list app."

**Decompose:**
- Add a to-do
- Show the list
- Mark as done
- Delete a to-do
- Persist across refresh

**State:**
- A list of to-dos (each with a done flag)
- Changes when: add, toggle, delete, load

**Now you can write code. The plan came first.**

---

## Slide 19 — Mental models before code (or prompt)

## The professional move:

1. **Decompose** the feature into pieces
2. **Identify** the state and what changes it
3. **Recognize** the pattern if there is one
4. **Then** — and only then — prompt AI or type code

**This is the move AI cannot make for you. And it's the move that makes every downstream step easier.**

---

## Slide 20 — The prompting upgrade

## Bad prompt

> "Build a to-do app."

## Good prompt

> "Build a to-do app with three components: Add, List, Item. State is an array of `{id, text, done}`. Persist to localStorage. Add unit tests for add, toggle, delete."

**The second prompt only works because you did the decomposition first.**

---

## Slide 21 — Why these two models

## Everything in programming downstream uses one or both:

- **Functions** → decomposition
- **Classes / components** → abstraction + state
- **React hooks** → state over time
- **Databases** → state, persisted
- **APIs** → state, shared
- **Bugs** → state, wrong

**Two models. Hundreds of applications.**

---

## Slide 22 — How to practice these

- **Decompose once a day** — pick any task (coding or not), break into three sub-tasks
- **Draw a state diagram before coding a feature** — even on paper
- **Ask "what changed?" when a bug appears** — that's the systems-thinking reflex

*Muscle memory takes weeks. Start this week.*

---

## Slide 23 — Close

## Decomposition. Abstraction. Pattern recognition.
## State over time.

**Two mental models. Every future episode uses them.**

*Next up: Z5 — your learning environment. One evening of setup, zero more friction for forty episodes.*

*[Visual: End card, Z5 preview.]*
