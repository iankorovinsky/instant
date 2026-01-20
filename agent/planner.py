"""
Copilot Planner Module

Natural language understanding and command plan generation for the Instant trading system.
Uses Cohere for LLM capabilities with an abstract interface for easy model swapping.
"""

import os
import json
import uuid
import httpx
from abc import ABC, abstractmethod
from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone

# ============================================================================
# Type Definitions
# ============================================================================


class CommandPayload(BaseModel):
    """Command payload - varies by command type."""
    model_config = {"extra": "allow"}


class Command(BaseModel):
    """A single command to be executed."""

    commandType: str = Field(..., description="Type of command (e.g., CreateOrder, RunOptimization)")
    payload: dict = Field(..., description="Command-specific payload")
    endpoint: Optional[str] = Field(None, description="API endpoint for the command")


class Rationale(BaseModel):
    """Explanation for the command plan."""

    summary: str = Field(..., description="Short summary of what the plan does")
    reasoning: str = Field(..., description="Detailed reasoning for the approach")
    alternatives: list[str] = Field(default_factory=list, description="Alternative approaches considered")


class CommandPlan(BaseModel):
    """Complete command plan returned by the copilot."""

    planId: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique plan identifier")
    commands: list[Command] = Field(..., description="List of commands to execute")
    expectedEvents: list[str] = Field(..., description="Event types expected from execution")
    rationale: Rationale = Field(..., description="Explanation for the plan")
    assumptions: list[str] = Field(default_factory=list, description="Assumptions made")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score (0-1)")
    route: Optional[str] = Field(None, description="Frontend route for navigation")
    queryParams: Optional[dict] = Field(None, description="Query parameters for the route")
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat(), description="When plan was created")


class ProposeRequest(BaseModel):
    """Request to generate a command plan."""

    query: str = Field(..., description="Natural language request from the user")
    context: Optional[dict] = Field(None, description="Additional context (current route, selected items, etc.)")
    userId: str = Field(default="user", description="User making the request")


class ExecuteRequest(BaseModel):
    """Request to execute an approved command plan."""

    planId: str = Field(..., description="ID of the plan to execute")
    commands: list[Command] = Field(..., description="Commands to execute")
    userId: str = Field(..., description="User approving the execution")


class CommandResult(BaseModel):
    """Result of a single command execution."""

    commandType: str
    success: bool
    response: Optional[dict] = None
    error: Optional[str] = None


class ExecutionResult(BaseModel):
    """Result of executing a command plan."""

    planId: str
    success: bool
    results: list[CommandResult]
    correlationId: str
    error: Optional[str] = None


# ============================================================================
# LLM Provider Abstraction
# ============================================================================


class LLMProvider(ABC):
    """Abstract base class for LLM providers."""

    @abstractmethod
    async def generate(self, prompt: str, system_prompt: str) -> str:
        """Generate a response from the LLM."""
        pass


class CohereProvider(LLMProvider):
    """Cohere LLM provider using Command model."""

    def __init__(self):
        self.api_key = os.environ.get("COHERE_API_KEY")
        if not self.api_key:
            raise ValueError("COHERE_API_KEY environment variable is required")
        self.base_url = "https://api.cohere.ai/v1"
        # Using command-a-03-2025 for supported reasoning capabilities
        self.model = "command-a-03-2025"

    async def generate(self, prompt: str, system_prompt: str) -> str:
        """Generate a response using Cohere's chat endpoint."""
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url}/chat",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "message": prompt,
                    "preamble": system_prompt,
                    "temperature": 0.3,  # Lower temperature for more deterministic outputs
                    "connectors": [],  # No web search
                },
            )

            if response.status_code != 200:
                raise Exception(f"Cohere API error: {response.status_code} - {response.text}")

            data = response.json()
            return data.get("text", "")


class MockLLMProvider(LLMProvider):
    """Mock LLM provider for testing without API calls."""

    async def generate(self, prompt: str, system_prompt: str) -> str:
        """Return a mock response based on the prompt."""
        # This is used when COHERE_API_KEY is not set
        return json.dumps({
            "intent": "unknown",
            "commands": [],
            "expectedEvents": [],
            "rationale": {
                "summary": "Unable to process without LLM",
                "reasoning": "Mock provider - set COHERE_API_KEY for real responses",
                "alternatives": [],
            },
            "assumptions": ["Running in mock mode"],
            "confidence": 0.0,
        })


