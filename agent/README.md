# Instant AI Copilot

FastAPI service for the Instant AI Copilot. Transforms natural language requests into agentic plans.

## Overview

The Copilot service provides an AI interface where:
- Users submit natural language requests
- Service returns plans with commands, rationale, assumptions, and confidence

## Development

```bash
# Development mode (with auto-reload)
uv run fastapi dev

# Production mode
uv run fastapi run
```

Service runs on `http://localhost:8000` by default.

## API Endpoints

- `GET /` - Service status
- `GET /health` - Health check

## Dependencies

Managed via `uv` - see `pyproject.toml` for dependencies.

## Architecture

reasoning_loop.py

queriers

renderers



