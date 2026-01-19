package projections

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"instant/services/api/eventbus"
	"instant/services/api/events"
	"log"
	"math"
	"strconv"
	"time"

	_ "github.com/lib/pq"
)

// PMSProjection handles building PMS read models from events.
type PMSProjection struct {
	db       *sql.DB
	eventBus *eventbus.EventBus
	stopChan chan struct{}
}

// NewPMSProjection creates a new PMS projection worker.
func NewPMSProjection(db *sql.DB, eb *eventbus.EventBus) (*PMSProjection, error) {
	return &PMSProjection{
		db:       db,
		eventBus: eb,
		stopChan: make(chan struct{}),
	}, nil
}

// Start starts the projection worker.
func (p *PMSProjection) Start() {
	subscriber, cleanup := p.eventBus.Subscribe("*", 1000)
	defer cleanup()

	fmt.Println("PMS Projection worker started")

	for {
		select {
		case event := <-subscriber:
			if event == nil {
				continue
			}
			if err := p.handleEvent(event); err != nil {
				fmt.Printf("Error handling PMS event %s: %v\n", event.EventType, err)
			}
		case <-p.stopChan:
			fmt.Println("PMS Projection worker stopped")
			return
		}
	}
}

// Stop stops the projection worker.
func (p *PMSProjection) Stop() {
	close(p.stopChan)
}

func (p *PMSProjection) handleEvent(event *events.Event) error {
	switch event.EventType {
	case events.EventSettlementBooked:
		return p.handleSettlementBooked(event)
	case events.EventTargetSet:
		return p.handleTargetSet(event)
	case events.EventProposalGenerated:
		return p.handleProposalGenerated(event)
	case events.EventProposalApproved:
		return p.handleProposalApproved(event)
	case events.EventProposalSentToOMS:
		return p.handleProposalSentToOMS(event)
	}

	return nil
}

func (p *PMSProjection) handleSettlementBooked(event *events.Event) error {
	executionID, ok := event.Payload["executionId"].(string)
	if !ok || executionID == "" {
		return nil
	}

	execution, err := p.fetchExecutionWithRetry(executionID)
	if err != nil {
		payloadExecution, payloadErr := executionFromPayload(event.Payload)
		if payloadErr != nil {
			return err
		}
		execution = payloadExecution
	}

	instrument, err := p.fetchInstrument(execution.instrumentID)
	if err != nil {
		instrument = instrumentSnapshot{}
	}

	price := instrument.askPrice
	if price <= 0 {
		price = execution.avgFillPrice
	}
	if price <= 0 {
		price = 100
	}

	log.Printf(
		"PMS projection: settlement booked executionId=%s accountId=%s instrumentId=%s side=%s filled=%0.2f avgFill=%0.6f",
		executionID,
		execution.accountID,
		execution.instrumentID,
		execution.side,
		execution.filledQuantity,
		execution.avgFillPrice,
	)

	existing, err := p.fetchPosition(execution.accountID, execution.instrumentID)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return err
	}

	quantity := execution.filledQuantity
	if execution.side == "SELL" {
		quantity = -quantity
	}

	newQuantity := existing.quantity + quantity

	newAvgCost := existing.avgCost
	if quantity > 0 {
		totalCost := existing.avgCost*existing.quantity + quantity*price
		if newQuantity > 0 {
			newAvgCost = totalCost / newQuantity
		} else {
			newAvgCost = 0
		}
	}
	if newQuantity <= 0 {
		newAvgCost = 0
	}

	if math.Abs(newQuantity) < 0.000001 {
		_, err := p.db.Exec(`DELETE FROM positions WHERE "accountId" = $1 AND "instrumentId" = $2`, execution.accountID, execution.instrumentID)
		return err
	}

	marketValue := newQuantity * price
	duration := instrument.askDuration
	dv01 := marketValue * duration * 0.0001

	query := `
		INSERT INTO positions ("accountId", "instrumentId", quantity, "avgCost", "marketValue", duration, dv01, "updatedAt")
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT ("accountId", "instrumentId")
		DO UPDATE SET quantity = EXCLUDED.quantity, "avgCost" = EXCLUDED."avgCost",
			"marketValue" = EXCLUDED."marketValue", duration = EXCLUDED.duration,
			dv01 = EXCLUDED.dv01, "updatedAt" = EXCLUDED."updatedAt"
	`

	_, err = p.db.Exec(
		query,
		execution.accountID,
		execution.instrumentID,
		newQuantity,
		newAvgCost,
		marketValue,
		duration,
		dv01,
		event.OccurredAt,
	)
	if err == nil {
		log.Printf(
			"PMS projection: position upserted accountId=%s instrumentId=%s quantity=%0.2f avgCost=%0.6f mv=%0.2f duration=%0.4f",
			execution.accountID,
			execution.instrumentID,
			newQuantity,
			newAvgCost,
			marketValue,
			duration,
		)
	}

	return err
}