# ============================================================================
# Domain Knowledge
# ============================================================================

DOMAIN_KNOWLEDGE = """
# Instant Trading System Domain Knowledge

## System Overview
Instant is a single-tenant trading system for US Treasuries (Notes) with event-sourced architecture.
The event log is the system of record; all UI screens are projections.

## Domain Services

### OMS (Order Management System)
- Handles order capture, lifecycle, approvals, and compliance gates
- Does NOT handle fills/execution (that's EMS)
- Order states: DRAFT -> APPROVAL_PENDING -> APPROVED -> SENT -> PARTIALLY_FILLED -> FILLED -> SETTLED
- Commands:
  - CreateOrder: Create a new order
    - Required: accountId, instrumentId (CUSIP), side (BUY/SELL), quantity, orderType (MARKET/LIMIT/CURVE_RELATIVE), timeInForce (DAY/IOC)
    - Optional: limitPrice, curveSpreadBp, batchId
    - Endpoint: POST /api/oms/orders
  - AmendOrder: Modify an existing order
    - Can change: quantity, orderType, limitPrice, curveSpreadBp
    - Endpoint: PATCH /api/oms/orders/{orderId}/amend
  - ApproveOrder: Approve a pending order
    - Endpoint: POST /api/oms/orders/{orderId}/approve
  - CancelOrder: Cancel an order
    - Endpoint: POST /api/oms/orders/{orderId}/cancel
  - SendToEMS: Send approved order for execution
    - Endpoint: POST /api/oms/orders/{orderId}/send-to-ems
  - BulkCreateOrders: Create multiple orders at once
    - Endpoint: POST /api/oms/orders/bulk

### EMS (Execution Management System)
- Handles deterministic simulation, fills, and slippage decomposition
- Does NOT create/edit orders (that's OMS)
- Commands:
  - RequestExecution: Manually request execution simulation
    - Endpoint: POST /api/ems/executions/request

### PMS (Portfolio Management System)
- Handles holdings, targets, optimization, and proposals
- Commands:
  - SetTarget: Set portfolio target allocation
    - Required: scope (account/household), scopeId, durationTarget, bucketWeights
    - Endpoint: POST /api/pms/targets
  - RunOptimization: Run portfolio optimization
    - Required: scope, scopeId, durationTarget, bucketWeights, assumptions
    - Endpoint: POST /api/pms/optimization
  - ApproveProposal: Approve an optimization proposal
    - Endpoint: POST /api/pms/proposals/{proposalId}/approve
  - SendProposalToOMS: Convert proposal to orders
    - Endpoint: POST /api/pms/proposals/{proposalId}/send-to-oms

### Compliance
- Rule evaluation at pre-trade, pre-exec, post-trade checkpoints
- Commands:
  - CreateRule: Define a compliance rule
    - Endpoint: POST /api/compliance/rules
  - EnableRule/DisableRule: Toggle rule status
    - Endpoint: POST /api/compliance/rules/{ruleId}/enable or /disable
  - DeleteRule: Remove a rule
    - Endpoint: DELETE /api/compliance/rules/{ruleId}

## Event Types
- OMS: OrderCreated, OrderAmended, OrderApproved, OrderSentToEMS, OrderPartiallyFilled, OrderFullyFilled, OrderCancelled
- EMS: ExecutionRequested, ExecutionSimulated, FillGenerated, SettlementBooked
- PMS: TargetSet, OptimizationRequested, ProposalGenerated, ProposalApproved, ProposalSentToOMS
- Compliance: RuleCreated, RuleEnabled, RuleDisabled, RuleEvaluated, OrderBlockedByCompliance
- Copilot: AIDraftProposed, AIDraftApproved, AIDraftRejected

## Navigation Routes
- /app/oms - Order Management dashboard
- /app/oms/blotter - Order blotter
- /app/ems - Execution Management dashboard
- /app/ems/executions - Execution list
- /app/pms - Portfolio Management dashboard
- /app/pms/accounts - Account list
- /app/pms/accounts/{id} - Account detail
- /app/pms/households - Household list
- /app/pms/households/{id} - Household detail
- /app/pms/optimization - Portfolio optimization
- /app/pms/proposals - Proposal list
- /app/pms/proposals/{id} - Proposal detail
- /app/pms/drift - Drift analysis
- /app/compliance - Compliance dashboard
- /app/compliance/rules - Rule list
- /app/compliance/violations - Violations
- /app/marketdata - Market data dashboard
- /app/marketdata/instruments - Instrument list
- /app/marketdata/curves - Yield curves
- /app/marketdata/pricing - Pricing

## Key Constraints
- All orders require compliance check before execution
- Proposals must be approved before converting to orders
- Orders must be approved before sending to EMS
- Only APPROVED orders can be sent to EMS
"""

