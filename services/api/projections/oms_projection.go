package projections

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"instant/services/api/eventbus"
	"instant/services/api/events"

	_ "github.com/lib/pq"
)

// OMSProjection handles building the Order read model from events
type OMSProjection struct {
	db       *sql.DB
	eventBus *eventbus.EventBus
	stopChan chan struct{}
}

// NewOMSProjection creates a new OMS projection worker
func NewOMSProjection(db *sql.DB, eb *eventbus.EventBus) (*OMSProjection, error) {
	return &OMSProjection{
		db:       db,
		eventBus: eb,
		stopChan: make(chan struct{}),
	}, nil
}

// Start starts the projection worker
func (p *OMSProjection) Start() {
	// Subscribe to all OMS events
	subscriber, cleanup := p.eventBus.Subscribe("*", 1000)
	defer cleanup()

	fmt.Println("OMS Projection worker started")

	for {
		select {
		case event := <-subscriber:
			if err := p.handleEvent(event); err != nil {
				fmt.Printf("Error handling event %s: %v\n", event.EventType, err)
			}
		case <-p.stopChan:
			fmt.Println("OMS Projection worker stopped")
			return
		}
	}
}

// Stop stops the projection worker
func (p *OMSProjection) Stop() {
	close(p.stopChan)
}

// handleEvent routes events to appropriate handlers
func (p *OMSProjection) handleEvent(event *events.Event) error {
	switch event.EventType {
	case events.EventOrderCreated:
		return p.handleOrderCreated(event)
	case events.EventOrderAmended:
		return p.handleOrderAmended(event)
	case events.EventOrderApprovalRequested:
		return p.handleOrderApprovalRequested(event)
	case events.EventOrderApproved:
		return p.handleOrderApproved(event)
	case events.EventOrderRejected:
		return p.handleOrderRejected(event)
	case events.EventOrderSentToEMS:
		return p.handleOrderSentToEMS(event)
	case events.EventOrderPartiallyFilled:
		return p.handleOrderPartiallyFilled(event)
	case events.EventOrderFullyFilled:
		return p.handleOrderFullyFilled(event)
	case events.EventSettlementBooked:
		return p.handleSettlementBooked(event)
	case events.EventOrderCancelled:
		return p.handleOrderCancelled(event)
	case events.EventRuleEvaluated:
		return p.handleRuleEvaluated(event)
	case events.EventOrderBlockedByCompliance:
		return p.handleOrderBlockedByCompliance(event)
	}

	return nil
}

// handleOrderCreated creates a new order record
func (p *OMSProjection) handleOrderCreated(event *events.Event) error {
	payload := event.Payload

	query := `
		INSERT INTO orders (
			"orderId", "accountId", "instrumentId", side, quantity, "orderType",
			"limitPrice", "curveSpreadBp", "timeInForce", state,
			"batchId", "createdAt", "createdBy", "updatedAt", "lastStateChangeAt"
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
	`

	_, err := p.db.Exec(
		query,
		payload["orderId"],
		payload["accountId"],
		payload["instrumentId"],
		payload["side"],
		payload["quantity"],
		payload["orderType"],
		payload["limitPrice"],
		payload["curveSpreadBp"],
		payload["timeInForce"],
		payload["state"],
		payload["batchId"],
		event.OccurredAt,
		payload["createdBy"],
		event.OccurredAt,
		event.OccurredAt,
	)

	if err != nil {
		return fmt.Errorf("failed to insert order: %w", err)
	}

	return nil
}

// handleOrderAmended updates an order
func (p *OMSProjection) handleOrderAmended(event *events.Event) error {
	payload := event.Payload
	orderID := payload["orderId"].(string)

	updates := []string{}
	args := []interface{}{}
	argPos := 1

	if quantity, ok := payload["quantity"]; ok {
		updates = append(updates, fmt.Sprintf("quantity = $%d", argPos))
		args = append(args, quantity)
		argPos++
	}

	if orderType, ok := payload["orderType"]; ok {
		updates = append(updates, fmt.Sprintf(`"orderType" = $%d`, argPos))
		args = append(args, orderType)
		argPos++
	}

	if limitPrice, ok := payload["limitPrice"]; ok {
		updates = append(updates, fmt.Sprintf(`"limitPrice" = $%d`, argPos))
		args = append(args, limitPrice)
		argPos++
	}

	if curveSpreadBp, ok := payload["curveSpreadBp"]; ok {
		updates = append(updates, fmt.Sprintf(`"curveSpreadBp" = $%d`, argPos))
		args = append(args, curveSpreadBp)
		argPos++
	}

	if len(updates) == 0 {
		return nil // Nothing to update
	}

	// Add updatedAt
	updates = append(updates, fmt.Sprintf(`"updatedAt" = $%d`, argPos))
	args = append(args, event.OccurredAt)
	argPos++

	// Add WHERE clause
	args = append(args, orderID)

	query := fmt.Sprintf(`UPDATE orders SET %s WHERE "orderId" = $%d`, join(updates, ", "), argPos)

	_, err := p.db.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("failed to update order: %w", err)
	}

	return nil
}

// handleOrderApprovalRequested updates order state to APPROVAL_PENDING
func (p *OMSProjection) handleOrderApprovalRequested(event *events.Event) error {
	payload := event.Payload
	orderID := payload["orderId"].(string)

	query := `
		UPDATE orders
		SET state = 'APPROVAL_PENDING', "lastStateChangeAt" = $1, "updatedAt" = $2
		WHERE "orderId" = $3
	`

	_, err := p.db.Exec(query, event.OccurredAt, event.OccurredAt, orderID)
	return err
}

