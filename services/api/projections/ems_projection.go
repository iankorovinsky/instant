package projections

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"instant/services/api/eventbus"
	"instant/services/api/events"

	_ "github.com/lib/pq"
)

// EMSProjection handles building the Execution and Fill read models from events.
type EMSProjection struct {
	db       *sql.DB
	eventBus *eventbus.EventBus
	stopChan chan struct{}
}

// NewEMSProjection creates a new EMS projection worker.
func NewEMSProjection(db *sql.DB, eb *eventbus.EventBus) (*EMSProjection, error) {
	return &EMSProjection{
		db:       db,
		eventBus: eb,
		stopChan: make(chan struct{}),
	}, nil
}

// Start starts the projection worker.
func (p *EMSProjection) Start() {
	subscriber, cleanup := p.eventBus.Subscribe("*", 1000)
	defer cleanup()

	fmt.Println("EMS Projection worker started")

	for {
		select {
		case event := <-subscriber:
			if err := p.handleEvent(event); err != nil {
				fmt.Printf("EMS projection error handling %s: %v\n", event.EventType, err)
			}
		case <-p.stopChan:
			fmt.Println("EMS Projection worker stopped")
			return
		}
	}
}

// Stop stops the projection worker.
func (p *EMSProjection) Stop() {
	close(p.stopChan)
}

func (p *EMSProjection) handleEvent(event *events.Event) error {
	switch event.EventType {
	case events.EventExecutionRequested:
		return p.handleExecutionRequested(event)
	case events.EventExecutionSimulated:
		return p.handleExecutionSimulated(event)
	case events.EventFillGenerated:
		return p.handleFillGenerated(event)
	case events.EventOrderPartiallyFilled:
		return p.handleOrderPartiallyFilled(event)
	case events.EventOrderFullyFilled:
		return p.handleOrderFullyFilled(event)
	case events.EventSettlementBooked:
		return p.handleSettlementBooked(event)
	}

	return nil
}

func (p *EMSProjection) handleExecutionRequested(event *events.Event) error {
	payload := event.Payload
	executionID, ok := payload["executionId"].(string)
	if !ok {
		return nil
	}

	asOfDate, err := parseTime(payload["asOfDate"])
	if err != nil {
		return err
	}

	query := `
		INSERT INTO executions (
			"executionId", "orderId", "accountId", "instrumentId", side,
			"totalQuantity", "filledQuantity", status, "asOfDate",
			"createdAt", "updatedAt"
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`

	_, err = p.db.Exec(
		query,
		executionID,
		payload["orderId"],
		payload["accountId"],
		payload["instrumentId"],
		payload["side"],
		payload["totalQuantity"],
		payload["filledQuantity"],
		payload["status"],
		asOfDate,
		event.OccurredAt,
		event.OccurredAt,
	)

	return err
}