SYSTEM_PROMPT = f"""You are the AI Copilot for the Instant trading system. Your role is to understand natural language requests and generate command plans.

{DOMAIN_KNOWLEDGE}

## Your Task
When given a user request, you must:
1. Understand the user's intent
2. Map it to the appropriate system commands
3. Generate a structured JSON response

## Response Format
Always respond with valid JSON in this exact format:
{{
  "intent": "description of what the user wants",
  "commands": [
    {{
      "commandType": "CommandName",
      "payload": {{ ... command-specific fields ... }},
      "endpoint": "/api/..."
    }}
  ],
  "expectedEvents": ["EventType1", "EventType2"],
  "rationale": {{
    "summary": "Brief summary of what this plan does",
    "reasoning": "Detailed explanation of why this approach was chosen",
    "alternatives": ["Alternative approach 1", "Alternative approach 2"]
  }},
  "assumptions": ["Assumption 1", "Assumption 2"],
  "confidence": 0.85,
  "route": "/app/...",
  "queryParams": {{ "key": "value" }}
}}

## Guidelines
- If the request is unclear, set confidence low and add assumptions
- If the request is a navigation request (e.g., "go to orders"), set route and no commands
- If the request requires data you don't have (like specific account IDs), use placeholders and note in assumptions
- Always include all required fields for commands
- Use realistic confidence scores (0.5-0.95)
- For complex operations, break into multiple commands
- Never hallucinate command types - only use ones from the domain knowledge

## Examples

User: "Create a buy order for 100 units of 91282CJL3"
Response:
{{
  "intent": "Create a buy order for a specific Treasury security",
  "commands": [
    {{
      "commandType": "CreateOrder",
      "payload": {{
        "accountId": "{{ACCOUNT_ID}}",
        "instrumentId": "91282CJL3",
        "side": "BUY",
        "quantity": 100,
        "orderType": "MARKET",
        "timeInForce": "DAY",
        "createdBy": "{{USER_ID}}"
      }},
      "endpoint": "/api/oms/orders"
    }}
  ],
  "expectedEvents": ["OrderCreated"],
  "rationale": {{
    "summary": "Creates a market buy order for 100 units of the specified Treasury",
    "reasoning": "User requested a simple buy order. Using MARKET order type as no price was specified.",
    "alternatives": ["Could use LIMIT order if user specifies a price", "Could use CURVE_RELATIVE for spread-based pricing"]
  }},
  "assumptions": ["Account ID needs to be selected by user", "Market order type is appropriate since no price specified"],
  "confidence": 0.85,
  "route": null,
  "queryParams": null
}}

User: "Go to the orders page"
Response:
{{
  "intent": "Navigate to the order management blotter",
  "commands": [],
  "expectedEvents": [],
  "rationale": {{
    "summary": "Navigate to the OMS blotter view",
    "reasoning": "User wants to view orders, directing to the main order blotter page",
    "alternatives": []
  }},
  "assumptions": [],
  "confidence": 0.95,
  "route": "/app/oms/blotter",
  "queryParams": null
}}

User: "Run portfolio optimization for account ABC123 targeting 5 year duration"
Response:
{{
  "intent": "Run portfolio optimization for a specific account",
  "commands": [
    {{
      "commandType": "RunOptimization",
      "payload": {{
        "scope": "account",
        "scopeId": "ABC123",
        "durationTarget": 5.0,
        "bucketWeights": {{
          "0-2y": 0.1,
          "2-5y": 0.3,
          "5-10y": 0.4,
          "10-20y": 0.15,
          "20y+": 0.05
        }},
        "assumptions": "Standard optimization with 5-year duration target",
        "requestedBy": "{{USER_ID}}"
      }},
      "endpoint": "/api/pms/optimization"
    }}
  ],
  "expectedEvents": ["OptimizationRequested", "ProposalGenerated"],
  "rationale": {{
    "summary": "Run optimization targeting 5-year duration for account ABC123",
    "reasoning": "User specified account and duration target. Using default bucket weights that align with a 5-year target.",
    "alternatives": ["Could specify custom bucket weights if user provides them"]
  }},
  "assumptions": ["Using default bucket weights suitable for 5-year duration", "No constraints specified"],
  "confidence": 0.8,
  "route": "/app/pms/optimization",
  "queryParams": null
}}
"""


