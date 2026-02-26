# Feature: System-Agnostic Provider Abstraction

**Date**: 2026-02-25
**Branch**: `feat/provider-abstraction`

## Problem

The dashboard is tightly coupled to Claude Code CLI (`spawn('claude', args)`). When someone forks the repo:
- They need Claude Code CLI installed
- They can't use direct API calls to Anthropic
- They can't use alternative AI providers (OpenAI, local models, etc.)
- No authentication — whoever has access to the server can use it

## Design

### Approach: Provider Interface + API Key Management

Abstract the agent execution behind a `Provider` interface. Ship with two providers: Claude CLI (current behavior) and Anthropic API (direct HTTP calls). Add a settings page for provider configuration and API key management.

### Provider Interface

```typescript
interface ProviderSession {
  sessionId: string
  status: 'running' | 'completed' | 'error' | 'waiting_input'
}

interface ProviderEvents {
  output: (data: { sessionId: string; content: string }) => void
  error: (data: { sessionId: string; content: string }) => void
  question: (data: { sessionId: string; question: string; options?: string[] }) => void
  close: (data: { sessionId: string; exitCode: number }) => void
}

interface AgentProvider extends EventEmitter {
  readonly id: string        // e.g. 'claude-cli', 'anthropic-api'
  readonly name: string      // e.g. 'Claude Code CLI', 'Anthropic API'
  readonly description: string

  // Check if this provider is available/configured
  isAvailable(): Promise<boolean>

  // Spawn a new agent session
  spawn(options: ProviderSpawnOptions): Promise<string>  // returns sessionId

  // Send user input to a running session
  sendInput(sessionId: string, input: string): boolean

  // Terminate a session
  terminate(sessionId: string): boolean

  // Get session info
  getSession(sessionId: string): ProviderSession | undefined
  getAllSessions(): ProviderSession[]
}

interface ProviderSpawnOptions {
  agentId: string
  systemPrompt: string     // The agent's system prompt from .md file
  userPrompt: string       // The task/ticket prompt
  projectPath: string
  model: string
  tools?: string[]
  ticketId?: string
}
```

### Providers

#### 1. `ClaudeCliProvider` (default)

Wraps current `ClaudeRunner` logic. Uses `spawn('claude', args)`.

**Requirements**: Claude Code CLI installed, available on PATH.
**Config**: None (uses system Claude installation).

#### 2. `AnthropicApiProvider`

Direct HTTP calls to Anthropic Messages API with tool use.

**Requirements**: Anthropic API key.
**Config**: `apiKey`, `baseUrl` (optional, for proxies).
**How it works**:
- Converts agent system prompt + user prompt into API messages
- Tool use: Maps allowed tools to Anthropic tool definitions
- Implements a simple agentic loop: send message → get tool calls → execute tools → send results → repeat
- Tool execution happens server-side (filesystem operations within projectPath)
- Questions detected from the model's responses

**Supported tools** (server-side execution):
- `Read` — Read files within projectPath
- `Write` — Write files within projectPath
- `Edit` — Edit files within projectPath
- `Glob` — Find files within projectPath
- `Grep` — Search within projectPath
- `Bash` — Execute commands (with configurable allowlist)

#### 3. Future: `OpenAiProvider`, `OllamaProvider`, etc.

Not implemented in this PR, but the interface supports them.

### Configuration & Settings

#### Provider Config in `dashboard-config.json`

```json
{
  "provider": {
    "active": "claude-cli",
    "configs": {
      "claude-cli": {},
      "anthropic-api": {
        "apiKey": "sk-ant-...",
        "baseUrl": "https://api.anthropic.com"
      }
    }
  }
}
```

**Security**: API keys stored in a separate `.claude/secrets.json` file (gitignored), not in the main config. The config only stores non-sensitive settings.

#### Settings Page (Frontend)

New `/settings` route with:
1. **Provider Selection** — Radio buttons for available providers
2. **Provider Configuration** — Per-provider settings form:
   - Claude CLI: Status check (is `claude` on PATH?), version display
   - Anthropic API: API key input (masked), test connection button
3. **Model Defaults** — Default model for new agents
4. **API Key Management** — Add/remove/rotate keys, masked display

### Authentication (Optional)

Simple token-based auth for the dashboard itself:
- `auth` section in config: `{ enabled: boolean, tokens: string[] }`
- When enabled, all API requests require `Authorization: Bearer <token>` header
- Frontend shows a login screen that stores the token in localStorage
- Tokens are pre-generated and stored in secrets.json (no user/password DB)
- Default: auth disabled (backward compatible)

### Server Architecture Changes

```
Before:
  index.ts → ClaudeRunner (spawns claude CLI)

After:
  index.ts → ProviderManager → [ClaudeCliProvider | AnthropicApiProvider]
                                        ↓
                               Same EventEmitter interface
                               (output, error, question, close)
```

`ProviderManager` handles:
- Loading available providers
- Managing the active provider
- Forwarding events from the active provider
- Provider switching at runtime

### Migration

1. Existing `ClaudeRunner` becomes the internal implementation of `ClaudeCliProvider`
2. All call sites that reference `ClaudeRunner` now go through `ProviderManager`
3. The `ProviderManager` exposes the same `spawn/sendInput/terminate` methods
4. Zero behavior change when using `claude-cli` provider (default)

## Files to Change

### Server — New Files
- `packages/server/src/providers/types.ts` — Provider interfaces
- `packages/server/src/providers/ProviderManager.ts` — Provider orchestrator
- `packages/server/src/providers/ClaudeCliProvider.ts` — Wraps ClaudeRunner
- `packages/server/src/providers/AnthropicApiProvider.ts` — Direct API provider
- `packages/server/src/providers/tools/` — Server-side tool implementations for API provider
- `packages/server/src/routes/settings.ts` — Settings/provider config routes
- `packages/server/src/middleware/auth.ts` — Optional auth middleware

### Server — Modified Files
- `packages/server/src/index.ts` — Use ProviderManager instead of ClaudeRunner directly
- `packages/server/src/routes/agents.ts` — Use ProviderManager
- `packages/server/src/routes/tickets.ts` — Use ProviderManager
- `packages/server/src/config.ts` — Add provider config + secrets management
- `packages/server/src/types/Agent.ts` — Add provider-related types

### Client — New Files
- `packages/client/src/pages/Settings/Settings.tsx` — Settings page
- `packages/client/src/components/ProviderConfig/ProviderConfig.tsx` — Provider settings
- `packages/client/src/components/LoginScreen/LoginScreen.tsx` — Auth gate
- `packages/client/src/hooks/useSettings.ts` — Settings state
- `packages/client/src/hooks/useAuth.ts` — Auth state

### Client — Modified Files
- `packages/client/src/App.tsx` — Add settings route, auth wrapper
- `packages/client/src/services/api.ts` — Add auth header, settings endpoints

## Non-Goals (This PR)

- OpenAI/Ollama providers (just the interface for future)
- User/password authentication (token-based only)
- Per-agent provider selection (global provider only)
- Tool sandboxing for API provider (trust the projectPath boundary)

## Open Questions Resolved

- **Q: Should API keys be in the config file?** A: No, separate `secrets.json` (gitignored).
- **Q: Full agentic loop in API provider?** A: Yes, with server-side tool execution for Read/Write/Edit/Glob/Grep/Bash.
- **Q: Auth required?** A: Optional, disabled by default for backward compatibility.
