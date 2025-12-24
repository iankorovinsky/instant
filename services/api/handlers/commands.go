package handlers

import (
	"github.com/gin-gonic/gin"
)

// CommandRequest represents a command from the client
type CommandRequest struct {
	CommandType   string                 `json:"commandType" binding:"required"`
	Payload       map[string]interface{} `json:"payload" binding:"required"`
	CorrelationID string                 `json:"correlationId"`
}

// HandleCommand processes commands and emits events
func HandleCommand(c *gin.Context) {
	var req CommandRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// TODO: Validate command
	// TODO: Route to appropriate domain service (OMS, EMS, PMS, etc.)
	// TODO: Emit events to event store
	// TODO: Return appropriate response

	c.JSON(200, gin.H{
		"status":        "accepted",
		"correlationId": req.CorrelationID,
	})
}
