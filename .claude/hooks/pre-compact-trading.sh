#!/bin/bash
# Pre-compaction hook: outputs critical context for the compactor to preserve.
# This ensures the post-compaction agent re-reads trading rules and state.

STATE_FILE=".claude/trading-state.json"

echo "=== CRITICAL: POST-COMPACTION INSTRUCTIONS ==="
echo ""
echo "After compaction completes, you MUST re-read these files before taking ANY action:"
echo ""
echo "1. .claude/skills/coinbase-trading/SKILL.md — Complete trading rules, workflow (5 phases), order types, risk management"
echo "2. .claude/rules/trading.md — Critical rules (budget sacred, preview before order, stop-loss sacred, state persistence)"
echo "3. .claude/skills/coinbase-trading/strategies.md — Signal scoring, strategy configs, false breakout rules"
echo "4. .claude/skills/coinbase-trading/state-schema.md — State file structure and validation rules"
echo "5. .claude/skills/coinbase-trading/phases/ — Phase-specific workflows (phase-manage.md, phase-enter.md, phase-retrospective.md)"
echo "6. analysis/retrospective.md — Learned beliefs and parameter hints (Current Beliefs section is critical)"

if [ -f "$STATE_FILE" ]; then
  echo ""
  echo "7. .claude/trading-state.json — Current session state (MUST read to know positions, budget, trade history)"
  echo ""
  echo "=== CURRENT TRADING STATE SNAPSHOT ==="
  cat "$STATE_FILE"
  echo ""
  echo "=== END STATE SNAPSHOT ==="
fi

echo ""
echo "DO NOT continue trading without re-reading files 1-6. Context drift after compaction causes rule violations."
echo "=== END POST-COMPACTION INSTRUCTIONS ==="
