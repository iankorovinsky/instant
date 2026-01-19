package ems

import (
	"database/sql"
	"errors"
	"fmt"
	"instant/services/api/eventbus"
	"instant/services/api/events"
	"instant/services/api/eventstore"
	"math"
	"time"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
)

type Service struct {
	eventStore *eventstore.EventStore
	eventBus   *eventbus.EventBus
	db         *sql.DB
	stopChan   chan struct{}
}

type liquidityProfile struct {
	maxClip       float64
	spreadBps     float64
	sizeImpactBps float64
	sideImpactBps float64
}

type orderRecord struct {
	orderID       string
	accountID     string
	instrumentID  string
	side          string
	quantity      float64
	orderType     string
	limitPrice    sql.NullFloat64
	curveSpreadBp sql.NullFloat64
}

type instrumentRecord struct {
	maturityDate time.Time
	askPrice     sql.NullFloat64
}

var (
	ErrOrderNotFound      = errors.New("order not found")
	ErrInstrumentNotFound = errors.New("instrument not found")
)

var bucketProfiles = map[string]liquidityProfile{
	"0-2Y":   {maxClip: 100000, spreadBps: 0.6, sizeImpactBps: 0.2, sideImpactBps: 0.1},
	"2-5Y":   {maxClip: 75000, spreadBps: 0.9, sizeImpactBps: 0.35, sideImpactBps: 0.12},
	"5-10Y":  {maxClip: 50000, spreadBps: 1.3, sizeImpactBps: 0.5, sideImpactBps: 0.15},
	"10-30Y": {maxClip: 35000, spreadBps: 1.8, sizeImpactBps: 0.7, sideImpactBps: 0.2},
	"30Y+":   {maxClip: 30000, spreadBps: 2.2, sizeImpactBps: 0.9, sideImpactBps: 0.25},
}

// NewService creates a new EMS service.
func NewService(db *sql.DB, es *eventstore.EventStore, eb *eventbus.EventBus) (*Service, error) {
	return &Service{
		eventStore: es,
		eventBus:   eb,
		db:         db,
		stopChan:   make(chan struct{}),
	}, nil
}

// Start listens for OrderSentToEMS events and runs execution simulations.
func (s *Service) Start() {
	subscriber, cleanup := s.eventBus.Subscribe(events.EventOrderSentToEMS, 1000)
	defer cleanup()

	for {
		select {
		case event := <-subscriber:
			if event == nil {
				continue
			}
			if err := s.handleOrderSent(event); err != nil {
				fmt.Printf("EMS simulation error for order event %s: %v\n", event.EventID, err)
			}
		case <-s.stopChan:
			return
		}
	}
}

// Stop stops the service listener.
func (s *Service) Stop() {
	close(s.stopChan)
}

// RequestExecution triggers a manual execution simulation.
func (s *Service) RequestExecution(req RequestExecutionRequest, correlationID string) (string, error) {
	if req.OrderID == "" {
		return "", errors.New("orderId is required")
	}
	if req.RequestedBy == "" {
		return "", errors.New("requestedBy is required")
	}

	return s.runSimulation(req.OrderID, req.RequestedBy, correlationID, req.AsOfDate, nil)
}

func (s *Service) handleOrderSent(event *events.Event) error {
	orderID, ok := event.Payload["orderId"].(string)
	if !ok || orderID == "" {
		return errors.New("orderId missing in OrderSentToEMS payload")
	}

	_, err := s.runSimulation(orderID, event.Actor.ActorID, event.CorrelationID, nil, event)
	return err
}

