#!/bin/bash

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
ISSUES=""

# Check for leftover window.confirm() in production code
CONFIRM_FILES=$(grep -rl "window\.confirm\|[^.]confirm(" "$PROJECT_DIR/packages/client/src" \
  --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "__tests__" | grep -v "node_modules" || true)
if [ -n "$CONFIRM_FILES" ]; then
  CONFIRM_COUNT=$(echo "$CONFIRM_FILES" | wc -l | tr -d ' ')
  ISSUES="${ISSUES}\n- window.confirm() still in production code (${CONFIRM_COUNT} files)"
fi

# Check for excessive console.log in production code (not tests)
LOG_FILES=$(grep -rl "console\.log" "$PROJECT_DIR/packages/client/src" "$PROJECT_DIR/packages/server/src" \
  --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "__tests__" | grep -v "node_modules" || true)
if [ -n "$LOG_FILES" ]; then
  LOG_COUNT=$(echo "$LOG_FILES" | wc -l | tr -d ' ')
  if [ "$LOG_COUNT" -gt 3 ]; then
    ISSUES="${ISSUES}\n- Excessive console.log statements (${LOG_COUNT} files)"
  fi
fi

# Check for staged or modified tracked files (ignore untracked)
DIRTY=$(cd "$PROJECT_DIR" && git status --porcelain 2>/dev/null | grep -v '^??' | wc -l | tr -d ' ')
if [ "$DIRTY" -gt 0 ]; then
  ISSUES="${ISSUES}\n- ${DIRTY} uncommitted tracked changes - consider committing before stopping"
fi

if [ -n "$ISSUES" ]; then
  echo -e "Potential issues before completion:${ISSUES}" >&2
  exit 2
fi

echo "Pre-completion checks passed."
exit 0
