package handlers

import (
	"net/http"
	"time"

	"instant/services/api/services/compliance"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ComplianceCommandHandler struct {
	service *compliance.Service
}

func NewComplianceCommandHandler(service *compliance.Service) *ComplianceCommandHandler {
	return &ComplianceCommandHandler{service: service}
}

type ruleRequest struct {
	RuleKey             string                 `json:"ruleKey"`
	Name                string                 `json:"name"`
	Description         *string                `json:"description"`
	Severity            string                 `json:"severity"`
	Scope               string                 `json:"scope"`
	ScopeID             *string                `json:"scopeId"`
	Predicate           map[string]interface{} `json:"predicate"`
	ExplanationTemplate string                 `json:"explanationTemplate"`
	EvaluationPoints    []string               `json:"evaluationPoints"`
	Status              string                 `json:"status"`
	EffectiveFrom       *time.Time             `json:"effectiveFrom"`
	EffectiveTo         *time.Time             `json:"effectiveTo"`
	RuleSetID           *string                `json:"ruleSetId"`
}

func (h *ComplianceCommandHandler) CreateRule(c *gin.Context) {
	var req struct {
		ruleRequest
		CreatedBy string `json:"createdBy" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	correlationID := correlationIDFromHeader(c)

	input := compliance.RuleInput{
		RuleKey:             req.RuleKey,
		Name:                req.Name,
		Description:         req.Description,
		Severity:            req.Severity,
		Scope:               req.Scope,
		ScopeID:             req.ScopeID,
		Predicate:           req.Predicate,
		ExplanationTemplate: req.ExplanationTemplate,
		EvaluationPoints:    req.EvaluationPoints,
		Status:              req.Status,
		EffectiveFrom:       timeOrNow(req.EffectiveFrom),
		EffectiveTo:         req.EffectiveTo,
		RuleSetID:           req.RuleSetID,
		ActorID:             req.CreatedBy,
	}

	ruleID, err := h.service.CreateRule(input, correlationID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"ruleId":        ruleID,
		"correlationId": correlationID,
		"status":        "created",
	})
}

func (h *ComplianceCommandHandler) UpdateRule(c *gin.Context) {
	ruleID := c.Param("id")
	var req struct {
		ruleRequest
		UpdatedBy string `json:"updatedBy" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	correlationID := correlationIDFromHeader(c)

	input := compliance.RuleInput{
		RuleKey:             req.RuleKey,
		Name:                req.Name,
		Description:         req.Description,
		Severity:            req.Severity,
		Scope:               req.Scope,
		ScopeID:             req.ScopeID,
		Predicate:           req.Predicate,
		ExplanationTemplate: req.ExplanationTemplate,
		EvaluationPoints:    req.EvaluationPoints,
		Status:              req.Status,
		EffectiveFrom:       timeOrNow(req.EffectiveFrom),
		EffectiveTo:         req.EffectiveTo,
		RuleSetID:           req.RuleSetID,
		ActorID:             req.UpdatedBy,
	}

	ruleID, err := h.service.UpdateRule(ruleID, input, correlationID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ruleId":        ruleID,
		"correlationId": correlationID,
		"status":        "updated",
	})
}

func (h *ComplianceCommandHandler) EnableRule(c *gin.Context) {
	actorID := actorIDFromBody(c)
	if actorID == "" {
		return
	}
	correlationID := correlationIDFromHeader(c)

	if err := h.service.EnableRule(c.Param("id"), actorID, correlationID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "enabled"})
}

func (h *ComplianceCommandHandler) DisableRule(c *gin.Context) {
	actorID := actorIDFromBody(c)
	if actorID == "" {
		return
	}
	correlationID := correlationIDFromHeader(c)

	if err := h.service.DisableRule(c.Param("id"), actorID, correlationID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "disabled"})
}

func (h *ComplianceCommandHandler) DeleteRule(c *gin.Context) {
	actorID := actorIDFromBody(c)
	if actorID == "" {
		return
	}
	correlationID := correlationIDFromHeader(c)

	if err := h.service.DeleteRule(c.Param("id"), actorID, correlationID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}

func (h *ComplianceCommandHandler) PublishRuleSet(c *gin.Context) {
	ruleSetID := c.Param("id")
	var req struct {
		Name          string     `json:"name" binding:"required"`
		Description   *string    `json:"description"`
		Version       int        `json:"version"`
		Status        string     `json:"status"`
		EffectiveFrom *time.Time `json:"effectiveFrom"`
		EffectiveTo   *time.Time `json:"effectiveTo"`
		PublishedBy   string     `json:"publishedBy" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	correlationID := correlationIDFromHeader(c)

	input := compliance.RuleSetInput{
		RuleSetID:     ruleSetID,
		Name:          req.Name,
		Description:   req.Description,
		Version:       req.Version,
		Status:        req.Status,
		EffectiveFrom: timeOrNow(req.EffectiveFrom),
		EffectiveTo:   req.EffectiveTo,
		ActorID:       req.PublishedBy,
	}

	id, err := h.service.PublishRuleSet(input, correlationID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ruleSetId":     id,
		"correlationId": correlationID,
		"status":        "published",
	})
}

func correlationIDFromHeader(c *gin.Context) string {
	correlationID := c.GetHeader("X-Correlation-ID")
	if correlationID == "" {
		correlationID = uuid.New().String()
	}
	return correlationID
}

func actorIDFromBody(c *gin.Context) string {
	var req struct {
		ActorID string `json:"actorId"` // fallback
		UpdatedBy string `json:"updatedBy"`
		DeletedBy string `json:"deletedBy"`
		CreatedBy string `json:"createdBy"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return ""
	}

	if req.UpdatedBy != "" {
		return req.UpdatedBy
	}
	if req.DeletedBy != "" {
		return req.DeletedBy
	}
	if req.CreatedBy != "" {
		return req.CreatedBy
	}
	return req.ActorID
}

func timeOrNow(value *time.Time) time.Time {
	if value != nil {
		return value.UTC()
	}
	return time.Now().UTC()
}
