package oms

import (
	"encoding/json"
	"errors"
	"fmt"
	"instant/services/api/eventbus"
	"instant/services/api/events"
	"instant/services/api/eventstore"
	"time"

	"github.com/google/uuid"
)

var (
	ErrInvalidQuantity     = errors.New("quantity must be greater than 0")
	ErrInvalidOrderType    = errors.New("invalid order type")
	ErrInvalidState        = errors.New("invalid state transition")
	ErrOrderNotFound       = errors.New("order not found")
	ErrComplianceBlocked   = errors.New("order blocked by compliance")
	ErrMissingLimitPrice   = errors.New("limit price required for LIMIT orders")
	ErrMissingCurveSpread  = errors.New("curve spread required for CURVE_RELATIVE orders")
)

// Service handles order management operations
type Service struct {
	eventStore *eventstore.EventStore
	eventBus   *eventbus.EventBus
	// complianceService would be injected here in full implementation
}

// NewService creates a new OMS service
func NewService(es *eventstore.EventStore, eb *eventbus.EventBus) *Service {
	return &Service{
		eventStore: es,
		eventBus:   eb,
	}
}

// CreateOrder creates a new order and emits OrderCreated event
func (s *Service) CreateOrder(req CreateOrderRequest, correlationID string) (string, error) {
	// Validate inputs
	if err := s.validateCreateOrderRequest(req); err != nil {
		return "", err
	}

	orderID := uuid.New().String()

	// Build payload
	payload := map[string]interface{}{
		"orderId":       orderID,
		"accountId":     req.AccountID,
		"instrumentId":  req.InstrumentID,
		"side":          req.Side,
		"quantity":      req.Quantity,
		"orderType":     req.OrderType,
		"timeInForce":   req.TimeInForce,
		"state":         OrderStateDraft,
		"createdBy":     req.CreatedBy,
	}

	if req.LimitPrice != nil {
		payload["limitPrice"] = *req.LimitPrice
	}
	if req.CurveSpreadBp != nil {
		payload["curveSpreadBp"] = *req.CurveSpreadBp
	}
	if req.BatchID != nil {
		payload["batchId"] = *req.BatchID
	}

	// Create event
	event := events.NewEvent(
		events.EventOrderCreated,
		events.AggregateOrder,
		orderID,
		req.CreatedBy,
		"user",
		correlationID,
		payload,
	)

	// Append to event store
	if err := s.eventStore.Append(event); err != nil {
		return "", fmt.Errorf("failed to append OrderCreated event: %w", err)
	}

	// Publish to event bus
	s.eventBus.Publish(event)

	// Run compliance check (pre-trade)
	complianceResult, err := s.runComplianceCheck(orderID, req.AccountID, correlationID, req.CreatedBy)
	if err != nil {
		// Log error but don't fail order creation
		fmt.Printf("Compliance check failed: %v\n", err)
	} else if complianceResult != nil {
		// Store compliance result
		if err := s.storeComplianceResult(orderID, complianceResult, correlationID, req.CreatedBy); err != nil {
			fmt.Printf("Failed to store compliance result: %v\n", err)
		}

		// If blocked, emit OrderBlockedByCompliance event
		if complianceResult.Status == ComplianceStatusBlock {
			s.emitComplianceBlockedEvent(orderID, complianceResult, correlationID, req.CreatedBy)
			return orderID, ErrComplianceBlocked
		}

		// If needs approval, emit OrderApprovalRequested event
		if complianceResult.Status == ComplianceStatusWarn || s.needsApproval(req) {
			s.emitApprovalRequestedEvent(orderID, correlationID, req.CreatedBy)
		}
	}

	return orderID, nil
}

// AmendOrder amends an existing order
func (s *Service) AmendOrder(req AmendOrderRequest, correlationID string) error {
	// Validate amendment is allowed based on current state
	// This would query the projection to get current order state
	// For now, we'll emit the event

	payload := map[string]interface{}{
		"orderId":   req.OrderID,
		"updatedBy": req.UpdatedBy,
	}

	if req.Quantity != nil {
		payload["quantity"] = *req.Quantity
	}
	if req.OrderType != nil {
		payload["orderType"] = *req.OrderType
	}
	if req.LimitPrice != nil {
		payload["limitPrice"] = *req.LimitPrice
	}
	if req.CurveSpreadBp != nil {
		payload["curveSpreadBp"] = *req.CurveSpreadBp
	}

	event := events.NewEvent(
		events.EventOrderAmended,
		events.AggregateOrder,
		req.OrderID,
		req.UpdatedBy,
		"user",
		correlationID,
		payload,
	)

	if err := s.eventStore.Append(event); err != nil {
		return fmt.Errorf("failed to append OrderAmended event: %w", err)
	}

	s.eventBus.Publish(event)

	// Re-run compliance check if needed
	// ... (simplified for MVP)

	return nil
}

