# Z2 — What Code Actually Is · Transcript

**Runtime target:** 15–18 min
**Word count:** ~2,350 words @ ~150 wpm ≈ 15.5 minutes
**Voice:** Grounded, patient, zero jargon until earned.

---

## 1 · The question

*[Slides 1–2]*

What is code, really?

Not "what language should I learn." Not "what framework is hot this year." Not "Python or JavaScript." Those are downstream questions. Good questions, eventually. But every answer to them rests on a thing underneath — the actual concept of what code *is* — and most courses never define it. They jump straight to syntax.

We're not doing that.

Fifteen minutes from now you'll have a one-sentence definition of code that every professional developer quietly agrees on, even when they couldn't articulate it out loud. And you'll have the mental model that makes every language, every framework, every AI tool, slot into the same small idea.

Let's start with something you already know.

---

## 2 · The recipe

*[Slides 3–4]*

You've seen a recipe before.

"Preheat the oven to 350. Mix the flour, sugar, and eggs in a bowl. Pour the batter into a pan. Bake for 30 minutes."

That's instructions. A recipe is instructions for a human. And the human reads them, interprets them where needed — "room temperature butter" means something slightly different in July than in January — and produces a cake at the end. Or something close to one.

A program is the same thing, for a different reader.

Instead of a human interpreting words, a machine reads instructions and executes them. Instead of "preheat the oven," it's "store the value two into a variable called `flour`." Instead of "mix," it's "add these three numbers and save the result." Instead of "bake," it's "print the result to the screen."

Different words. Different reader. Same idea.

---

## 3 · The definition

*[Slide 5]*

Here's the whole thing. One sentence:

**Code is instructions a computer can follow.**

That's it. That's the definition. Every programming language, every framework, every AI-generated line of TypeScript you'll review in Act 5, every deployed system on the internet — all of it is instructions a computer can follow. Some are short. Some are millions of lines long. Some are in languages that look like English. Some look like hieroglyphs. Under the hood, they're the same thing.

When you see a developer write code, what they are literally doing is producing a set of instructions a computer will follow. When you see an AI write code, same thing — it's producing instructions a computer will follow. When you review AI's code, what you're doing is reading those instructions and asking "will these actually do what we want?"

Everything else in programming — the languages, the frameworks, the tools, the methodologies — is detail on top of this foundation. Important detail. Useful detail. But it rests on this.

---

## 4 · What a computer actually does

*[Slides 6–8]*

So what does a computer *do* with those instructions?

Here's the whole trick — and I mean the whole trick, this is not a simplification I'm going to take back later. Every CPU, every processor, every chip inside every machine on the internet, runs the same three-step loop. Billions of times per second:

Step one: read the next instruction.
Step two: execute it.
Step three: move on to the one after that.

Read. Execute. Move on. Repeat. Forever.

That's what a computer does. That is the only thing a computer does.

Now — a computer has exactly two advantages over a human running the same loop with a cookbook. One: it's very fast. Billions of instructions per second fast. And two: it's very literal. It does exactly what the instruction says. Not what the instruction meant. Not what you hoped the instruction would do. What the instruction *literally says*.

Neither of those is intelligence. Both of those are useful. And both have consequences.

The fast part is the part you already have intuition for. Computers are fast. Fine. But the literal part is the one that trips up every new developer — and every AI developer, because AI inherits this too.

If you tell a computer the wrong thing very clearly, it will do the wrong thing very fast. It will not ask if you meant something else. It will not say "hmm, that variable doesn't exist, want me to use the similarly-named one?" It will not look at your off-by-one error and go "oh, you probably meant to stop at ten, not nine." It will just do what you said.

This is the part programming is really about. Not typing. Not memorization. It's about saying precisely what you mean, because the reader has no imagination. AI helps you say it. But the precision still has to come from somewhere. From you.

---

## 5 · Why we don't write binary

*[Slides 9–11]*

Let me show you the level the CPU actually operates at.

*[Cue slide 9 — binary text]*

That string of ones and zeros spells "HELLO." That's the level the processor is really reading. Not English. Not JavaScript. Bits. Ones and zeros. Voltages, actually — each one is an electrical signal flipping on or off.

Nobody writes this. Nobody has written at this level for decades. But if you dug deep enough into any program running on your laptop right now, that's what it eventually turns into.

So why don't we write it? Because we invented layers.

Assembly came along and gave us human-readable names for the CPU's instructions. Still tedious, but readable. Then C and the system languages came along and gave us structures, functions, abstractions. Then higher-level languages like JavaScript made expressing intent even easier. Then frameworks like React made whole categories of problems ten lines of code instead of a thousand. Then AI came along and made natural-language descriptions compile into frameworks.

Every layer does the same thing: it hides the layer below so you can focus on the layer above. Every layer adds leverage. None of them change what the computer is actually doing — it's still running that read-execute-next loop billions of times per second, on ones and zeros — but each one lets you think in bigger ideas while the layers handle the details.

**AI is just the newest layer.**

It didn't replace programming. It added a floor on top of the stack. You still have to know what you're asking for. You still have to know whether the answer makes sense. That's the part the layer doesn't do for you.

---

## 6 · A five-line program

*[Slides 12–15]*

Let me show you a real, working program. Five lines. Every line does one thing. By the end of this section you will have read a program and understood exactly what it does — which is more than a lot of self-taught developers can honestly claim.

*[Cue code on slide 12]*

```js
const name = "Alice"
const hour = new Date().getHours()
const isMorning = hour < 12
const greeting = isMorning ? "Good morning" : "Good afternoon"
console.log(`${greeting}, ${name}`)
```

