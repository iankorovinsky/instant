"""
Tests for the Copilot FastAPI endpoints.

These tests verify the API endpoints work correctly.
"""

import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

# Add parent directory to path for imports
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Patch environment before importing main
with patch.dict("os.environ", {}, clear=True):
    from main import app


@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)


class TestHealthEndpoints:
    """Tests for health and root endpoints."""

    def test_root_endpoint(self, client):
        """Root endpoint should return service info."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "instant-copilot"
        assert data["status"] == "running"

    def test_health_endpoint(self, client):
        """Health endpoint should return healthy status."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


class TestProposeEndpoint:
    """Tests for the /copilot/propose endpoint."""

    def test_propose_requires_query(self, client):
        """Propose endpoint should require query field."""
        response = client.post("/copilot/propose", json={})
        assert response.status_code == 422  # Validation error

    def test_propose_returns_plan(self, client):
        """Propose endpoint should return a command plan."""
        response = client.post(
            "/copilot/propose",
            json={
                "query": "Go to orders page",
                "userId": "test-user",
            },
        )
        assert response.status_code == 200
        data = response.json()

        # Check plan structure
        assert "planId" in data
        assert "commands" in data
        assert "expectedEvents" in data
        assert "rationale" in data
        assert "confidence" in data

    def test_propose_with_context(self, client):
        """Propose endpoint should accept context."""
        response = client.post(
            "/copilot/propose",
            json={
                "query": "Create an order",
                "userId": "test-user",
                "context": {
                    "currentRoute": "/app/oms/blotter",
                },
            },
        )
        assert response.status_code == 200


class TestExecuteEndpoint:
    """Tests for the /copilot/execute endpoint."""

    def test_execute_requires_plan_id(self, client):
        """Execute endpoint should require planId field."""
        response = client.post(
            "/copilot/execute",
            json={
                "commands": [],
                "userId": "test-user",
            },
        )
        assert response.status_code == 422  # Validation error

    def test_execute_with_empty_commands(self, client):
        """Execute endpoint should handle empty commands."""
        response = client.post(
            "/copilot/execute",
            json={
                "planId": "test-plan-id",
                "commands": [],
                "userId": "test-user",
            },
        )
        assert response.status_code == 200
        data = response.json()

        assert data["planId"] == "test-plan-id"
        assert data["success"] is True
        assert "correlationId" in data


class TestContextEndpoint:
    """Tests for the /copilot/context endpoint."""

    def test_context_returns_structure(self, client):
        """Context endpoint should return expected structure."""
        response = client.get("/copilot/context")
        assert response.status_code == 200
        data = response.json()

        # Check structure (may be empty if backend not running)
        assert "accounts" in data
        assert "instruments" in data
        assert "recentOrders" in data
        assert "timestamp" in data
