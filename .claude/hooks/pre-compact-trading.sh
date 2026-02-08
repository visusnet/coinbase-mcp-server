#!/bin/bash
# Pre-compaction hook: outputs critical context for the compactor to preserve.
# This ensures the post-compaction agent re-reads trading rules and state.

STATE_FILE=".claude/trading-state.json"

echo "=== CRITICAL: POST-COMPACTION INSTRUCTIONS ==="
echo ""
echo "After compaction completes, you MUST re-read these files before taking ANY action:"
echo ""
echo "1. .claude/skills/coinbase-trading/SKILL.md — Orchestrator: session management, workflow phases, sub-skill invocation pattern"
echo "2. .claude/rules/trading.md — Critical rules (budget sacred, preview before order, stop-loss sacred, state persistence)"
echo ""
echo "The orchestrator invokes sub-skills for each phase. Each Skill() call freshly reads the sub-skill's SKILL.md:"
echo "  - Skill(\"trading-analysis\")  — Phase 1: Data collection & technical analysis"
echo "  - Skill(\"trading-positions\") — Phase 2: Position management (SL/TP, trailing, rebalancing)"
echo "  - Skill(\"trading-execution\") — Phase 3: Signal aggregation & order execution"
echo "  - Skill(\"trading-report\")    — Phase 4: Structured report output"
echo ""
echo "You do NOT need to manually re-read the sub-skill files. Just invoke them via Skill() and they will be freshly loaded."

if [ -f "$STATE_FILE" ]; then
  echo ""
  echo "3. .claude/trading-state.json — Current session state (MUST read to know positions, budget, trade history)"
  echo ""
  echo "=== CURRENT TRADING STATE SNAPSHOT ==="
  cat "$STATE_FILE"
  echo ""
  echo "=== END STATE SNAPSHOT ==="
fi

echo ""
echo "DO NOT continue trading without re-reading files 1-2 and the state file. Then invoke sub-skills as usual."
echo "=== END POST-COMPACTION INSTRUCTIONS ==="
