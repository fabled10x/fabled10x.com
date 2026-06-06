#!/usr/bin/env python3
"""
Analyze a Claude Code session JSONL file and bucket its content by message type.

Usage:
    python3 analyze-session.py <path-to-session.jsonl>

Claude Code writes session logs to:
    ~/.claude/projects/<escaped-project-path>/<session-id>.jsonl

Each line is one turn. This script sums the character count in each bucket
(user prompts, assistant text, tool calls, tool results, assistant thinking)
and prints a breakdown. Character count is a rough proxy for tokens
(~4 chars per token for English + code).
"""

import json
import sys
from pathlib import Path


def charlen(x):
    if isinstance(x, str):
        return len(x)
    if isinstance(x, (dict, list)):
        return len(json.dumps(x))
    return 0


def analyze(path: Path):
    buckets = {
        "user_prompt": 0,
        "assistant_text": 0,
        "assistant_thinking": 0,
        "tool_use_input": 0,
        "tool_result": 0,
        "other": 0,
    }
    counts = {k: 0 for k in buckets}

    with open(path) as f:
        for line in f:
            try:
                rec = json.loads(line)
            except json.JSONDecodeError:
                continue
            if rec.get("type") == "summary":
                continue
            msg = rec.get("message", {})
            role = msg.get("role")
            content = msg.get("content")

            if role == "user":
                if isinstance(content, str):
                    buckets["user_prompt"] += len(content)
                    counts["user_prompt"] += 1
                elif isinstance(content, list):
                    for block in content:
                        btype = block.get("type")
                        if btype == "tool_result":
                            buckets["tool_result"] += charlen(block.get("content", ""))
                            counts["tool_result"] += 1
                        elif btype == "text":
                            buckets["user_prompt"] += charlen(block.get("text", ""))
                            counts["user_prompt"] += 1
                        else:
                            buckets["other"] += charlen(block)
                            counts["other"] += 1
            elif role == "assistant" and isinstance(content, list):
                for block in content:
                    btype = block.get("type")
                    if btype == "text":
                        buckets["assistant_text"] += charlen(block.get("text", ""))
                        counts["assistant_text"] += 1
                    elif btype == "thinking":
                        buckets["assistant_thinking"] += charlen(block.get("thinking", ""))
                        counts["assistant_thinking"] += 1
                    elif btype == "tool_use":
                        buckets["tool_use_input"] += charlen(block.get("input", {}))
                        counts["tool_use_input"] += 1
                    else:
                        buckets["other"] += charlen(block)
                        counts["other"] += 1

    total = sum(buckets.values())
    print(f"\nSession: {path.name}")
    print(f"Total chars: {total:,}  (~{total // 4:,} tokens, rough)\n")
    print(f"{'bucket':<22} {'chars':>12} {'%':>6}  {'items':>6}")
    print("-" * 52)
    for k, v in sorted(buckets.items(), key=lambda x: -x[1]):
        pct = 100 * v / total if total else 0
        print(f"{k:<22} {v:>12,} {pct:>5.1f}%  {counts[k]:>6}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__, file=sys.stderr)
        sys.exit(1)
    analyze(Path(sys.argv[1]))
