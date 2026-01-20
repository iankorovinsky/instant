package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// mockEventStore is a simple mock for testing
type mockEventStore struct{}

func (m *mockEventStore) Append(event interface{}) error {
	return nil
}

func setupCopilotTestRouter() (*gin.Engine, *CopilotCommandHandler) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	// For testing, we'll use nil eventStore and handle it gracefully
	// In a real test, you'd set up an in-memory event store
	handler := &CopilotCommandHandler{
		eventStore: nil,
	}

	return router, handler
}

func TestCopilotCommandHandler_CreateDraft_Validation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	// Create handler with nil event store for validation tests
	handler := &CopilotCommandHandler{eventStore: nil}
	router.POST("/api/copilot/drafts", handler.HandleCreateDraft)

	t.Run("missing body returns 400", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/copilot/drafts", nil)
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("invalid json returns 400", func(t *testing.T) {
		w := httptest.NewRecorder()
		body := bytes.NewBufferString("{invalid json}")
		req, _ := http.NewRequest("POST", "/api/copilot/drafts", body)
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestCopilotCommandHandler_ApproveDraft_Validation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	handler := &CopilotCommandHandler{eventStore: nil}
	router.POST("/api/copilot/drafts/:id/approve", handler.HandleApproveDraft)

	t.Run("missing body returns 400", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/copilot/drafts/test-id/approve", nil)
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestCopilotCommandHandler_RejectDraft_Validation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	handler := &CopilotCommandHandler{eventStore: nil}
	router.POST("/api/copilot/drafts/:id/reject", handler.HandleRejectDraft)

	t.Run("missing body returns 400", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/copilot/drafts/test-id/reject", nil)
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestCreateDraftRequest_Serialization(t *testing.T) {
	req := CreateDraftRequest{
		EventType: "AIDraftProposed",
		PlanID:    "test-plan-123",
		Plan: CommandPlan{
			PlanID: "test-plan-123",
			Commands: []Command{
				{
					CommandType: "CreateOrder",
					Payload: map[string]interface{}{
						"accountId": "ACC-001",
						"quantity":  100,
					},
					Endpoint: "/api/oms/orders",
				},
			},
			ExpectedEvents: []string{"OrderCreated"},
			Rationale: Rationale{
				Summary:      "Create a buy order",
				Reasoning:    "User requested to create an order",
				Alternatives: []string{"Could use limit order"},
			},
			Assumptions: []string{"Market order is appropriate"},
			Confidence:  0.85,
			Route:       "/app/oms/blotter",
		},
		UserID: "user-123",
	}

	// Test serialization
	data, err := json.Marshal(req)
	require.NoError(t, err)
	assert.Contains(t, string(data), "test-plan-123")
	assert.Contains(t, string(data), "CreateOrder")
	assert.Contains(t, string(data), "OrderCreated")

	// Test deserialization
	var decoded CreateDraftRequest
	err = json.Unmarshal(data, &decoded)
	require.NoError(t, err)
	assert.Equal(t, req.PlanID, decoded.PlanID)
	assert.Equal(t, req.UserID, decoded.UserID)
	assert.Len(t, decoded.Plan.Commands, 1)
	assert.Equal(t, "CreateOrder", decoded.Plan.Commands[0].CommandType)
}

func TestApproveDraftRequest_Serialization(t *testing.T) {
	req := ApproveDraftRequest{
		UserID: "approver-123",
	}

	data, err := json.Marshal(req)
	require.NoError(t, err)
	assert.Contains(t, string(data), "approver-123")

	var decoded ApproveDraftRequest
	err = json.Unmarshal(data, &decoded)
	require.NoError(t, err)
	assert.Equal(t, req.UserID, decoded.UserID)
}

func TestRejectDraftRequest_Serialization(t *testing.T) {
	req := RejectDraftRequest{
		UserID: "rejector-123",
		Reason: "Invalid parameters",
	}

	data, err := json.Marshal(req)
	require.NoError(t, err)
	assert.Contains(t, string(data), "rejector-123")
	assert.Contains(t, string(data), "Invalid parameters")

	var decoded RejectDraftRequest
	err = json.Unmarshal(data, &decoded)
	require.NoError(t, err)
	assert.Equal(t, req.UserID, decoded.UserID)
	assert.Equal(t, req.Reason, decoded.Reason)
}

func TestCommand_Structure(t *testing.T) {
	cmd := Command{
		CommandType: "RunOptimization",
		Payload: map[string]interface{}{
			"scope":          "account",
			"scopeId":        "ACC-001",
			"durationTarget": 5.0,
		},
		Endpoint: "/api/pms/optimization",
	}

	data, err := json.Marshal(cmd)
	require.NoError(t, err)

	var decoded Command
	err = json.Unmarshal(data, &decoded)
	require.NoError(t, err)

	assert.Equal(t, "RunOptimization", decoded.CommandType)
	assert.Equal(t, "/api/pms/optimization", decoded.Endpoint)
	assert.Equal(t, "account", decoded.Payload["scope"])
}

func TestRationale_Structure(t *testing.T) {
	rationale := Rationale{
		Summary:      "Execute portfolio optimization",
		Reasoning:    "User wants to rebalance the portfolio to target duration",
		Alternatives: []string{"Manual order entry", "Use different model"},
	}

	data, err := json.Marshal(rationale)
	require.NoError(t, err)

	var decoded Rationale
	err = json.Unmarshal(data, &decoded)
	require.NoError(t, err)

	assert.Equal(t, "Execute portfolio optimization", decoded.Summary)
	assert.Len(t, decoded.Alternatives, 2)
}

// TestNewCopilotCommandHandler tests handler creation
func TestNewCopilotCommandHandler(t *testing.T) {
	// Test with nil event store (allowed for testing)
	handler := NewCopilotCommandHandler(nil)
	assert.NotNil(t, handler)
	assert.Nil(t, handler.eventStore)
}

// Integration test helper - would need a real event store
func TestCopilotWorkflow_Integration(t *testing.T) {
	t.Skip("Integration test - requires running event store")

	// This test would:
	// 1. Create a draft
	// 2. Approve or reject it
	// 3. Verify events were stored correctly
}