# ============================================================================
# Copilot Planner
# ============================================================================


class CopilotPlanner:
    """Main planner class that orchestrates LLM calls and plan generation."""

    def __init__(self):
        # Try to use Cohere, fall back to mock if no API key
        try:
            self.llm = CohereProvider()
        except ValueError:
            print("Warning: COHERE_API_KEY not set, using mock provider")
            self.llm = MockLLMProvider()

        self.backend_url = os.environ.get("BACKEND_URL", "http://localhost:8080")

    async def generate_plan(self, request: ProposeRequest) -> CommandPlan:
        """Generate a command plan from a natural language request."""
        # Build the prompt with context
        context_str = ""
        if request.context:
            context_str = f"\n\nCurrent context:\n{json.dumps(request.context, indent=2)}"

        prompt = f"""User request: {request.query}
User ID: {request.userId}{context_str}

Generate a command plan for this request. Respond with valid JSON only."""

        # Get LLM response
        response = await self.llm.generate(prompt, SYSTEM_PROMPT)

        # Parse the response
        try:
            # Clean up the response - sometimes LLMs wrap JSON in markdown
            cleaned = response.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

            data = json.loads(cleaned)
        except json.JSONDecodeError as e:
            # If parsing fails, return a low-confidence plan
            return CommandPlan(
                commands=[],
                expectedEvents=[],
                rationale=Rationale(
                    summary="Failed to parse LLM response",
                    reasoning=f"The LLM response could not be parsed as JSON: {str(e)}",
                    alternatives=[],
                ),
                assumptions=["LLM response parsing failed"],
                confidence=0.0,
            )

        # Build the command plan
        commands = []
        for cmd_data in data.get("commands", []):
            commands.append(
                Command(
                    commandType=cmd_data.get("commandType", "Unknown"),
                    payload=cmd_data.get("payload", {}),
                    endpoint=cmd_data.get("endpoint"),
                )
            )

        rationale_data = data.get("rationale", {})
        rationale = Rationale(
            summary=rationale_data.get("summary", data.get("intent", "Unknown intent")),
            reasoning=rationale_data.get("reasoning", ""),
            alternatives=rationale_data.get("alternatives", []),
        )

        return CommandPlan(
            commands=commands,
            expectedEvents=data.get("expectedEvents", []),
            rationale=rationale,
            assumptions=data.get("assumptions", []),
            confidence=data.get("confidence", 0.5),
            route=data.get("route"),
            queryParams=data.get("queryParams"),
        )

    async def execute_plan(self, request: ExecuteRequest) -> ExecutionResult:
        """Execute an approved command plan by forwarding to backend API."""
        correlation_id = str(uuid.uuid4())
        results = []

        async with httpx.AsyncClient(timeout=30.0) as client:
            for command in request.commands:
                try:
                    # Build the request
                    endpoint = command.endpoint
                    if not endpoint:
                        # Try to determine endpoint from command type
                        endpoint = self._get_endpoint_for_command(command.commandType)

                    if not endpoint:
                        results.append(
                            CommandResult(
                                commandType=command.commandType,
                                success=False,
                                error=f"No endpoint found for command type: {command.commandType}",
                            )
                        )
                        continue

                    # Replace placeholders in payload
                    payload = self._replace_placeholders(command.payload, request.userId)

                    # Execute the command
                    url = f"{self.backend_url}{endpoint}"
                    response = await client.post(
                        url,
                        headers={
                            "Content-Type": "application/json",
                            "X-Correlation-ID": correlation_id,
                        },
                        json=payload,
                    )

                    if response.status_code >= 200 and response.status_code < 300:
                        results.append(
                            CommandResult(
                                commandType=command.commandType,
                                success=True,
                                response=response.json(),
                            )
                        )
                    else:
                        error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": response.text}
                        results.append(
                            CommandResult(
                                commandType=command.commandType,
                                success=False,
                                error=error_data.get("error", f"HTTP {response.status_code}"),
                            )
                        )

                except Exception as e:
                    results.append(
                        CommandResult(
                            commandType=command.commandType,
                            success=False,
                            error=str(e),
                        )
                    )

        # Determine overall success
        all_success = all(r.success for r in results)

        return ExecutionResult(
            planId=request.planId,
            success=all_success,
            results=results,
            correlationId=correlation_id,
            error=None if all_success else "One or more commands failed",
        )

    async def get_system_context(self) -> dict:
        """Fetch current system context from the backend."""
        context = {
            "accounts": [],
            "instruments": [],
            "recentOrders": [],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                # Fetch accounts
                response = await client.get(f"{self.backend_url}/api/views/accounts")
                if response.status_code == 200:
                    data = response.json()
                    context["accounts"] = data.get("accounts", [])[:10]  # Limit to 10
            except Exception:
                pass

            try:
                # Fetch recent orders
                response = await client.get(f"{self.backend_url}/api/views/blotter?limit=10")
                if response.status_code == 200:
                    data = response.json()
                    context["recentOrders"] = data.get("orders", [])[:10]
            except Exception:
                pass

            try:
                # Fetch instruments (sample)
                response = await client.get(f"{self.backend_url}/api/views/instruments?limit=20")
                if response.status_code == 200:
                    data = response.json()
                    context["instruments"] = data.get("instruments", [])[:20]
            except Exception:
                pass

        return context

    def _get_endpoint_for_command(self, command_type: str) -> str | None:
        """Map command type to API endpoint."""
        endpoints = {
            "CreateOrder": "/api/oms/orders",
            "BulkCreateOrders": "/api/oms/orders/bulk",
            "AmendOrder": "/api/oms/orders/{orderId}/amend",
            "ApproveOrder": "/api/oms/orders/{orderId}/approve",
            "CancelOrder": "/api/oms/orders/{orderId}/cancel",
            "SendToEMS": "/api/oms/orders/{orderId}/send-to-ems",
            "RequestExecution": "/api/ems/executions/request",
            "SetTarget": "/api/pms/targets",
            "RunOptimization": "/api/pms/optimization",
            "ApproveProposal": "/api/pms/proposals/{proposalId}/approve",
            "SendProposalToOMS": "/api/pms/proposals/{proposalId}/send-to-oms",
            "CreateRule": "/api/compliance/rules",
            "EnableRule": "/api/compliance/rules/{ruleId}/enable",
            "DisableRule": "/api/compliance/rules/{ruleId}/disable",
            "DeleteRule": "/api/compliance/rules/{ruleId}",
        }
        return endpoints.get(command_type)

    def _replace_placeholders(self, payload: dict, user_id: str) -> dict:
        """Replace placeholder values in the payload."""
        result = {}
        for key, value in payload.items():
            if isinstance(value, str):
                value = value.replace("{{USER_ID}}", user_id)
                value = value.replace("{USER_ID}", user_id)
                # Leave other placeholders for user to fill
            elif isinstance(value, dict):
                value = self._replace_placeholders(value, user_id)
            result[key] = value
        return result