func (p *PMSProjection) handleTargetSet(event *events.Event) error {
	payload := event.Payload

	targetID, ok := payload["targetId"].(string)
	if !ok || targetID == "" {
		return nil
	}

	scope := stringify(payload["scope"])
	scopeID := stringify(payload["scopeId"])

	durationTarget := parseFloat(payload["durationTarget"])
	bucketWeights, _ := json.Marshal(payload["bucketWeights"])
	constraints, _ := json.Marshal(payload["constraints"])

	effectiveFrom, err := parseTime(payload["effectiveFrom"])
	if err != nil {
		return err
	}

	var effectiveTo *time.Time
	if value, ok := payload["effectiveTo"]; ok {
		if parsed, err := parseTime(value); err == nil {
			effectiveTo = &parsed
		}
	}

	accountID := ""
	if scope == "account" {
		accountID = scopeID
	}

	query := `
		INSERT INTO portfolio_targets (
			"targetId", scope, "scopeId", "modelId", "durationTarget", "bucketWeights",
			constraints, "effectiveFrom", "effectiveTo", "createdAt", "createdBy", "accountId"
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		ON CONFLICT ("targetId")
		DO UPDATE SET scope = EXCLUDED.scope, "scopeId" = EXCLUDED."scopeId",
			"modelId" = EXCLUDED."modelId", "durationTarget" = EXCLUDED."durationTarget",
			"bucketWeights" = EXCLUDED."bucketWeights", constraints = EXCLUDED.constraints,
			"effectiveFrom" = EXCLUDED."effectiveFrom", "effectiveTo" = EXCLUDED."effectiveTo",
			"accountId" = EXCLUDED."accountId"
	`

	_, err = p.db.Exec(
		query,
		targetID,
		scope,
		scopeID,
		payload["modelId"],
		durationTarget,
		bucketWeights,
		constraints,
		effectiveFrom,
		effectiveTo,
		event.OccurredAt,
		payload["createdBy"],
		accountID,
	)

	return err
}

func (p *PMSProjection) handleProposalGenerated(event *events.Event) error {
	payload := event.Payload

	proposalID, ok := payload["proposalId"].(string)
	if !ok || proposalID == "" {
		return nil
	}

	asOfDate, err := parseTime(payload["asOfDate"])
	if err != nil {
		return err
	}

	trades, _ := json.Marshal(payload["trades"])
	currentAnalytics, _ := json.Marshal(payload["currentAnalytics"])
	predictedAnalytics, _ := json.Marshal(payload["predictedAnalytics"])

	query := `
		INSERT INTO proposals (
			"proposalId", "accountId", "householdId", "asOfDate", "targetId",
			trades, "currentAnalytics", "predictedAnalytics", assumptions, status,
			"createdAt", "createdBy"
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`

	_, err = p.db.Exec(
		query,
		proposalID,
		nullableString(payload["accountId"]),
		nullableString(payload["householdId"]),
		asOfDate,
		nullableString(payload["targetId"]),
		trades,
		currentAnalytics,
		predictedAnalytics,
		payload["assumptions"],
		payload["status"],
		event.OccurredAt,
		payload["createdBy"],
	)
	return err
}

func (p *PMSProjection) handleProposalApproved(event *events.Event) error {
	payload := event.Payload
	proposalID, ok := payload["proposalId"].(string)
	if !ok || proposalID == "" {
		return nil
	}

	query := `
		UPDATE proposals
		SET status = 'APPROVED', "approvedAt" = $1, "approvedBy" = $2
		WHERE "proposalId" = $3
	`

	approvedAt, _ := parseTime(payload["approvedAt"])

	_, err := p.db.Exec(query, approvedAt, payload["approvedBy"], proposalID)
	return err
}

func (p *PMSProjection) handleProposalSentToOMS(event *events.Event) error {
	payload := event.Payload
	proposalID, ok := payload["proposalId"].(string)
	if !ok || proposalID == "" {
		return nil
	}

	query := `
		UPDATE proposals
		SET status = 'SENT_TO_OMS', "sentToOmsAt" = $1
		WHERE "proposalId" = $2
	`

	sentAt, _ := parseTime(payload["sentAt"])

	_, err := p.db.Exec(query, sentAt, proposalID)
	return err
}