// handleOrderApproved updates order state to APPROVED
func (p *OMSProjection) handleOrderApproved(event *events.Event) error {
	payload := event.Payload
	orderID := payload["orderId"].(string)

	query := `
		UPDATE orders
		SET state = 'APPROVED', "lastStateChangeAt" = $1, "updatedAt" = $2
		WHERE "orderId" = $3
	`

	_, err := p.db.Exec(query, event.OccurredAt, event.OccurredAt, orderID)
	return err
}

// handleOrderRejected updates order state to REJECTED
func (p *OMSProjection) handleOrderRejected(event *events.Event) error {
	payload := event.Payload
	orderID := payload["orderId"].(string)

	query := `
		UPDATE orders
		SET state = 'REJECTED', "lastStateChangeAt" = $1, "updatedAt" = $2
		WHERE "orderId" = $3
	`

	_, err := p.db.Exec(query, event.OccurredAt, event.OccurredAt, orderID)
	return err
}

// handleOrderSentToEMS updates order state to SENT
func (p *OMSProjection) handleOrderSentToEMS(event *events.Event) error {
	payload := event.Payload
	orderID := payload["orderId"].(string)

	query := `
		UPDATE orders
		SET state = 'SENT', "lastStateChangeAt" = $1, "updatedAt" = $2, "sentToEmsAt" = $3
		WHERE "orderId" = $4
	`

	_, err := p.db.Exec(query, event.OccurredAt, event.OccurredAt, event.OccurredAt, orderID)
	return err
}

// handleOrderPartiallyFilled updates order state to PARTIALLY_FILLED
func (p *OMSProjection) handleOrderPartiallyFilled(event *events.Event) error {
	payload := event.Payload
	orderID := payload["orderId"].(string)

	query := `
		UPDATE orders
		SET state = 'PARTIALLY_FILLED', "lastStateChangeAt" = $1, "updatedAt" = $2
		WHERE "orderId" = $3
	`

	_, err := p.db.Exec(query, event.OccurredAt, event.OccurredAt, orderID)
	return err
}

// handleOrderFullyFilled updates order state to FILLED
func (p *OMSProjection) handleOrderFullyFilled(event *events.Event) error {
	payload := event.Payload
	orderID := payload["orderId"].(string)

	query := `
		UPDATE orders
		SET state = 'FILLED', "lastStateChangeAt" = $1, "updatedAt" = $2, "fullyFilledAt" = $3
		WHERE "orderId" = $4
	`

	_, err := p.db.Exec(query, event.OccurredAt, event.OccurredAt, event.OccurredAt, orderID)
	return err
}

// handleSettlementBooked updates order state to SETTLED
func (p *OMSProjection) handleSettlementBooked(event *events.Event) error {
	payload := event.Payload
	orderID, ok := payload["orderId"].(string)
	if !ok {
		return nil
	}

	query := `
		UPDATE orders
		SET state = 'SETTLED', "lastStateChangeAt" = $1, "updatedAt" = $2, "settledAt" = $3
		WHERE "orderId" = $4
	`

	_, err := p.db.Exec(query, event.OccurredAt, event.OccurredAt, event.OccurredAt, orderID)
	return err
}

// handleOrderCancelled updates order state to CANCELLED
func (p *OMSProjection) handleOrderCancelled(event *events.Event) error {
	payload := event.Payload
	orderID := payload["orderId"].(string)

	query := `
		UPDATE orders
		SET state = 'CANCELLED', "lastStateChangeAt" = $1, "updatedAt" = $2
		WHERE "orderId" = $3
	`

	_, err := p.db.Exec(query, event.OccurredAt, event.OccurredAt, orderID)
	return err
}

// handleRuleEvaluated stores compliance result
func (p *OMSProjection) handleRuleEvaluated(event *events.Event) error {
	payload := event.Payload
	orderID, ok := payload["orderId"].(string)
	if !ok {
		return nil // Not an order-related compliance check
	}

	complianceResultValue, ok := payload["complianceResult"]
	if !ok {
		return nil
	}

	complianceResultJSON, err := json.Marshal(complianceResultValue)
	if err != nil {
		return fmt.Errorf("failed to marshal compliance result: %w", err)
	}

	query := `
		UPDATE orders
		SET "complianceResult" = $1, "updatedAt" = $2
		WHERE "orderId" = $3
	`

	_, err = p.db.Exec(query, complianceResultJSON, event.OccurredAt, orderID)
	return err
}

// handleOrderBlockedByCompliance updates order state to REJECTED
func (p *OMSProjection) handleOrderBlockedByCompliance(event *events.Event) error {
	payload := event.Payload
	orderID := payload["orderId"].(string)

	query := `
		UPDATE orders
		SET state = 'REJECTED', "lastStateChangeAt" = $1, "updatedAt" = $2
		WHERE "orderId" = $3
	`

	_, err := p.db.Exec(query, event.OccurredAt, event.OccurredAt, orderID)
	return err
}

// Helper function to join strings
func join(strs []string, sep string) string {
	if len(strs) == 0 {
		return ""
	}
	result := strs[0]
	for i := 1; i < len(strs); i++ {
		result += sep + strs[i]
	}
	return result
}
