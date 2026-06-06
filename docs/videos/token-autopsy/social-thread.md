# Social Thread — Token Autopsy

Promo thread for X/Twitter and LinkedIn. Same content, two format variants. Post after the video goes live; link the full video in the final post.

---

## X/Twitter thread (10 posts)

**1/**
Most advice about cutting Claude Code token costs is aimed at the wrong 1%.

I pulled apart a real 852K-char pipeline session — 850 turns, ~152K tokens.

Here's where the tokens actually live. 🧵

**2/**
Claude Code writes every session as JSONL to `~/.claude/projects/<project>/`.

One ~40-line Python script buckets every message by type.

Full script at the end of this thread.

**3/**
The distribution of a full pipeline run:

• tool_use_input:  38.4%
• tool_result:     32.8%
• user_prompt:     27.8%
• assistant_text:   1.0%

That last one — the model's prose — is the part "compression plugins" target.

**4/**
A 75% reduction on 1% of your bill saves you 0.75%.

The real weight is:
— code being Written/Edited (can't compress)
— file reads echoed into context (fixable)
— skill-body injections on every slash command (fixable)

**5/**
Lever #1 (biggest): tool-result hygiene.

— Grep `files_with_matches` first
— Read with `offset` + `limit` after Grep locates the target
— Bash: terse on success, full output only on non-zero exit
— Sub-agents for codebase scans (summary returns, raw output stays out of main context)

~10–20% savings.

**6/**
Lever #2: trim what loads every turn.

Your CLAUDE.md, MEMORY.md, AGENTS.md reload on every turn. Every unnecessary line is a tax on every turn of every session.

Be aggressive. Test each sentence: "would behavior change without this?" No → gone.

~3–8%.

**7/**
Lever #3: prune decorative prose from skill bodies.

Motivational framing, rationale for past decisions, restatement of the step above — none of it steers the model.

Kill the decorative. Keep the load-bearing.

~2–5%.

**8/**
Combined realistic target: 15–30% per pipeline run. Zero quality loss.

Compare: the output-compression plugin saves ~0.75%.

Different levers, different orders of magnitude.

**9/**
One optimization I almost shipped: inline all sub-skill bodies into one mega-pipeline skill. Better cache shape, ~$0.10/run savings.

Risk: all phase directives visible to the model from turn 0 → read-ahead contamination.

Modest win, compounding quality cost. Didn't ship.

**10/**
Measure before you optimize.

`/context` is a start. The JSONL logs are ground truth.

Full 9-min video breakdown + the Python script: [LINK]

Tell me what YOUR distribution looks like.

---

## LinkedIn post (single long-form, no threading)

**Headline:** Most advice about cutting Claude Code token costs is aimed at the wrong 1%.

---

I pulled apart a real 850-turn pipeline session — ~152K tokens — to figure out where the bytes actually go.

Claude Code writes every session as JSONL locally. A 40-line Python script (linked below) bucketed every message block by type. Here's what I found:

**Token distribution, one full pipeline run:**

• tool_use_input (args to tools — mostly code being written): **38.4%**
• tool_result (file reads, bash output echoed back): **32.8%**
• user_prompt (your input + skill-body injections on every slash command): **27.8%**
• assistant_text (the model's prose): **1.0%**

The last one — the model's prose — is the part "output compression" plugins target. A 75% reduction there saves you three-quarters of one percent of your bill.

**Where the actual savings live**, ranked:

1. **Tool-result hygiene (10–20%):** Grep before Read; use `offset`/`limit`; delegate codebase scans to sub-agents so raw output never enters the main context; make skills summarize, not echo.

2. **Trim always-loaded files (3–8%):** Every line in CLAUDE.md/MEMORY.md loads on every turn. Be ruthless — if removing the line wouldn't change behavior, it shouldn't be there.

3. **Prune decorative prose in skill bodies (2–5%):** Motivational framing, rationale, restatements. All decorative, none load-bearing. Remove.

4. **Consolidate Edit patterns (2–5%):** One `Write` beats five sequential `Edit`s when rewriting most of a file. Every tool call is tokens both ways.

Combined realistic target: **15–30% per run** without quality loss.

---

**The optimization I almost shipped and didn't:** inlining all sub-skill bodies into one mega-pipeline skill. Better cache shape, ~$0.10 savings per back-to-back run. But it made all phase directives visible to the model from turn 0 — and experienced Claude users know that content in context influences generation, regardless of blocking rules. Modest win, compounding quality cost. Skipped.

**Takeaway:** Measure before you optimize. `/context` is a start; the JSONL logs at `~/.claude/projects/` are ground truth. Output compression is a non-solution for tool-heavy workflows — the fat is in what the tools echo back.

Full 9-min video + Python analysis script: [LINK]

Curious what your session distribution looks like. Comments open.

#ClaudeCode #AIEngineering #DeveloperTools #PromptEngineering

---

## Posting checklist

- [ ] Replace `[LINK]` with the actual YouTube URL once published
- [ ] Attach the thumbnail image to the first X post and the LinkedIn post
- [ ] On X, consider adding a bar-chart image to post #3 for the visual hook
- [ ] On LinkedIn, attach the Python script as a document or link to a gist
- [ ] Schedule for weekday 9–11am your audience's timezone
- [ ] Pin post #1 of the X thread to profile for 48 hours
- [ ] Reply to early engagement with the JSONL path + script within the first hour to boost reach