type executionRecord struct {
	accountID      string
	instrumentID   string
	side           string
	filledQuantity float64
	avgFillPrice   float64
}

type instrumentSnapshot struct {
	askPrice    float64
	askDuration float64
}

type positionRecord struct {
	quantity float64
	avgCost  float64
}

func (p *PMSProjection) fetchExecution(executionID string) (executionRecord, error) {
	query := `
		SELECT "accountId", "instrumentId", side, "filledQuantity", "avgFillPrice"
		FROM executions
		WHERE "executionId" = $1
	`

	var (
		accountID      string
		instrumentID   string
		side           string
		filledQuantity float64
		avgFillPrice   sql.NullFloat64
	)

	if err := p.db.QueryRow(query, executionID).Scan(
		&accountID,
		&instrumentID,
		&side,
		&filledQuantity,
		&avgFillPrice,
	); err != nil {
		return executionRecord{}, err
	}

	avgPrice := 0.0
	if avgFillPrice.Valid {
		avgPrice = avgFillPrice.Float64
	}

	return executionRecord{
		accountID:      accountID,
		instrumentID:   instrumentID,
		side:           side,
		filledQuantity: filledQuantity,
		avgFillPrice:   avgPrice,
	}, nil
}

func (p *PMSProjection) fetchExecutionWithRetry(executionID string) (executionRecord, error) {
	var lastErr error
	for attempts := 0; attempts < 15; attempts++ {
		record, err := p.fetchExecution(executionID)
		if err == nil {
			return record, nil
		}
		if errors.Is(err, sql.ErrNoRows) {
			lastErr = err
			time.Sleep(500 * time.Millisecond)
			continue
		}
		return executionRecord{}, err
	}
	if lastErr != nil {
		return executionRecord{}, fmt.Errorf("execution %s not found after retry: %w", executionID, lastErr)
	}
	return executionRecord{}, fmt.Errorf("execution %s not found after retry", executionID)
}

func (p *PMSProjection) fetchInstrument(cusip string) (instrumentSnapshot, error) {
	query := `
		SELECT COALESCE("askPrice", 0), COALESCE("askModifiedDuration", 0)
		FROM instruments
		WHERE cusip = $1
	`

	var record instrumentSnapshot
	if err := p.db.QueryRow(query, cusip).Scan(&record.askPrice, &record.askDuration); err != nil {
		return instrumentSnapshot{}, err
	}

	return record, nil
}

func (p *PMSProjection) fetchPosition(accountID, instrumentID string) (positionRecord, error) {
	query := `
		SELECT quantity, "avgCost"
		FROM positions
		WHERE "accountId" = $1 AND "instrumentId" = $2
	`

	var record positionRecord
	if err := p.db.QueryRow(query, accountID, instrumentID).Scan(&record.quantity, &record.avgCost); err != nil {
		return positionRecord{}, err
	}

	return record, nil
}

func executionFromPayload(payload map[string]interface{}) (executionRecord, error) {
	accountID := stringify(payload["accountId"])
	instrumentID := stringify(payload["instrumentId"])
	side := stringify(payload["side"])
	filledQuantity := parseFloat(payload["filledQuantity"])
	avgFillPrice := parseFloat(payload["avgFillPrice"])

	if accountID == "" || instrumentID == "" || side == "" || filledQuantity == 0 {
		return executionRecord{}, fmt.Errorf("missing execution fields in settlement payload")
	}

	return executionRecord{
		accountID:      accountID,
		instrumentID:   instrumentID,
		side:           side,
		filledQuantity: filledQuantity,
		avgFillPrice:   avgFillPrice,
	}, nil
}

func stringify(value interface{}) string {
	switch v := value.(type) {
	case string:
		return v
	case fmt.Stringer:
		return v.String()
	default:
		if value == nil {
			return ""
		}
		return fmt.Sprint(v)
	}
}

func parseFloat(value interface{}) float64 {
	switch v := value.(type) {
	case float64:
		return v
	case float32:
		return float64(v)
	case int:
		return float64(v)
	case int64:
		return float64(v)
	case json.Number:
		if parsed, err := v.Float64(); err == nil {
			return parsed
		}
	case string:
		if parsed, err := strconv.ParseFloat(v, 64); err == nil {
			return parsed
		}
	}
	return 0
}
