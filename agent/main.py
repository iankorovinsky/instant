"""
Instant AI Copilot Service

This service provides natural language understanding and command plan generation
for the Instant trading system. It uses Cohere for LLM capabilities.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import httpx
import uuid

from planner import CopilotPlanner, CommandPlan, ProposeRequest, ExecuteRequest, ExecutionResult

app = FastAPI(
    title="Instant AI Copilot",
    description="AI Agent service for Instant trading system - natural language to command plans",
    version="0.1.0"
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the planner
planner = CopilotPlanner()


@app.get("/")
def root():
    """Root endpoint returning service status."""
    return {"service": "instant-copilot", "status": "running", "version": "0.1.0"}


@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.post("/copilot/propose", response_model=CommandPlan)
async def propose(request: ProposeRequest) -> CommandPlan:
    """
    Accept natural language request and generate a command plan.

    This endpoint:
    1. Parses the natural language request
    2. Understands the user's intent
    3. Generates a command plan with:
       - commands[] (array of command objects)
       - expectedEvents[] (event types)
       - rationale (structured + plain text)
       - assumptions (explicit)
       - confidence (score)
    4. Returns draft proposal (no events emitted)
    """
    try:
        plan = await planner.generate_plan(request)
        return plan
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate plan: {str(e)}")


@app.post("/copilot/execute", response_model=ExecutionResult)
async def execute(request: ExecuteRequest) -> ExecutionResult:
    """
    Execute an approved command plan.

    This endpoint:
    1. Accepts an approved command plan
    2. Forwards commands to the backend API (via HTTP)
    3. Returns execution result
    """
    try:
        result = await planner.execute_plan(request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to execute plan: {str(e)}")


@app.get("/copilot/context")
async def get_context():
    """
    Get current system context for the copilot.

    This includes available accounts, instruments, recent orders, etc.
    Useful for providing context to the LLM.
    """
    try:
        context = await planner.get_system_context()
        return context
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get context: {str(e)}")
