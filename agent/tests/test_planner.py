"""
Tests for the Copilot Planner module.

These tests verify the command plan generation and execution logic.
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import json

# Add parent directory to path for imports
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from planner import (
    CopilotPlanner,
    ProposeRequest,
    ExecuteRequest,
    Command,
    CommandPlan,
    MockLLMProvider,
    CohereProvider,
    DOMAIN_KNOWLEDGE,
)


class TestMockLLMProvider:
    """Tests for the MockLLMProvider."""

    @pytest.mark.asyncio
    async def test_mock_provider_returns_json(self):
        """Mock provider should return valid JSON."""
        provider = MockLLMProvider()
        result = await provider.generate("test prompt", "system prompt")

        # Should be valid JSON
        data = json.loads(result)
        assert "intent" in data
        assert "commands" in data
        assert "confidence" in data


class TestCopilotPlanner:
    """Tests for the CopilotPlanner class."""

    @pytest.fixture
    def planner(self):
        """Create a planner with mock LLM provider."""
        with patch.dict("os.environ", {}, clear=True):
            return CopilotPlanner()

    @pytest.mark.asyncio
    async def test_generate_plan_returns_command_plan(self, planner):
        """Generate plan should return a CommandPlan object."""
        request = ProposeRequest(query="Go to orders", userId="test-user")

        plan = await planner.generate_plan(request)

        assert isinstance(plan, CommandPlan)
        assert plan.planId is not None
        assert isinstance(plan.commands, list)
        assert isinstance(plan.expectedEvents, list)
        assert plan.rationale is not None
        assert 0.0 <= plan.confidence <= 1.0

    @pytest.mark.asyncio
    async def test_generate_plan_with_context(self, planner):
        """Generate plan should use context when provided."""
        request = ProposeRequest(
            query="Create an order",
            userId="test-user",
            context={"currentRoute": "/app/oms/blotter"},
        )

        plan = await planner.generate_plan(request)

        assert isinstance(plan, CommandPlan)

    @pytest.mark.asyncio
    async def test_execute_plan_with_mock_response(self, planner):
        """Execute plan should handle mock responses."""
        # Create a mock plan with no commands (navigation only)
        request = ExecuteRequest(
            planId="test-plan-id",
            commands=[],
            userId="test-user",
        )

        result = await planner.execute_plan(request)

        assert result.planId == "test-plan-id"
        assert result.success is True
        assert result.correlationId is not None

    def test_get_endpoint_for_command(self, planner):
        """Endpoint mapping should work for known commands."""
        assert planner._get_endpoint_for_command("CreateOrder") == "/api/oms/orders"
        assert planner._get_endpoint_for_command("RunOptimization") == "/api/pms/optimization"
        assert planner._get_endpoint_for_command("UnknownCommand") is None

    def test_replace_placeholders(self, planner):
        """Placeholder replacement should work correctly."""
        payload = {
            "createdBy": "{{USER_ID}}",
            "accountId": "ABC123",
            "nested": {
                "userId": "{USER_ID}",
            },
        }

        result = planner._replace_placeholders(payload, "real-user-id")

        assert result["createdBy"] == "real-user-id"
        assert result["accountId"] == "ABC123"
        assert result["nested"]["userId"] == "real-user-id"


class TestDomainKnowledge:
    """Tests for domain knowledge content."""

    def test_domain_knowledge_contains_oms(self):
        """Domain knowledge should contain OMS information."""
        assert "OMS" in DOMAIN_KNOWLEDGE
        assert "CreateOrder" in DOMAIN_KNOWLEDGE
        assert "OrderCreated" in DOMAIN_KNOWLEDGE

    def test_domain_knowledge_contains_pms(self):
        """Domain knowledge should contain PMS information."""
        assert "PMS" in DOMAIN_KNOWLEDGE
        assert "RunOptimization" in DOMAIN_KNOWLEDGE
        assert "ProposalGenerated" in DOMAIN_KNOWLEDGE

    def test_domain_knowledge_contains_routes(self):
        """Domain knowledge should contain navigation routes."""
        assert "/app/oms" in DOMAIN_KNOWLEDGE
        assert "/app/pms" in DOMAIN_KNOWLEDGE
        assert "/app/compliance" in DOMAIN_KNOWLEDGE


class TestLLMResponseParsing:
    """Tests for LLM response parsing edge cases."""

    @pytest.fixture
    def planner(self):
        """Create a planner with mock LLM provider."""
        with patch.dict("os.environ", {}, clear=True):
            return CopilotPlanner()

    @pytest.mark.asyncio
    async def test_handles_markdown_wrapped_json(self, planner):
        """Planner should handle JSON wrapped in markdown code blocks."""
        # Mock the LLM to return markdown-wrapped JSON
        mock_response = """```json
{
    "intent": "test",
    "commands": [],
    "expectedEvents": [],
    "rationale": {
        "summary": "Test summary",
        "reasoning": "Test reasoning",
        "alternatives": []
    },
    "assumptions": [],
    "confidence": 0.8
}
```"""

        with patch.object(planner.llm, "generate", return_value=mock_response):
            request = ProposeRequest(query="test", userId="user")
            plan = await planner.generate_plan(request)

            assert plan.confidence == 0.8
            assert plan.rationale.summary == "Test summary"

    @pytest.mark.asyncio
    async def test_handles_invalid_json(self, planner):
        """Planner should handle invalid JSON gracefully."""
        # Mock the LLM to return invalid JSON
        with patch.object(planner.llm, "generate", return_value="not valid json"):
            request = ProposeRequest(query="test", userId="user")
            plan = await planner.generate_plan(request)

            # Should return a low-confidence plan
            assert plan.confidence == 0.0
            assert "Failed to parse" in plan.rationale.summary


class TestCohereProvider:
    """Tests for the CohereProvider class."""

    def test_requires_api_key(self):
        """CohereProvider should require API key."""
        with patch.dict("os.environ", {}, clear=True):
            with pytest.raises(ValueError, match="COHERE_API_KEY"):
                CohereProvider()

    def test_initializes_with_api_key(self):
        """CohereProvider should initialize with API key."""
        with patch.dict("os.environ", {"COHERE_API_KEY": "test-key"}):
            provider = CohereProvider()
            assert provider.api_key == "test-key"
            assert provider.model == "command-a-03-2025"