func (s *Service) runSimulation(orderID, actorID, correlationID string, asOfOverride *time.Time, causation *events.Event) (string, error) {
	order, err := s.fetchOrder(orderID)
	if err != nil {
		return "", err
	}

	instrument, err := s.fetchInstrument(order.instrumentID)
	if err != nil {
		return "", err
	}

	asOfDate := time.Now().UTC()
	if asOfOverride != nil {
		asOfDate = asOfOverride.UTC()
	}
	yearsToMaturity := instrument.maturityDate.Sub(asOfDate).Hours() / (24 * 365.25)
	bucket := maturityBucket(yearsToMaturity)
	profile := bucketProfiles[bucket]

	baselinePrice := 100.0
	if instrument.askPrice.Valid {
		baselinePrice = instrument.askPrice.Float64
	}

	if order.orderType == "CURVE_RELATIVE" && order.curveSpreadBp.Valid {
		baselinePrice = baselinePrice * (1 + order.curveSpreadBp.Float64/10000)
	}

	totalQuantity := order.quantity
	maxClip := profile.maxClip
	clipCount := int(math.Ceil(totalQuantity / maxClip))
	if clipCount < 1 {
		clipCount = 1
	}

	executionID := uuid.New().String()
	executionStart := time.Now().UTC()

	deterministicInputs := map[string]interface{}{
		"baselinePrice":  baselinePrice,
		"maturityBucket": bucket,
		"maxClip":        maxClip,
		"spreadBps":      profile.spreadBps,
		"sizeImpactBps":  profile.sizeImpactBps,
		"sideImpactBps":  profile.sideImpactBps,
	}

	execRequested := events.NewEvent(
		events.EventExecutionRequested,
		events.AggregateExecution,
		executionID,
		actorID,
		"user",
		correlationID,
		map[string]interface{}{
			"executionId":    executionID,
			"orderId":        order.orderID,
			"accountId":      order.accountID,
			"instrumentId":   order.instrumentID,
			"side":           order.side,
			"totalQuantity":  totalQuantity,
			"filledQuantity": 0.0,
			"status":         ExecutionStatusPending,
			"asOfDate":       asOfDate,
		},
	)
	if causation != nil {
		execRequested.WithCausation(causation.EventID)
	}
	if err := s.appendAndPublish(execRequested); err != nil {
		return "", err
	}

	totalFilled := 0.0
	totalNotional := 0.0
	totalSlippageWeighted := 0.0
	slippageComponentsWeighted := map[string]float64{
		"bucketSpread": 0,
		"sizeImpact":   0,
		"sideImpact":   0,
	}

	sideMultiplier := 1.0
	if order.side == "SELL" {
		sideMultiplier = -1.0
	}

	for clipIndex := 0; clipIndex < clipCount; clipIndex++ {
		remaining := totalQuantity - totalFilled
		clipQty := math.Min(maxClip, remaining)
		sizeFactor := clipQty / maxClip

		spreadBps := profile.spreadBps
		sizeImpactBps := profile.sizeImpactBps * sizeFactor
		sideImpactBps := profile.sideImpactBps

		totalBps := (spreadBps + sizeImpactBps + sideImpactBps) * sideMultiplier
		price := baselinePrice * (1 + totalBps/10000)

		if order.orderType == "LIMIT" && order.limitPrice.Valid {
			if order.side == "BUY" && price > order.limitPrice.Float64 {
				price = order.limitPrice.Float64
			}
			if order.side == "SELL" && price < order.limitPrice.Float64 {
				price = order.limitPrice.Float64
			}
		}

		slippageBps := ((price - baselinePrice) / baselinePrice) * 10000 * sideMultiplier
		totalSlippageWeighted += slippageBps * clipQty
		slippageComponentsWeighted["bucketSpread"] += spreadBps * sideMultiplier * clipQty
		slippageComponentsWeighted["sizeImpact"] += sizeImpactBps * sideMultiplier * clipQty
		slippageComponentsWeighted["sideImpact"] += sideImpactBps * sideMultiplier * clipQty

		fillEvent := events.NewEvent(
			events.EventFillGenerated,
			events.AggregateExecution,
			executionID,
			actorID,
			"user",
			correlationID,
			map[string]interface{}{
				"fillId":      uuid.New().String(),
				"executionId": executionID,
				"clipIndex":   clipIndex + 1,
				"quantity":    clipQty,
				"price":       price,
				"timestamp":   time.Now().UTC(),
				"slippage":    slippageBps,
			},
		)
		if causation != nil {
			fillEvent.WithCausation(causation.EventID)
		}
		if err := s.appendAndPublish(fillEvent); err != nil {
			return "", err
		}

		totalFilled += clipQty
		totalNotional += clipQty * price

		if totalFilled < totalQuantity {
			partiallyFilled := events.NewEvent(
				events.EventOrderPartiallyFilled,
				events.AggregateOrder,
				order.orderID,
				actorID,
				"user",
				correlationID,
				map[string]interface{}{
					"orderId":        order.orderID,
					"executionId":    executionID,
					"filledQuantity": totalFilled,
				},
			)
			if causation != nil {
				partiallyFilled.WithCausation(causation.EventID)
			}
			if err := s.appendAndPublish(partiallyFilled); err != nil {
				return "", err
			}
		}
	}

	avgFillPrice := 0.0
	if totalFilled > 0 {
		avgFillPrice = totalNotional / totalFilled
	}

	executionEnd := time.Now().UTC()
	averageSlippage := 0.0
	slippageComponents := map[string]float64{
		"bucketSpread": 0,
		"sizeImpact":   0,
		"sideImpact":   0,
	}
	if totalFilled > 0 {
		averageSlippage = totalSlippageWeighted / totalFilled
		slippageComponents["bucketSpread"] = slippageComponentsWeighted["bucketSpread"] / totalFilled
		slippageComponents["sizeImpact"] = slippageComponentsWeighted["sizeImpact"] / totalFilled
		slippageComponents["sideImpact"] = slippageComponentsWeighted["sideImpact"] / totalFilled
	}

	execSimulated := events.NewEvent(
		events.EventExecutionSimulated,
		events.AggregateExecution,
		executionID,
		actorID,
		"user",
		correlationID,
		map[string]interface{}{
			"executionId":         executionID,
			"filledQuantity":      totalFilled,
			"avgFillPrice":        avgFillPrice,
			"slippageTotal":       averageSlippage,
			"slippageBreakdown":   slippageComponents,
			"deterministicInputs": deterministicInputs,
			"status":              ExecutionStatusSimulating,
			"executionStartTime":  executionStart,
			"executionEndTime":    executionEnd,
			"explanation":         "Deterministic execution simulation using bucketed liquidity profile.",
		},
	)
	if causation != nil {
		execSimulated.WithCausation(causation.EventID)
	}
	if err := s.appendAndPublish(execSimulated); err != nil {
		return "", err
	}

	fullyFilled := events.NewEvent(
		events.EventOrderFullyFilled,
		events.AggregateOrder,
		order.orderID,
		actorID,
		"user",
		correlationID,
		map[string]interface{}{
			"orderId":        order.orderID,
			"executionId":    executionID,
			"filledQuantity": totalFilled,
			"avgFillPrice":   avgFillPrice,
		},
	)
	if causation != nil {
		fullyFilled.WithCausation(causation.EventID)
	}
	if err := s.appendAndPublish(fullyFilled); err != nil {
		return "", err
	}

	settlementDate := asOfDate.Add(24 * time.Hour)
	settlementBooked := events.NewEvent(
		events.EventSettlementBooked,
		events.AggregateExecution,
		executionID,
		actorID,
		"user",
		correlationID,
		map[string]interface{}{
			"executionId":    executionID,
			"orderId":        order.orderID,
			"accountId":      order.accountID,
			"instrumentId":   order.instrumentID,
			"side":           order.side,
			"filledQuantity": totalFilled,
			"avgFillPrice":   avgFillPrice,
			"settlementDate": settlementDate,
		},
	)
	if causation != nil {
		settlementBooked.WithCausation(causation.EventID)
	}
	if err := s.appendAndPublish(settlementBooked); err != nil {
		return "", err
	}

	return executionID, nil
}