// ApproveOrder approves an order that is pending approval
func (s *Service) ApproveOrder(req ApproveOrderRequest, correlationID string) error {
	// Validate state is APPROVAL_PENDING (would query projection)
	// For MVP, we'll emit the event

	payload := map[string]interface{}{
		"orderId":    req.OrderID,
		"approvedBy": req.ApprovedBy,
		"approvedAt": time.Now().UTC(),
	}

	event := events.NewEvent(
		events.EventOrderApproved,
		events.AggregateOrder,
		req.OrderID,
		req.ApprovedBy,
		"user",
		correlationID,
		payload,
	)

	if err := s.eventStore.Append(event); err != nil {
		return fmt.Errorf("failed to append OrderApproved event: %w", err)
	}

	s.eventBus.Publish(event)

	// Run pre-execution compliance check
	// ... (simplified for MVP)

	return nil
}

// CancelOrder cancels an order
func (s *Service) CancelOrder(req CancelOrderRequest, correlationID string) error {
	payload := map[string]interface{}{
		"orderId":     req.OrderID,
		"cancelledBy": req.CancelledBy,
		"cancelledAt": time.Now().UTC(),
	}

	if req.Reason != "" {
		payload["reason"] = req.Reason
	}

	event := events.NewEvent(
		events.EventOrderCancelled,
		events.AggregateOrder,
		req.OrderID,
		req.CancelledBy,
		"user",
		correlationID,
		payload,
	)

	if err := s.eventStore.Append(event); err != nil {
		return fmt.Errorf("failed to append OrderCancelled event: %w", err)
	}

	s.eventBus.Publish(event)

	return nil
}

// SendToEMS sends an approved order to the EMS
func (s *Service) SendToEMS(req SendToEMSRequest, correlationID string) error {
	// Validate order is APPROVED (would query projection)

	payload := map[string]interface{}{
		"orderId":     req.OrderID,
		"sentBy":      req.SentBy,
		"sentToEmsAt": time.Now().UTC(),
	}

	event := events.NewEvent(
		events.EventOrderSentToEMS,
		events.AggregateOrder,
		req.OrderID,
		req.SentBy,
		"user",
		correlationID,
		payload,
	)

	if err := s.eventStore.Append(event); err != nil {
		return fmt.Errorf("failed to append OrderSentToEMS event: %w", err)
	}

	s.eventBus.Publish(event)

	return nil
}

// validateCreateOrderRequest validates the create order request
func (s *Service) validateCreateOrderRequest(req CreateOrderRequest) error {
	if req.Quantity <= 0 {
		return ErrInvalidQuantity
	}

	switch req.OrderType {
	case OrderTypeLimit:
		if req.LimitPrice == nil {
			return ErrMissingLimitPrice
		}
	case OrderTypeCurveRelative:
		if req.CurveSpreadBp == nil {
			return ErrMissingCurveSpread
		}
	case OrderTypeMarket:
		// No additional validation needed
	default:
		return ErrInvalidOrderType
	}

	return nil
}

// runComplianceCheck runs pre-trade compliance checks
// This is a stub - would integrate with actual compliance service
func (s *Service) runComplianceCheck(orderID, accountID, correlationID, actorID string) (*ComplianceResult, error) {
	// Stub implementation - always returns PASS
	// In real implementation, this would call the compliance service
	return &ComplianceResult{
		Status:      ComplianceStatusPass,
		RulesPassed: []string{"max_order_size", "max_duration"},
		Warnings:    []ComplianceViolation{},
		Blocks:      []ComplianceViolation{},
		CheckedAt:   time.Now().UTC(),
	}, nil
}

// storeComplianceResult stores compliance result by emitting RuleEvaluated event
func (s *Service) storeComplianceResult(orderID string, result *ComplianceResult, correlationID, actorID string) error {
	resultJSON, _ := json.Marshal(result)
	payload := map[string]interface{}{
		"orderId":          orderID,
		"complianceResult": json.RawMessage(resultJSON),
		"status":           result.Status,
	}

	event := events.NewEvent(
		events.EventRuleEvaluated,
		events.AggregateOrder,
		orderID,
		actorID,
		"system",
		correlationID,
		payload,
	)

	if err := s.eventStore.Append(event); err != nil {
		return err
	}

	s.eventBus.Publish(event)
	return nil
}

// emitComplianceBlockedEvent emits OrderBlockedByCompliance event
func (s *Service) emitComplianceBlockedEvent(orderID string, result *ComplianceResult, correlationID, actorID string) {
	payload := map[string]interface{}{
		"orderId": orderID,
		"blocks":  result.Blocks,
	}

	event := events.NewEvent(
		events.EventOrderBlockedByCompliance,
		events.AggregateOrder,
		orderID,
		actorID,
		"system",
		correlationID,
		payload,
	)

	s.eventStore.Append(event)
	s.eventBus.Publish(event)
}

// emitApprovalRequestedEvent emits OrderApprovalRequested event
func (s *Service) emitApprovalRequestedEvent(orderID, correlationID, actorID string) {
	payload := map[string]interface{}{
		"orderId": orderID,
	}

	event := events.NewEvent(
		events.EventOrderApprovalRequested,
		events.AggregateOrder,
		orderID,
		actorID,
		"system",
		correlationID,
		payload,
	)

	s.eventStore.Append(event)
	s.eventBus.Publish(event)
}

// needsApproval determines if an order needs manual approval
// This is a stub - would have more complex logic in production
func (s *Service) needsApproval(req CreateOrderRequest) bool {
	// For MVP, require approval for large orders
	return req.Quantity > 1000000
}
