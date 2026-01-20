# Instant Services Manager

TUI manager for all Instant services with sidebar navigation.

## Usage

```bash
# Install dependencies (first time only)
cd infra/tui
bun install

# Run the TUI
./run.js
# or
node run.js
```

## Features

- **Auto-start all services** - Temporal Server, Temporal Worker, Go API, Python Agent, Next.js Client
- **Sidebar navigation** - Left pane shows all services with current selection highlighted
- **Single service view** - Right pane shows logs from the currently selected service
- **Keyboard navigation** - Use `k`/`j` (or arrow keys) to navigate between services
- **Ctrl+C to stop** - Exits and stops all services gracefully

## Layout

```
┌──────────────┬─────────────────────────┐
│   Services   │                         │
│──────────────│                         │
│▶ Temporal    │                         │
│  Temporal    │    Selected Service     │
│  Go API      │    Logs (tail -f)       │
│  Python      │                         │
│  Next.js     │                         │
│              │                         │
│ ↑/↓: Navigate│                         │
│ Ctrl+C: Exit │                         │
└──────────────┴─────────────────────────┘
```

## Navigation

- **Arrow keys** (`↑`/`↓`) or **Mouse** - Navigate sidebar and switch service views
- **`Tab`** - Switch focus between sidebar and log view (for scrolling)
- **`q`** or **`Ctrl+C`** - Stop all services and exit

## Scrolling Logs

When focused on a log view (press `Tab` to focus):
- **`↑`/`↓`** or **`j`/`k`** - Scroll one line up/down
- **Page Up**/ **Page Down** or **`Ctrl+B`**/ **`Ctrl+F`** - Scroll one page up/down
- **`Home`** or **`g`** - Jump to top of logs
- **`End`** or **`G`** - Jump to bottom of logs
- **Mouse wheel** - Scroll logs (when mouse is over log view)

## Services Started

1. **Temporal Server** - `temporal server start-dev` (port 7233, UI on 8088)
2. **Temporal Worker** - `air` or `go run main.go` (hot reload if air installed)
3. **Go API** - `air` or `go run main.go` (port 8080, hot reload if air installed)
4. **Python Agent** - `uv run fastapi dev` (port 8000, hot reload)
5. **Next.js Client** - `bunx next dev` (port 3000, hot reload)

## Hot Reload

- **Next.js Client** - Hot reload enabled by default
- **Python Agent** - Hot reload enabled via FastAPI dev mode
- **Go API & Temporal Worker** - Hot reload enabled if `air` is installed

To install `air` for Go hot reload:
```bash
go install github.com/air-verse/air@latest
```

The TUI will automatically detect if `air` is available and use it for Go services. If not installed, it falls back to `go run` (manual restart required).

## Logs

Service logs are written to `.service-logs/` in the project root:
- `.service-logs/temporal-server.log`
- `.service-logs/temporal-worker.log`
- `.service-logs/go-api.log`
- `.service-logs/python-agent.log`
- `.service-logs/nextjs-client.log`

## Requirements

- Node.js (v14+)
- All service dependencies (Go, Python/uv, bun, temporal CLI)
- Dependencies: `npm install` in `infra/tui/`

## Stopping Services

Press `q` or `Ctrl+C` in the TUI to stop all services and exit gracefully.

## Features

- **Auto-start all services** - All 5 services start automatically
- **Sidebar navigation** - Use arrow keys or mouse to navigate
- **Live logs** - Real-time log output from each service
- **Color-coded** - Each service has its own color
- **Auto-switch view** - Selecting a service in sidebar shows its logs