func (p *EMSProjection) handleExecutionSimulated(event *events.Event) error {
	payload := event.Payload
	executionID, ok := payload["executionId"].(string)
	if !ok {
		return nil
	}

	updates := []string{`"updatedAt" = $1`}
	args := []interface{}{event.OccurredAt}
	argPos := 2

	if value, ok := payload["filledQuantity"]; ok {
		updates = append(updates, fmt.Sprintf(`"filledQuantity" = $%d`, argPos))
		args = append(args, value)
		argPos++
	}
	if value, ok := payload["avgFillPrice"]; ok {
		updates = append(updates, fmt.Sprintf(`"avgFillPrice" = $%d`, argPos))
		args = append(args, value)
		argPos++
	}
	if value, ok := payload["slippageTotal"]; ok {
		updates = append(updates, fmt.Sprintf(`"slippageTotal" = $%d`, argPos))
		args = append(args, value)
		argPos++
	}
	if value, ok := payload["slippageBreakdown"]; ok {
		jsonValue, err := json.Marshal(value)
		if err != nil {
			return fmt.Errorf("failed to marshal slippageBreakdown: %w", err)
		}
		updates = append(updates, fmt.Sprintf(`"slippageBreakdown" = $%d`, argPos))
		args = append(args, jsonValue)
		argPos++
	}
	if value, ok := payload["deterministicInputs"]; ok {
		jsonValue, err := json.Marshal(value)
		if err != nil {
			return fmt.Errorf("failed to marshal deterministicInputs: %w", err)
		}
		updates = append(updates, fmt.Sprintf(`"deterministicInputs" = $%d`, argPos))
		args = append(args, jsonValue)
		argPos++
	}
	if value, ok := payload["status"]; ok {
		updates = append(updates, fmt.Sprintf(`status = $%d`, argPos))
		args = append(args, value)
		argPos++
	}
	if value, ok := payload["executionStartTime"]; ok {
		startTime, err := parseTime(value)
		if err != nil {
			return err
		}
		updates = append(updates, fmt.Sprintf(`"executionStartTime" = $%d`, argPos))
		args = append(args, startTime)
		argPos++
	}
	if value, ok := payload["executionEndTime"]; ok {
		endTime, err := parseTime(value)
		if err != nil {
			return err
		}
		updates = append(updates, fmt.Sprintf(`"executionEndTime" = $%d`, argPos))
		args = append(args, endTime)
		argPos++
	}
	if value, ok := payload["explanation"]; ok {
		updates = append(updates, fmt.Sprintf(`explanation = $%d`, argPos))
		args = append(args, value)
		argPos++
	}

	args = append(args, executionID)
	query := fmt.Sprintf(`UPDATE executions SET %s WHERE "executionId" = $%d`, join(updates, ", "), argPos)

	_, err := p.db.Exec(query, args...)
	return err
}

func (p *EMSProjection) handleFillGenerated(event *events.Event) error {
	payload := event.Payload

	query := `
		INSERT INTO fills (
			"fillId", "executionId", "clipIndex", quantity, price, timestamp, slippage, "createdAt"
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`

	timestamp, err := parseTime(payload["timestamp"])
	if err != nil {
		return err
	}

	_, err = p.db.Exec(
		query,
		payload["fillId"],
		payload["executionId"],
		payload["clipIndex"],
		payload["quantity"],
		payload["price"],
		timestamp,
		payload["slippage"],
		event.OccurredAt,
	)

	return err
}

func (p *EMSProjection) handleOrderPartiallyFilled(event *events.Event) error {
	payload := event.Payload
	executionID, ok := payload["executionId"].(string)
	if !ok {
		return nil
	}

	query := `
		UPDATE executions
		SET status = 'PARTIALLY_FILLED', "filledQuantity" = $1, "updatedAt" = $2
		WHERE "executionId" = $3
	`

	_, err := p.db.Exec(query, payload["filledQuantity"], event.OccurredAt, executionID)
	return err
}

func (p *EMSProjection) handleOrderFullyFilled(event *events.Event) error {
	payload := event.Payload
	executionID, ok := payload["executionId"].(string)
	if !ok {
		return nil
	}

	updates := []string{"status = 'FILLED'", `"updatedAt" = $1`}
	args := []interface{}{event.OccurredAt}
	argPos := 2

	if value, ok := payload["filledQuantity"]; ok {
		updates = append(updates, fmt.Sprintf(`"filledQuantity" = $%d`, argPos))
		args = append(args, value)
		argPos++
	}
	if value, ok := payload["avgFillPrice"]; ok {
		updates = append(updates, fmt.Sprintf(`"avgFillPrice" = $%d`, argPos))
		args = append(args, value)
		argPos++
	}

	args = append(args, executionID)
	query := fmt.Sprintf(`UPDATE executions SET %s WHERE "executionId" = $%d`, join(updates, ", "), argPos)

	_, err := p.db.Exec(query, args...)
	return err
}

func (p *EMSProjection) handleSettlementBooked(event *events.Event) error {
	payload := event.Payload
	executionID, ok := payload["executionId"].(string)
	if !ok {
		return nil
	}

	settlementDate, err := parseTime(payload["settlementDate"])
	if err != nil {
		return err
	}

	query := `
		UPDATE executions
		SET status = 'SETTLED', "settlementDate" = $1, "settledDate" = $2, "updatedAt" = $3
		WHERE "executionId" = $4
	`

	_, err = p.db.Exec(query, settlementDate, event.OccurredAt, event.OccurredAt, executionID)
	return err
}
