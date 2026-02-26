# Feature: Configurable Working Directory

**Date**: 2026-02-25
**Branch**: `feat/configurable-working-directory`

## Problem

The dashboard currently operates on a single project directory set in `dashboard-config.json`. Users cannot:
- Switch between different project folders
- Point agents at external repositories
- Create new projects from scratch
- Have agents work on different directories simultaneously

## Design

### Approach: Multi-Project Manager with Active Project Switching

Add a **Projects** concept to the dashboard. Users can register, switch between, and create projects. Each project maps to a filesystem directory.

### Data Model

```typescript
interface Project {
  id: string              // slug, e.g. "my-app"
  name: string            // Display name
  path: string            // Absolute filesystem path
  createdAt: Date
  lastAccessedAt: Date
}

// Extended DashboardConfig
interface DashboardConfig {
  activeProjectId: string   // Currently selected project
  projects: Project[]       // All registered projects
  // Deprecated but kept for backward compat:
  projectPath: string       // Derived from active project
  projectName: string       // Derived from active project
}
```

### Server Changes

1. **`config.ts`** — Extend config to store `projects[]` and `activeProjectId`. Add migration logic: if old-format config exists (just `projectPath`/`projectName`), auto-create a project entry from it.

2. **New routes in `config.ts`**:
   - `GET /api/projects` — List all projects
   - `POST /api/projects` — Register a new project (validates path exists or creates it)
   - `DELETE /api/projects/:id` — Remove project from list (doesn't delete files)
   - `POST /api/projects/:id/activate` — Switch active project
   - `POST /api/projects/create` — Create a new project directory + initialize it

3. **`AgentService.ts`** — `loadAgents()` should accept a configDir override so agents can be loaded from the active project's `.claude/agents/` directory, with fallback to the dashboard's own agents.

4. **`ClaudeRunner.spawn()`** — Already accepts `projectPath` override. No changes needed.

5. **Ticket assignment** — When spawning an agent for a ticket, use the active project's path. Optionally allow per-ticket project override.

### Frontend Changes

1. **Project Switcher** — Dropdown in the top bar showing active project name. Click to switch.

2. **Project Manager Dialog** — Accessible from the switcher:
   - List of registered projects with paths
   - "Add Existing Folder" button — opens a path input field
   - "Create New Project" button — name + path input, creates directory
   - Delete (unregister) projects

3. **Path Input** — Text input for the absolute path (since browser file pickers can't select directories reliably for backend paths). Include a "Browse" button that calls a server endpoint to list directories.

4. **Directory Browser API** — `GET /api/filesystem/browse?path=/some/dir` — Returns directory listing for the given path. Used by the frontend to provide folder navigation.

### New Project Initialization

When "Create New Project" is used:
1. Create the directory if it doesn't exist
2. Initialize with `git init`
3. Create `.claude/agents/` with default agent configs (copy from templates)
4. Create a basic `.claude/dashboard-config.json`
5. Register in the dashboard's project list

### Migration

Existing `dashboard-config.json` with just `projectPath`/`projectName` gets auto-migrated:
```json
{
  "activeProjectId": "data-science-team-management",
  "projects": [
    {
      "id": "data-science-team-management",
      "name": "Data Science Team Management",
      "path": "/Users/.../Data Science Team Management",
      "createdAt": "2026-02-25T00:00:00Z",
      "lastAccessedAt": "2026-02-25T00:00:00Z"
    }
  ],
  "projectPath": "/Users/.../Data Science Team Management",
  "projectName": "Data Science Team Management"
}
```

### Security

- Directory browsing limited to user home directory by default
- Path traversal prevention on all filesystem endpoints
- Validate paths are absolute and within allowed boundaries

## Files to Change

### Server
- `packages/server/src/config.ts` — Extended config with projects
- `packages/server/src/types/Agent.ts` — Add `Project` interface
- `packages/server/src/routes/config.ts` — Project CRUD routes + directory browser
- `packages/server/src/services/AgentService.ts` — Dynamic configDir based on active project
- `packages/server/src/index.ts` — Wire up project-aware agent loading

### Client
- `packages/client/src/types/index.ts` — Add `Project` type
- `packages/client/src/services/api.ts` — Project API calls
- New: `packages/client/src/components/ProjectSwitcher/ProjectSwitcher.tsx`
- New: `packages/client/src/components/ProjectManager/ProjectManager.tsx`
- New: `packages/client/src/components/DirectoryBrowser/DirectoryBrowser.tsx`
- `packages/client/src/App.tsx` — Add ProjectSwitcher to header
- New: `packages/client/src/hooks/useProjects.ts` — Project state management

## Non-Goals

- Per-ticket project selection (future enhancement)
- Remote filesystem access (local only)
- Agent config sync between projects
