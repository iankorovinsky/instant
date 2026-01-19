package handlers

import (
	"encoding/json"
	"instant/services/api/oms"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// OMSCommandHandler handles OMS-specific commands
type OMSCommandHandler struct {
	omsService *oms.Service
}

// NewOMSCommandHandler creates a new OMS command handler
func NewOMSCommandHandler(omsService *oms.Service) *OMSCommandHandler {
	return &OMSCommandHandler{
		omsService: omsService,
	}
}

// HandleCreateOrder handles CreateOrder command
func (h *OMSCommandHandler) HandleCreateOrder(c *gin.Context) {
	var req oms.CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Generate correlation ID if not provided
	correlationID := c.GetHeader("X-Correlation-ID")
	if correlationID == "" {
		correlationID = uuid.New().String()
	}

	orderID, err := h.omsService.CreateOrder(req, correlationID)
	if err != nil {
		if err == oms.ErrComplianceBlocked {
			c.JSON(http.StatusForbidden, gin.H{
				"error":         "Order blocked by compliance",
				"orderId":       orderID,
				"correlationId": correlationID,
			})
			return
		}
		if isOMSCreationValidationError(err) {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"orderId":       orderID,
		"correlationId": correlationID,
		"status":        "created",
	})
}

// HandleAmendOrder handles AmendOrder command
func (h *OMSCommandHandler) HandleAmendOrder(c *gin.Context) {
	orderID := c.Param("id")

	var req oms.AmendOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req.OrderID = orderID

	correlationID := c.GetHeader("X-Correlation-ID")
	if correlationID == "" {
		correlationID = uuid.New().String()
	}

	if err := h.omsService.AmendOrder(req, correlationID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"orderId":       orderID,
		"correlationId": correlationID,
		"status":        "amended",
	})
}

// HandleApproveOrder handles ApproveOrder command
func (h *OMSCommandHandler) HandleApproveOrder(c *gin.Context) {
	orderID := c.Param("id")

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

	approveReq := oms.ApproveOrderRequest{
		OrderID:    orderID,
		ApprovedBy: req.ApprovedBy,
	}

	if err := h.omsService.ApproveOrder(approveReq, correlationID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"orderId":       orderID,
		"correlationId": correlationID,
		"status":        "approved",
	})
}

// HandleCancelOrder handles CancelOrder command
func (h *OMSCommandHandler) HandleCancelOrder(c *gin.Context) {
	orderID := c.Param("id")

	var req struct {
		CancelledBy string `json:"cancelledBy" binding:"required"`
		Reason      string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	correlationID := c.GetHeader("X-Correlation-ID")
	if correlationID == "" {
		correlationID = uuid.New().String()
	}

	cancelReq := oms.CancelOrderRequest{
		OrderID:     orderID,
		CancelledBy: req.CancelledBy,
		Reason:      req.Reason,
	}

	if err := h.omsService.CancelOrder(cancelReq, correlationID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"orderId":       orderID,
		"correlationId": correlationID,
		"status":        "cancelled",
	})
}

// HandleSendToEMS handles SendToEMS command
func (h *OMSCommandHandler) HandleSendToEMS(c *gin.Context) {
	orderID := c.Param("id")

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

	sendReq := oms.SendToEMSRequest{
		OrderID: orderID,
		SentBy:  req.SentBy,
	}

	if err := h.omsService.SendToEMS(sendReq, correlationID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"orderId":       orderID,
		"correlationId": correlationID,
		"status":        "sent_to_ems",
	})
}

// HandleBulkCreateOrders handles batch order creation
func (h *OMSCommandHandler) HandleBulkCreateOrders(c *gin.Context) {
	var req struct {
		Orders    []oms.CreateOrderRequest `json:"orders" binding:"required"`
		CreatedBy string                   `json:"createdBy" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	correlationID := c.GetHeader("X-Correlation-ID")
	if correlationID == "" {
		correlationID = uuid.New().String()
	}

	batchID := uuid.New().String()
	results := make([]map[string]interface{}, 0, len(req.Orders))

	for _, orderReq := range req.Orders {
		orderReq.BatchID = &batchID
		orderReq.CreatedBy = req.CreatedBy

		orderID, err := h.omsService.CreateOrder(orderReq, correlationID)
		result := map[string]interface{}{
			"orderId": orderID,
		}

		if err != nil {
			result["error"] = err.Error()
			result["status"] = "failed"
		} else {
			result["status"] = "created"
		}

		results = append(results, result)
	}

	c.JSON(http.StatusCreated, gin.H{
		"batchId":       batchID,
		"correlationId": correlationID,
		"results":       results,
	})
}

// HandleCommandRouter routes generic command requests to specific handlers
func (h *OMSCommandHandler) HandleCommandRouter(c *gin.Context) {
	var req struct {
		CommandType   string          `json:"commandType" binding:"required"`
		Payload       json.RawMessage `json:"payload" binding:"required"`
		CorrelationID string          `json:"correlationId"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	correlationID := req.CorrelationID
	if correlationID == "" {
		correlationID = uuid.New().String()
	}

	switch req.CommandType {
	case "CreateOrder":
		var createReq oms.CreateOrderRequest
		if err := json.Unmarshal(req.Payload, &createReq); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		orderID, err := h.omsService.CreateOrder(createReq, correlationID)
		if err != nil {
			if isOMSCreationValidationError(err) {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"orderId":       orderID,
			"correlationId": correlationID,
			"status":        "created",
		})

	case "AmendOrder":
		var amendReq oms.AmendOrderRequest
		if err := json.Unmarshal(req.Payload, &amendReq); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := h.omsService.AmendOrder(amendReq, correlationID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"correlationId": correlationID,
			"status":        "amended",
		})

	case "ApproveOrder":
		var approveReq oms.ApproveOrderRequest
		if err := json.Unmarshal(req.Payload, &approveReq); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := h.omsService.ApproveOrder(approveReq, correlationID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"correlationId": correlationID,
			"status":        "approved",
		})

	case "CancelOrder":
		var cancelReq oms.CancelOrderRequest
		if err := json.Unmarshal(req.Payload, &cancelReq); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := h.omsService.CancelOrder(cancelReq, correlationID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"correlationId": correlationID,
			"status":        "cancelled",
		})

	case "SendToEMS":
		var sendReq oms.SendToEMSRequest
		if err := json.Unmarshal(req.Payload, &sendReq); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := h.omsService.SendToEMS(sendReq, correlationID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"correlationId": correlationID,
			"status":        "sent_to_ems",
		})

	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "unknown command type"})
	}
}

func isOMSCreationValidationError(err error) bool {
	return err == oms.ErrInvalidQuantity ||
		err == oms.ErrInvalidOrderType ||
		err == oms.ErrMissingLimitPrice ||
		err == oms.ErrMissingCurveSpread
}