Five lines. Let's walk through them.

**Line one.** `const name = "Alice"`. This says: remember the word "Alice," and from now on call it `name`. Store it in a labeled box. The box is called `name`. What's inside the box is the text "Alice." When we want to use the text later, we ask for `name` and the computer looks in the box.

**Line two.** `const hour = new Date().getHours()`. This says: ask the system clock what hour it is right now. Store that number in a box called `hour`. If it's 2 PM when we run this, the box contains the number 14. If it's 9 AM, the box contains 9.

**Line three.** `const isMorning = hour < 12`. This says: is the number in the `hour` box less than 12? Store the answer — true or false — in a box called `isMorning`. At 9 AM, this box contains `true`. At 2 PM, it contains `false`.

**Line four.** `const greeting = isMorning ? "Good morning" : "Good afternoon"`. This is the decision. If `isMorning` is true, put "Good morning" in a box called `greeting`. Otherwise, put "Good afternoon." Same `greeting` box either way — just different text in it depending on the time.

**Line five.** `console.log(`${greeting}, ${name}`)`. This says: take the word in the greeting box, put a comma and a space after it, then add the word in the name box, and print the whole thing to the screen.

*[Cue slide 14 — terminal demo]*

Now watch me run it. Terminal. `node greet.js`. The computer reads line one. Stores "Alice." Reads line two. Asks the clock, gets back — let's say it's 2:34 PM — stores 14. Reads line three. Checks: is 14 less than 12? No. Stores `false`. Reads line four. `false`, so picks "Good afternoon." Reads line five. Prints "Good afternoon, Alice."

That's it. That is programming.

Every web app you've ever used, every mobile app on your phone, every backend system that processes billions of dollars a day — all of it is that same loop, at bigger scale. Five-line programs become fifty-line programs become five-hundred-line programs become five-hundred-thousand-line systems. But every one of them is still a sequence of instructions, read one after the other, by a machine that is fast and literal.

The loop doesn't change. The scale does.

---

## 7 · What makes a good programmer

*[Slides 16–17]*

OK. So if code is instructions, and every language is just a way of expressing instructions, and AI can now produce instructions from English — what makes someone a good programmer?

It is not typing speed. It never was, and definitely isn't now. I type about 80 words a minute and I've worked with developers who type 40 and write better code than I do. And I've seen people who type 120 ship absolute garbage.

It is not memorizing syntax. You don't need to know every method on every object. You need to know enough to read code fluently and look up what you don't know. AI has effectively eliminated the part of the skill that was pure recall.

It is not "thinking like a computer." I'm sorry, I know that's a cliché, but it's not actually helpful. Computers don't think. They execute. Thinking like a computer means being boring and literal, and that's not something to aspire to.

Good programming is three things.

**One: clear thinking.** The ability to take a fuzzy problem — "make a form that lets users sign up" — and decompose it into pieces small enough that each piece can be stated as an instruction. That's the first move. And it's a move AI does not do for you, because AI doesn't know what *your* users need. You do.

**Two: careful reading.** The ability to look at a block of code — yours, someone else's, or AI's — and accurately understand what it does. Not what it looks like it does. What it actually does. In an AI era, where you will be reading a lot more code than you write, this is the highest-leverage skill you can build. Most developers don't train this deliberately. We'll train it deliberately in Z15.

**Three: honest testing.** The ability to know the difference between "I think this works" and "I have verified this works." These are completely different states. The first one is opinion. The second one is evidence. The entire practice of professional software development is the move from the first to the second. It's why tests exist. It's why code review exists. It's why I care so much about it that a whole act of this curriculum — Act 5 — is about catching the subtle-wrong that AI and humans both produce.

Clear thinking. Careful reading. Honest testing.

These three skills predate JavaScript. They predate the personal computer. In their general form — decompose a problem, read carefully, verify your answer — they predate electricity. They are not going anywhere. AI didn't change them. AI just changed the tool we use while we practice them.

---

## 8 · The anti-temptation

*[Slide 18]*

Here's the temptation I want you to resist.

You're going to notice, as we go, that AI can produce working code faster than you can understand it. It's going to be tempting — genuinely tempting — to skip the understanding and trust the output.

Don't.

The programmers who thrive with AI are the ones who can read every line AI produced and explain what it does. They review the generated code the way a senior engineer reviews a junior's pull request — with curiosity and skepticism in equal measure.

The programmers who struggle with AI are the ones who can't read what it produced. They stare at a failing program and they have no idea where to look, because every line feels alien. They are at AI's mercy. They ship whatever the output of a prompt was, hope it works, and panic when it breaks.

Fundamentals are not optional. They are reading comprehension for the AI era. You are learning them so that, when the AI produces ten lines of JavaScript, those ten lines are not a black box to you — they're just ten instructions. Some right. Some maybe wrong. All readable.

That's why Z2 exists. That's why we spent fifteen minutes defining what code is before we wrote any. Everything from here compiles down to this.

---

## 9 · Close

*[Slides 19–20]*

One sentence to take with you:

**Code is instructions a machine follows, very fast and very literally. Your job is making those instructions say what you actually mean.**

That's the whole game. Every episode from here is a different flavor of that game.

Next up is Z3 — *What AI Changed*. Because now that you know what code is, we can be precise about what AI actually did to the job and what it didn't. I'm going to try to talk you out of both the hype and the doom at the same time. Fifteen minutes. I'll see you there.

Thanks for being here.

Let's go.

*[End card · 5s]*
