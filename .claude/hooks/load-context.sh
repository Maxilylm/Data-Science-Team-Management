#!/bin/bash
set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
CONTEXT=""

# Load active ticket assignment if server is running
TICKETS=$(curl -s --max-time 3 "http://localhost:4000/api/tickets" 2>/dev/null || echo "")
if [ -n "$TICKETS" ] && [ "$TICKETS" != "[]" ]; then
  NEEDS_HELP=$(echo "$TICKETS" | jq -r '[.[] | select(.status == "needs_help")] | length' 2>/dev/null || echo "0")
  IN_PROGRESS=$(echo "$TICKETS" | jq -r '[.[] | select(.status == "in_progress")] | length' 2>/dev/null || echo "0")
  UNASSIGNED=$(echo "$TICKETS" | jq -r '[.[] | select(.status == "unassigned")] | length' 2>/dev/null || echo "0")
  TOTAL=$(echo "$TICKETS" | jq -r 'length' 2>/dev/null || echo "0")
  CONTEXT="Dashboard server running. Tickets: ${TOTAL} total, ${IN_PROGRESS} in-progress, ${NEEDS_HELP} needs-help, ${UNASSIGNED} unassigned."

  # Show needs_help tickets prominently
  if [ "$NEEDS_HELP" != "0" ]; then
    HELP_DETAILS=$(echo "$TICKETS" | jq -r '[.[] | select(.status == "needs_help") | "- \(.title) (assigned to: \(.assignedTo // "none"))"] | join("\n")' 2>/dev/null || echo "")
    CONTEXT="${CONTEXT}\nAGENTS NEED HELP:\n${HELP_DETAILS}"
  fi
else
  CONTEXT="Dashboard server not running. Start with: npm run dev"
fi

# Check current git branch context
BRANCH=$(cd "$PROJECT_DIR" && git branch --show-current 2>/dev/null || echo "unknown")
DIRTY=$(cd "$PROJECT_DIR" && git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
STASHES=$(cd "$PROJECT_DIR" && git stash list 2>/dev/null | wc -l | tr -d ' ')

CONTEXT="${CONTEXT}\nGit: branch=${BRANCH}, ${DIRTY} uncommitted changes, ${STASHES} stashes."

# Check for agent branches with unmerged work
AGENT_BRANCHES=$(cd "$PROJECT_DIR" && git branch --list "feature/*" --list "refactor/*" --list "fix/*" 2>/dev/null | wc -l | tr -d ' ')
if [ "$AGENT_BRANCHES" != "0" ]; then
  CONTEXT="${CONTEXT} ${AGENT_BRANCHES} feature branches exist."
fi

echo -e "$CONTEXT"
