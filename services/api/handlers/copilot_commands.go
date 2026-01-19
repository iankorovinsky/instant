package handlers

import (
	"encoding/json"
	"instant/services/api/events"
	"instant/services/api/eventstore"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// CopilotCommandHandler handles copilot-related commands
type CopilotCommandHandler struct {
	eventStore *eventstore.EventStore
}

// NewCopilotCommandHandler creates a new copilot command handler
func NewCopilotCommandHandler(eventStore *eventstore.EventStore) *CopilotCommandHandler {
	return &CopilotCommandHandler{
		eventStore: eventStore,
	}
}

// Command represents a single command in a plan
type Command struct {
	CommandType string                 `json:"commandType"`
	Payload     map[string]interface{} `json:"payload"`
	Endpoint    string                 `json:"endpoint,omitempty"`
}

// Rationale represents the explanation for a plan
type Rationale struct {
	Summary      string   `json:"summary"`
	Reasoning    string   `json:"reasoning"`
	Alternatives []string `json:"alternatives"`
}

// CommandPlan represents an AI-generated command plan
type CommandPlan struct {
	PlanID         string                 `json:"planId"`
	Commands       []Command              `json:"commands"`
	ExpectedEvents []string               `json:"expectedEvents"`
	Rationale      Rationale              `json:"rationale"`
	Assumptions    []string               `json:"assumptions"`
	Confidence     float64                `json:"confidence"`
	Route          string                 `json:"route,omitempty"`
	QueryParams    map[string]string      `json:"queryParams,omitempty"`
	CreatedAt      string                 `json:"createdAt"`
}

// CreateDraftRequest represents a request to store an AIDraftProposed event
type CreateDraftRequest struct {
	EventType string      `json:"eventType"`
	PlanID    string      `json:"planId"`
	Plan      CommandPlan `json:"plan"`
	UserID    string      `json:"userId"`
}

// ApproveDraftRequest represents a request to approve a draft
type ApproveDraftRequest struct {
	UserID string `json:"userId"`
}

// RejectDraftRequest represents a request to reject a draft
type RejectDraftRequest struct {
	UserID string `json:"userId"`
	Reason string `json:"reason,omitempty"`
}

// HandleCreateDraft handles POST /api/copilot/drafts
func (h *CopilotCommandHandler) HandleCreateDraft(c *gin.Context) {
	var req CreateDraftRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Generate correlation ID
	correlationID := c.GetHeader("X-Correlation-ID")
	if correlationID == "" {
		correlationID = uuid.New().String()
	}

	// Convert plan to payload
	planBytes, err := json.Marshal(req.Plan)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to serialize plan"})
		return
	}

	var planPayload map[string]interface{}
	if err := json.Unmarshal(planBytes, &planPayload); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to convert plan"})
		return
	}

	// Create event payload
	payload := map[string]interface{}{
		"planId":   req.PlanID,
		"plan":     planPayload,
		"userId":   req.UserID,
	}

	// Create the event
	event := events.NewEvent(
		events.EventAIDraftProposed,
		events.AggregateAIDraft,
		req.PlanID,
		req.UserID,
		"user",
		correlationID,
		payload,
	)

	// Store the event
	if err := h.eventStore.Append(event); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store event"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"planId":        req.PlanID,
		"correlationId": correlationID,
		"status":        "proposed",
	})
}

// HandleApproveDraft handles POST /api/copilot/drafts/:id/approve
func (h *CopilotCommandHandler) HandleApproveDraft(c *gin.Context) {
	planID := c.Param("id")
	if planID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Plan ID is required"})
		return
	}

	var req ApproveDraftRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Generate correlation ID
	correlationID := c.GetHeader("X-Correlation-ID")
	if correlationID == "" {
		correlationID = uuid.New().String()
	}

	// Create event payload
	payload := map[string]interface{}{
		"planId":     planID,
		"approvedBy": req.UserID,
	}

	// Create the event
	event := events.NewEvent(
		events.EventAIDraftApproved,
		events.AggregateAIDraft,
		planID,
		req.UserID,
		"user",
		correlationID,
		payload,
	)

	// Store the event
	if err := h.eventStore.Append(event); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store event"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"planId":        planID,
		"correlationId": correlationID,
		"status":        "approved",
	})
}

// HandleRejectDraft handles POST /api/copilot/drafts/:id/reject
func (h *CopilotCommandHandler) HandleRejectDraft(c *gin.Context) {
	planID := c.Param("id")
	if planID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Plan ID is required"})
		return
	}

	var req RejectDraftRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Generate correlation ID
	correlationID := c.GetHeader("X-Correlation-ID")
	if correlationID == "" {
		correlationID = uuid.New().String()
	}

	// Create event payload
	payload := map[string]interface{}{
		"planId":     planID,
		"rejectedBy": req.UserID,
		"reason":     req.Reason,
	}

	// Create the event
	event := events.NewEvent(
		events.EventAIDraftRejected,
		events.AggregateAIDraft,
		planID,
		req.UserID,
		"user",
		correlationID,
		payload,
	)

	// Store the event
	if err := h.eventStore.Append(event); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store event"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"planId":        planID,
		"correlationId": correlationID,
		"status":        "rejected",
	})
}
