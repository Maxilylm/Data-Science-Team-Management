# Agent Team Dashboard

A web-based Kanban dashboard for managing and monitoring multiple Claude agents with personas, tools, and tasks in real-time.

## Features

- **Kanban Board**: Track tasks across Pending, In Progress, Completed, and Needs Input columns
- **Agent Panel**: View all configured agents, spawn new agent sessions, and stop running ones
- **Real-time Updates**: Live task status via Server-Sent Events
- **Input Handling**: Respond to agent questions directly from the dashboard
- **Live Feed**: Monitor all agent activity in real-time

## Installation

```bash
npm install
npm run build
```

## Usage

```bash
# Start the dashboard
npm start

# Start with auto-open browser
npm start -- --open

# Development mode (both server and client)
npm run dev
```

The dashboard runs at http://localhost:3456

## Configuration

Agents are configured via `.claude/agents/*.md` files with YAML frontmatter:

```yaml
---
name: eda-analyst
description: "Exploratory data analysis specialist"
model: sonnet
color: cyan
---

You are an expert Data Analyst...
```

### Supported Fields

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| name | Yes | filename | Display name for the agent |
| description | Yes | - | What the agent does |
| model | No | sonnet | Model to use (sonnet/opus/haiku) |
| color | No | gray | Color for UI display |
| tools | No | - | Comma-separated list of tools |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   React Frontend                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │AgentPanel│  │KanbanBoard│  │InputReq'd│  │LiveFeed │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────┘
                           │ HTTP/SSE
┌─────────────────────────────────────────────────────────┐
│                   Express Backend                        │
│  ┌────────────┐  ┌───────────┐  ┌──────────────────┐   │
│  │AgentService│  │TaskService │  │FileWatcher (SSE) │   │
│  └────────────┘  └───────────┘  └──────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │              ClaudeRunner (subprocess)            │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           │
                    ~/.claude/tasks/
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agents` | GET | List all configured agents |
| `/api/agents/:id` | GET | Get specific agent |
| `/api/agents/:id/spawn` | POST | Start agent with prompt |
| `/api/agents/:id/input` | POST | Send input to running agent |
| `/api/agents/:id/stop` | POST | Stop running agent |
| `/api/tasks` | GET | List all tasks |
| `/api/tasks/kanban` | GET | Get tasks grouped by status |
| `/api/tasks/needs-input` | GET | Get tasks awaiting input |
| `/api/events` | GET | SSE stream for real-time updates |
| `/health` | GET | Health check endpoint |

## Development

```bash
# Run tests
npm test

# Run in development mode
npm run dev
```

## Tech Stack

- **Frontend**: React, TypeScript, Vite, TanStack Query
- **Backend**: Express, Node.js, chokidar
- **Real-time**: Server-Sent Events (SSE)
- **Testing**: Vitest

## License

MIT
