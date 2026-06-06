# Social Thread — Auto Mode vs the Allowlist Skill

Promo thread for X/Twitter and LinkedIn. Same content, two format variants. Post after the video goes live; link the full video in the final post.

---

## X/Twitter thread (9 posts)

**1/**
Claude Code asks permission every time it wants to run a command.

If you've been using it for a while, you've clicked "allow" so many times your thumb hurts and you've stopped reading the prompts — which is exactly what permission prompts were supposed to prevent.

**2/**
Opus 4.7 shipped two ways to fix this.

One is a new permission mode called `auto`. An LLM classifier decides per-call whether to let the command run.

The other is a skill, `/fewer-permission-prompts`, that writes a static allowlist from your transcripts.

**3/**
Auto mode is elegant. `defaultMode: "auto"` in `settings.json`, done. No rules to write.

But a language model is making a judgment call on every tool invocation. Tokens spent. Latency added. Per call. Forever.

You are paying Claude to decide if `ls` is safe.

**4/**
The allowlist skill is the opposite.

Scans your last 50 transcripts. Drops commands Claude Code already auto-allows (head/tail/grep/git status/etc.). Drops mutations (rm/git push). Drops arbitrary-code wildcards (npx */bash *).

What's left goes into `.claude/settings.json`.

**5/**
I ran it on my partymasters repo yesterday.

Top 6 patterns across 50 recent sessions:
— npm test (262)
— npx jest (171)
— npx tsc (112)
— npm run lint (100)
— npm run build (51)
— git fetch (11)

707 tool calls. Now zero prompts. Zero classifier invocations.

**6/**
The tradeoff:

| | Auto Mode | Allowlist |
|---|---|---|
| Cost per call | Classifier tokens | Zero |
| Latency | Added | Zero |
| Auditable | "LLM judged" | git diff |
| Team-share | No | Yes (committed) |
| Long tail | Strong | Weak |
| Hot path | Weak | Strong |

**7/**
Auto mode wins on the long tail. Commands you've never run. One-off pipelines. Unknown codebases.

The allowlist wins on the hot path. The 6 commands you run 700 times a week. Team-shared rules. Auditable in PRs. Zero tokens.

They solve different halves of the problem.

**8/**
The real move is both.

Claude Code checks the static allowlist first. Matches run, no classifier. Misses fall through to auto mode for judgment.

Allowlist absorbs the hot path, classifier handles the tail. That's the shape that minimizes cost without sacrificing safety.

**9/**
If you only use one: use the allowlist.

A classifier that costs tokens to decide if `ls` is safe is a tax you pay on every session forever. A static allowlist costs you 30 seconds a quarter.

Run `/fewer-permission-prompts`. Review the diff. Commit it.

Full video: [LINK]

---

## LinkedIn post (single long-form, no threading)

**Headline:** Opus 4.7 shipped two ways to reduce Claude Code permission prompts. One costs tokens forever. The other costs 30 seconds a quarter.

---

Claude Code asks for permission every time it wants to use a tool. For anyone doing serious work with AI agents, the prompts add up fast — clicking "allow" so many times per day that you stop reading the commands, which defeats the purpose.

Opus 4.7 shipped two features aimed at this problem. They take opposite approaches.

**Auto mode** is a new permission setting (`defaultMode: "auto"`). When on, an LLM classifier judges each tool invocation — safe, prompt, or block — using three customizable rule sections (`autoMode.allow`, `autoMode.soft_deny`, `autoMode.environment`). One toggle. No rules to maintain. The classifier adapts to new commands you've never run before.

The cost: every uncertain tool call fires an LLM decision. Tokens spent. Latency added. Per call. For high-volume agentic workflows, the classifier tax compounds quickly.

**`/fewer-permission-prompts`** is a skill that takes the opposite approach. It scans your last 50 session transcripts, extracts every bash and MCP call, filters to read-only patterns (dropping mutations and arbitrary-code wildcards), and writes the top results into `.claude/settings.json` as a static allowlist.

I ran it on one of my own repos this week. Six patterns — `npm test`, `npx jest`, `npx tsc`, `npm run lint`, `npm run build`, `git fetch` — accounted for 707 tool calls across 50 sessions. Six lines added to `settings.json`, committed to git. Those calls now bypass permission checks entirely. No classifier invocations. No tokens. Teammates inherit the rules when they pull.

**The tradeoffs, laid out:**

- Auto mode is strong on the long tail (one-off commands, unknown codebases) and weak on the hot path (frequent repeat commands where the classifier tax compounds).
- The allowlist is strong on the hot path (zero-cost short-circuit, team-shareable, auditable) and weak on the long tail (requires a new rule for unfamiliar commands).

**The hybrid solves both halves.** Claude Code checks the static allowlist first. Matches run immediately — no classifier, no tokens. Misses fall through to auto mode. The allowlist absorbs the hot path; the classifier handles what it doesn't cover.

For teams and API-scale workloads, the allowlist matters disproportionately. A `settings.json` entry is reviewable in a pull request. An LLM judgment is not. Cost control also favors static rules — at volume, the classifier bill can be substantial, and every command that short-circuits through the allowlist is one the classifier never has to evaluate.

For solo developers in small projects, auto mode alone is often fine. Classifier cost is real but manageable at low volumes.

If you only use one of these features, use the allowlist. A classifier that costs tokens to decide whether `ls` is safe is a tax you pay forever. A static allowlist costs you thirty seconds a quarter.

Full video breakdown, including side-by-side terminal demos and the real scan output: [LINK]

#ClaudeCode #Opus47 #AIEngineering #DeveloperProductivity

---

## Posting checklist

- [ ] Replace `[LINK]` with the actual YouTube URL once published
- [ ] Attach the thumbnail image to the first X post and the LinkedIn post
- [ ] Attach the tradeoff table image (Slide 7 from the Gamma deck) to X post #6
- [ ] Attach the scan-output table image (Slide 5) to X post #5 — this is the most novel claim, worth its own visual
- [ ] Schedule for same day as video — ideally 30-60 min after video goes live
- [ ] Pin post #1 of the X thread to profile for 48 hours
- [ ] Reply to early engagement within the first hour to boost reach
- [ ] Cross-post post #5 (the real scan output) as a standalone if engagement is strong — the concrete numbers are the thread's best differentiator
- [ ] LinkedIn version is intentionally profanity-free; X version is mild. No heavy profanity in either — this is a tools-comparison, not a rant.
- [ ] If auto mode has been out more than 2 weeks at post time, swap post 9's "full video" CTA for "follow-up empirical cost post in 60 days"
