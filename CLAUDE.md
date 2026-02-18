# Project Memory & Learning Rules

## Learning from Mistakes

When Claude makes a mistake or correction during development:

1. **Update `.claude/` configurations** to prevent the same mistake:
   - Add to relevant agent prompts if domain-specific
   - Update command templates if workflow-related
   - Create new skills/commands if pattern is reusable

2. **Document the lesson** in this file under "Learned Patterns" section

3. **Types of corrections to capture:**
   - Code patterns that failed and their fixes
   - API/library usage corrections
   - Architecture decisions that needed revision
   - Test patterns that caught bugs
   - Configuration mistakes

## Learned Patterns

<!-- Add lessons learned here as they occur -->

### Template Entry
```
### [Date] - [Brief Title]
**Mistake:** What went wrong
**Fix:** How it was corrected
**Prevention:** What was added to .claude/ to prevent recurrence
```

---

## Project Context

### Agent Team Dashboard
- Web-based Kanban for managing Claude agents
- Extends claude-task-viewer patterns
- Uses `.claude/agents/` for agent personas
- Monitors `~/.claude/tasks/` for task state

### Tech Stack
- Frontend: React + TypeScript + Vite
- Backend: Express + Node.js
- Real-time: Server-Sent Events (SSE)
- File watching: chokidar

### Key Directories
- `packages/server/` - Express backend
- `packages/client/` - React frontend
- `.claude/agents/` - Agent persona configs
- `docs/plans/` - Implementation plans

## Development Conventions

- TDD: Write failing test first, then implement
- Commit after each task completion
- Use TypeScript strict mode
- Prefer composition over inheritance
- Keep functions under 30 lines
- Name booleans as questions: `isActive`, `hasPermission`

## Testing

- Unit tests with Vitest
- Test files: `__tests__/*.test.ts`
- Minimum coverage: 80%
- Run: `npm test` at workspace level

## Commands Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start both server and client in dev mode |
| `npm run build` | Build all packages |
| `npm test` | Run all tests |
| `npm start` | Start production server |