func (s *Service) appendAndPublish(event *events.Event) error {
	if err := s.eventStore.Append(event); err != nil {
		return err
	}
	s.eventBus.Publish(event)
	return nil
}

func (s *Service) fetchOrder(orderID string) (*orderRecord, error) {
	query := `
		SELECT "orderId", "accountId", "instrumentId", side, quantity, "orderType",
		       "limitPrice", "curveSpreadBp"
		FROM orders
		WHERE "orderId" = $1
	`

	var record orderRecord
	if err := s.db.QueryRow(query, orderID).Scan(
		&record.orderID,
		&record.accountID,
		&record.instrumentID,
		&record.side,
		&record.quantity,
		&record.orderType,
		&record.limitPrice,
		&record.curveSpreadBp,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrOrderNotFound
		}
		return nil, fmt.Errorf("failed to fetch order: %w", err)
	}

	return &record, nil
}

func (s *Service) fetchInstrument(cusip string) (*instrumentRecord, error) {
	query := `
		SELECT "maturityDate", "askPrice"
		FROM instruments
		WHERE cusip = $1
	`

	var record instrumentRecord
	if err := s.db.QueryRow(query, cusip).Scan(
		&record.maturityDate,
		&record.askPrice,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrInstrumentNotFound
		}
		return nil, fmt.Errorf("failed to fetch instrument: %w", err)
	}

	return &record, nil
}

func maturityBucket(yearsToMaturity float64) string {
	if yearsToMaturity <= 2 {
		return "0-2Y"
	}
	if yearsToMaturity <= 5 {
		return "2-5Y"
	}
	if yearsToMaturity <= 10 {
		return "5-10Y"
	}
	if yearsToMaturity <= 30 {
		return "10-30Y"
	}
	return "30Y+"
}
