package handlers

import (
	"net/http"
	"time"

	"instant/services/api/pms"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// PMSCommandHandler handles PMS-specific commands.
type PMSCommandHandler struct {
	pmsService *pms.Service
}

// NewPMSCommandHandler creates a new PMS command handler.
func NewPMSCommandHandler(pmsService *pms.Service) *PMSCommandHandler {
	return &PMSCommandHandler{
		pmsService: pmsService,
	}
}

// HandleSetTarget handles SetTarget command.
func (h *PMSCommandHandler) HandleSetTarget(c *gin.Context) {
	var req pms.SetTargetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.EffectiveFrom.IsZero() {
		req.EffectiveFrom = time.Now().UTC()
	}

	correlationID := c.GetHeader("X-Correlation-ID")
	if correlationID == "" {
		correlationID = uuid.New().String()
	}

	targetID, err := h.pmsService.SetTarget(req, correlationID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"targetId":      targetID,
		"correlationId": correlationID,
		"status":        "set",
	})
}

// HandleRunOptimization handles RunOptimization command.
func (h *PMSCommandHandler) HandleRunOptimization(c *gin.Context) {
	var req pms.RunOptimizationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	correlationID := c.GetHeader("X-Correlation-ID")
	if correlationID == "" {
		correlationID = uuid.New().String()
	}

	proposalID, err := h.pmsService.RunOptimization(req, correlationID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"proposalId":    proposalID,
		"correlationId": correlationID,
		"status":        "generated",
	})
}

// HandleApproveProposal handles ApproveProposal command.
func (h *PMSCommandHandler) HandleApproveProposal(c *gin.Context) {
	proposalID := c.Param("id")

	var req struct {
		ApprovedBy string `json:"approvedBy" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	correlationID := c.GetHeader("X-Correlation-ID")
	if correlationID == "" {
		correlationID = uuid.New().String()
	}

	approveReq := pms.ApproveProposalRequest{
		ProposalID: proposalID,
		ApprovedBy: req.ApprovedBy,
	}

	if err := h.pmsService.ApproveProposal(approveReq, correlationID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"proposalId":   proposalID,
		"correlationId": correlationID,
		"status":       "approved",
	})
}

// HandleSendProposalToOMS handles SendProposalToOMS command.
func (h *PMSCommandHandler) HandleSendProposalToOMS(c *gin.Context) {
	proposalID := c.Param("id")

	var req struct {
		SentBy string `json:"sentBy" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	correlationID := c.GetHeader("X-Correlation-ID")
	if correlationID == "" {
		correlationID = uuid.New().String()
	}

	sendReq := pms.SendProposalToOMSRequest{
		ProposalID: proposalID,
		SentBy:     req.SentBy,
	}

	if err := h.pmsService.SendProposalToOMS(sendReq, correlationID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"proposalId":   proposalID,
		"correlationId": correlationID,
		"status":       "sent_to_oms",
	})
}
