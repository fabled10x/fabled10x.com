# Social Thread — Opus 4.7 Intro

Promo thread for X/Twitter and LinkedIn. Same content, two format variants. Post after the video goes live; link the full video in the final post.

---

## X/Twitter thread (10 posts)

**1/**
The last six weeks paying for Claude have been dogshit.

Five-hour sessions burning out in 90 minutes. Single prompts blowing through weekly limits. Anthropic confirmed: people are hitting usage limits way faster than expected. Top priority for the team. Cool.

**2/**
Then the quality tanked.

An AMD senior director filed a GitHub issue backed by 6,852 Claude Code session files.

Median thinking length on Opus 4.6: 73% collapse since January.
Files read before editing: 6.6 → 2.0.
Third-party SWE-bench: -6 points in 6 weeks.

**3/**
Today. A few hours ago. Anthropic shipped Opus 4.7.

Nobody's used it long enough to know if the vibes actually match the numbers. The rate limit pain is not fixed.

But on paper? This is the first reason for hope in weeks.

**4/**
The headlines:

SWE-bench Pro: 53.4% → 64.3%. Retaking #1 from GPT-5.4 by 6.6 points.
CursorBench: 58% → 70%. Twelve points in one release.
Vision accuracy: 54.5% → 98.5%. Resolution tripled.

**5/**
Head-to-head:

Opus 4.7 / GPT-5.4 / Gemini 3.1 Pro

SWE-bench Pro: 64.3 / 57.7 / 54.2
GPQA Diamond: 94.2 / 94.4 / 94.3
BrowseComp: 79.3 / 89.3 / —

Coding: Opus wins.
Reasoning: three-way tie.
Search: GPT still wins.

**6/**
Here's what I can actually show you from my own code tonight.

Same-scope CRUD section, same day, same engineer, different model.

4.6 era (ad-6.2 Data Import API): 58 tests.
4.7 era (ad-7.1 CustomField CRUD): 94 tests.

Permission matrix alone: 8 → 30.

**7/**
n=1 caveat applies. One day, one repo, one engineer.

But on comparable scope CRUD work, the per-category density shift is visible:
— Security (STRIDE): 7 → 11
— Contract: 4 → 8
— Permission: 8 → 30
— Total: 58 → 94 (+62%)

**8/**
One thing to watch.

Opus 4.7 ships a new tokenizer. Same price per token ($5/$25 per million). But the same text can produce up to 1.35x as many tokens.

Same sticker. Higher bill for identical work.

Measure your shit first if you're on the API at scale.

**9/**
Other changes worth knowing:

— xhigh effort level (new default in Claude Code, between high and max)
— /ultrareview (multi-agent code review, catches cross-file issues)
— 4.7 follows instructions literally. Good if your prompts are tight. Bad if you relied on the model reading between the lines on 4.6.

**10/**
And one last thing.

Anthropic shipped 4.7 while openly admitting it doesn't match Claude Mythos — their unreleased model, available to 11 companies for cybersecurity work.

4.7 is the best model they'll sell you.
It's not the best they have.

Full 7-min breakdown: [LINK]

---

## LinkedIn post (single long-form, no threading)

**Headline:** Six weeks of pain, then Opus 4.7. First reason for hope in a while.

---

The last six weeks paying for Claude have been rough. Rate limits burning out in 90 minutes on Max-tier subscriptions. An AMD senior director filing a 6,852-session GitHub issue documenting a 73% collapse in Opus 4.6's median thinking length since January. Third-party benchmarks showing a six-point SWE-bench drop in six weeks.

Today, Anthropic released Claude Opus 4.7. Nobody has used it long enough to know if the vibes match the benchmarks yet, and the rate-limit situation isn't fixed. But on paper, this is the first reason for hope in a while.

**The coding crown is back.**

SWE-bench Pro — real GitHub issues, not a curated subset — has Opus 4.7 at 64.3%, up from 53.4% on Opus 4.6 and ahead of GPT-5.4 at 57.7%. CursorBench (autonomous coding in an IDE) jumped from 58% to 70%. For anyone building with AI agents, this is a meaningful upgrade.

**Reasoning has converged.**

GPQA Diamond is a three-way tie: Opus 4.7 at 94.2%, GPT-5.4 at 94.4%, Gemini 3.1 Pro at 94.3%. Nobody is winning on graduate-level reasoning anymore. The frontier models have hit the same ceiling.

**Vision is the sleeper upgrade.**

54.5% accuracy to 98.5%. Resolution tripled to 3.75 megapixels. If you've ever had Claude misread a screenshot or diagram, Opus 4.7 is a fundamentally different model for visual input.

**Evidence from one day of my own code.**

On April 16, I shipped ten TDD sections on one of my projects across both sides of the 4.7 release boundary. Apples-to-apples: a data-import CRUD API section on 4.6 this morning landed 58 tests. A CustomField CRUD section on 4.7 tonight landed 94. Permission matrix alone went from 8 tests to 30. Security (STRIDE): 7 to 11. Contract: 4 to 8.

n=1 caveat is honest and worth saying out loud. One engineer, one day, one repo. Not a benchmark. But if your work involves TDD'ing backend APIs, the per-category density shift is the kind of thing you'll feel immediately.

**One caveat to watch: the tokenizer.**

Same API price — $5 per million input tokens, $25 output. But the new tokenizer can inflate the same input by 1.0 to 1.35x. Same text, same code, up to 35% more tokens.

Same price per token is technically true. Same price per prompt is not guaranteed.

If you're running production API workloads, measure the token impact on your actual payloads before migrating. The migration guide acknowledges this; the headlines don't.

**Who should switch:**

- Claude Code / agentic workflows: now. Same price, strictly better at coding.
- API at scale: after measuring tokenizer impact.
- Agentic search: GPT-5.4 still leads (BrowseComp 89.3% vs 79.3%).
- Price-sensitive: Gemini 3.1 Pro at $2/$12 is less than half the price.

And the context: Anthropic released Opus 4.7 while publicly conceding it doesn't match their unreleased Claude Mythos model — available to 11 companies, locked behind a safety review. The best model they'll sell you is not the best model they have.

Full 7-minute video breakdown: [LINK]

Curious what the tokenizer impact looks like on your workloads, and whether your own section-level test coverage shifted the way mine did. Comments open.

#ClaudeCode #Opus47 #AIEngineering #LLMBenchmarks

---

## Posting checklist

- [ ] Replace `[LINK]` with the actual YouTube URL once published
- [ ] Attach the thumbnail image to the first X post and the LinkedIn post
- [ ] Attach the benchmark table image to X post #5
- [ ] Attach the test-coverage comparison slide (gamma Slide 8) to X post #6
- [ ] On LinkedIn, the benchmark table in the body text should format natively — preview before posting
- [ ] Schedule for same day as video — ideally 30-60 min after video goes live
- [ ] Pin post #1 of the X thread to profile for 48 hours
- [ ] Reply to early engagement within the first hour to boost reach
- [ ] Cross-post post #6 (test-coverage evidence) as a standalone if engagement is strong — it's the most novel claim in the thread
- [ ] Note: post #1 contains "dogshit" — review platform policies if this is a monetized/brand-safe account. LinkedIn version is intentionally profanity-free for professional register.
