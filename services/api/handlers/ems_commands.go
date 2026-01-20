package handlers

import (
	"instant/services/api/ems"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// EMSCommandHandler handles EMS-specific commands.
type EMSCommandHandler struct {
	emsService *ems.Service
}

// NewEMSCommandHandler creates a new EMS command handler.
func NewEMSCommandHandler(emsService *ems.Service) *EMSCommandHandler {
	return &EMSCommandHandler{
		emsService: emsService,
	}
}

// HandleRequestExecution handles manual execution requests.
func (h *EMSCommandHandler) HandleRequestExecution(c *gin.Context) {
	var req ems.RequestExecutionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	correlationID := c.GetHeader("X-Correlation-ID")
	if correlationID == "" {
		correlationID = uuid.New().String()
	}

	executionID, err := h.emsService.RequestExecution(req, correlationID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{
		"executionId":   executionID,
		"correlationId": correlationID,
		"status":        "requested",
	})
}
