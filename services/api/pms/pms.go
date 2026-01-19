package pms

import (
	"database/sql"
	"encoding/json"
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
}

type positionSnapshot struct {
	accountID      string
	instrumentID   string
	quantity       float64
	avgCost        float64
	marketValue    float64
	duration       float64
	dv01           float64
	instrumentName string
	cusip          string
	price          float64
}

type targetSnapshot struct {
	targetID       string
	durationTarget float64
	bucketWeights  BucketWeights
}

// NewService creates a new PMS service.
func NewService(db *sql.DB, es *eventstore.EventStore, eb *eventbus.EventBus) (*Service, error) {
	return &Service{
		eventStore: es,
		eventBus:   eb,
		db:         db,
	}, nil
}

// SetTarget creates or updates a portfolio target.
func (s *Service) SetTarget(req SetTargetRequest, correlationID string) (string, error) {
	if req.ScopeID == "" {
		return "", errors.New("scopeId is required")
	}
	if req.CreatedBy == "" {
		return "", errors.New("createdBy is required")
	}
	if req.DurationTarget <= 0 {
		return "", errors.New("durationTarget must be greater than 0")
	}

	targetID := req.TargetID
	if targetID == "" {
		targetID = uuid.New().String()
	}

	accountID := ""
	if req.Scope == TargetScopeAccount {
		accountID = req.ScopeID
	}

	payload := map[string]interface{}{
		"targetId":       targetID,
		"scope":          req.Scope,
		"scopeId":        req.ScopeID,
		"durationTarget": req.DurationTarget,
		"bucketWeights":  req.BucketWeights,
		"effectiveFrom":  req.EffectiveFrom,
		"createdBy":      req.CreatedBy,
	}

	if req.ModelID != nil {
		payload["modelId"] = *req.ModelID
	}
	if req.Constraints != nil {
		payload["constraints"] = req.Constraints
	}
	if req.EffectiveTo != nil {
		payload["effectiveTo"] = *req.EffectiveTo
	}
	if accountID != "" {
		payload["accountId"] = accountID
	}

	event := events.NewEvent(
		events.EventTargetSet,
		events.AggregatePortfolio,
		targetID,
		req.CreatedBy,
		"user",
		correlationID,
		payload,
	)

	if err := s.eventStore.Append(event); err != nil {
		return "", fmt.Errorf("failed to append TargetSet event: %w", err)
	}
	s.eventBus.Publish(event)

	return targetID, nil
}

// RunOptimization generates a proposal based on current positions and targets.
func (s *Service) RunOptimization(req RunOptimizationRequest, correlationID string) (string, error) {
	if req.ScopeID == "" {
		return "", errors.New("scopeId is required")
	}
	if req.RequestedBy == "" {
		return "", errors.New("requestedBy is required")
	}

	asOfDate := time.Now().UTC()
	if req.AsOfDate != nil {
		asOfDate = req.AsOfDate.UTC()
	}

	positions, err := s.fetchPositions(req.Scope, req.ScopeID)
	if err != nil {
		return "", err
	}

	currentAnalytics := computeAnalytics(positions)

	target := targetSnapshot{
		targetID:       "",
		durationTarget: req.DurationTarget,
		bucketWeights:  req.BucketWeights,
	}
	if req.TargetID != nil && *req.TargetID != "" {
		if loaded, loadErr := s.fetchTarget(*req.TargetID); loadErr == nil {
			target = loaded
		}
	}

	trades, predictedAnalytics := buildProposalTrades(positions, currentAnalytics, target, req.DurationTarget)

	proposalID := uuid.New().String()

	optimizationRequested := events.NewEvent(
		events.EventOptimizationRequested,
		events.AggregatePortfolio,
		proposalID,
		req.RequestedBy,
		"user",
		correlationID,
		map[string]interface{}{
			"proposalId":     proposalID,
			"scope":          req.Scope,
			"scopeId":        req.ScopeID,
			"targetId":       req.TargetID,
			"modelId":        req.ModelID,
			"durationTarget": req.DurationTarget,
			"bucketWeights":  req.BucketWeights,
			"constraints":    req.Constraints,
			"asOfDate":       asOfDate,
		},
	)

	if err := s.appendAndPublish(optimizationRequested); err != nil {
		return "", err
	}

	payload := map[string]interface{}{
		"proposalId":         proposalID,
		"scope":              req.Scope,
		"scopeId":            req.ScopeID,
		"accountId":          scopeAccountID(req.Scope, req.ScopeID),
		"householdId":        scopeHouseholdID(req.Scope, req.ScopeID),
		"targetId":           req.TargetID,
		"asOfDate":           asOfDate,
		"trades":             trades,
		"currentAnalytics":   currentAnalytics,
		"predictedAnalytics": predictedAnalytics,
		"assumptions":        req.Assumptions,
		"status":             ProposalStatusDraft,
		"createdBy":          req.RequestedBy,
	}
	if target.targetID != "" {
		payload["targetId"] = target.targetID
	}

	proposalGenerated := events.NewEvent(
		events.EventProposalGenerated,
		events.AggregateProposal,
		proposalID,
		req.RequestedBy,
		"user",
		correlationID,
		payload,
	)

	if err := s.appendAndPublish(proposalGenerated); err != nil {
		return "", err
	}

	return proposalID, nil
}

// ApproveProposal approves a proposal.
func (s *Service) ApproveProposal(req ApproveProposalRequest, correlationID string) error {
	if req.ProposalID == "" {
		return errors.New("proposalId is required")
	}
	if req.ApprovedBy == "" {
		return errors.New("approvedBy is required")
	}

	event := events.NewEvent(
		events.EventProposalApproved,
		events.AggregateProposal,
		req.ProposalID,
		req.ApprovedBy,
		"user",
		correlationID,
		map[string]interface{}{
			"proposalId": req.ProposalID,
			"approvedBy": req.ApprovedBy,
			"approvedAt": time.Now().UTC(),
		},
	)

	return s.appendAndPublish(event)
}

// SendProposalToOMS sends proposal trades to OMS as create order commands.
func (s *Service) SendProposalToOMS(req SendProposalToOMSRequest, correlationID string) error {
	if req.ProposalID == "" {
		return errors.New("proposalId is required")
	}
	if req.SentBy == "" {
		return errors.New("sentBy is required")
	}

	trades, err := s.fetchProposalTrades(req.ProposalID)
	if err != nil {
		return err
	}

	for _, trade := range trades {
		command := events.NewEvent(
			"CreateOrder",
			events.AggregateOrder,
			uuid.New().String(),
			req.SentBy,
			"user",
			correlationID,
			map[string]interface{}{
				"accountId":    trade.AccountID,
				"instrumentId": trade.InstrumentID,
				"side":         trade.Side,
				"quantity":     trade.Quantity,
				"orderType":    "MARKET",
				"timeInForce":  "DAY",
				"createdBy":    req.SentBy,
			},
		)
		if err := s.appendAndPublish(command); err != nil {
			return err
		}
	}

	event := events.NewEvent(
		events.EventProposalSentToOMS,
		events.AggregateProposal,
		req.ProposalID,
		req.SentBy,
		"user",
		correlationID,
		map[string]interface{}{
			"proposalId": req.ProposalID,
			"sentBy":     req.SentBy,
			"sentAt":     time.Now().UTC(),
		},
	)

	return s.appendAndPublish(event)
}

type proposalTradeRecord struct {
	AccountID    string
	InstrumentID string
	Side         string
	Quantity     float64
}

func (s *Service) appendAndPublish(event *events.Event) error {
	if err := s.eventStore.Append(event); err != nil {
		return err
	}
	s.eventBus.Publish(event)
	return nil
}

func (s *Service) fetchPositions(scope TargetScope, scopeID string) ([]positionSnapshot, error) {
	query := `
		SELECT p."accountId", p."instrumentId", p.quantity, p."avgCost",
		       p."marketValue", p.duration, p.dv01,
		       i.name, i.cusip, COALESCE(i."askPrice", 0)
		FROM positions p
		LEFT JOIN instruments i ON p."instrumentId" = i.cusip
	`

	args := []interface{}{}
	argPos := 1

	if scope == TargetScopeAccount {
		query += fmt.Sprintf(` WHERE p."accountId" = $%d`, argPos)
		args = append(args, scopeID)
		argPos++
	} else if scope == TargetScopeHousehold {
		query += fmt.Sprintf(` WHERE p."accountId" IN (SELECT "accountId" FROM accounts WHERE "householdId" = $%d)`, argPos)
		args = append(args, scopeID)
		argPos++
	}

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch positions: %w", err)
	}
	defer rows.Close()

	positions := []positionSnapshot{}
	for rows.Next() {
		var record positionSnapshot
		if err := rows.Scan(
			&record.accountID,
			&record.instrumentID,
			&record.quantity,
			&record.avgCost,
			&record.marketValue,
			&record.duration,
			&record.dv01,
			&record.instrumentName,
			&record.cusip,
			&record.price,
		); err != nil {
			return nil, fmt.Errorf("failed to scan positions: %w", err)
		}
		positions = append(positions, record)
	}

	return positions, nil
}

func (s *Service) fetchTarget(targetID string) (targetSnapshot, error) {
	query := `
		SELECT "targetId", "durationTarget", "bucketWeights"
		FROM portfolio_targets
		WHERE "targetId" = $1
	`

	var (
		id            string
		duration      float64
		bucketWeights []byte
	)
	if err := s.db.QueryRow(query, targetID).Scan(&id, &duration, &bucketWeights); err != nil {
		return targetSnapshot{}, err
	}

	weights := BucketWeights{}
	if bucketWeights != nil {
		if err := jsonUnmarshal(bucketWeights, &weights); err != nil {
			return targetSnapshot{}, err
		}
	}

	return targetSnapshot{
		targetID:       id,
		durationTarget: duration,
		bucketWeights:  weights,
	}, nil
}

func (s *Service) fetchProposalTrades(proposalID string) ([]proposalTradeRecord, error) {
	query := `
		SELECT "accountId", trades
		FROM proposals
		WHERE "proposalId" = $1
	`

	var (
		accountID sql.NullString
		tradesRaw []byte
	)
	if err := s.db.QueryRow(query, proposalID).Scan(&accountID, &tradesRaw); err != nil {
		return nil, fmt.Errorf("failed to fetch proposal trades: %w", err)
	}

	trades := []ProposalTrade{}
	if err := jsonUnmarshal(tradesRaw, &trades); err != nil {
		return nil, fmt.Errorf("failed to decode proposal trades: %w", err)
	}

	account := ""
	if accountID.Valid {
		account = accountID.String
	}
	if account == "" {
		return nil, errors.New("proposal missing accountId for OMS routing")
	}

	results := make([]proposalTradeRecord, 0, len(trades))
	for _, trade := range trades {
		results = append(results, proposalTradeRecord{
			AccountID:    account,
			InstrumentID: trade.InstrumentID,
			Side:         trade.Side,
			Quantity:     trade.Quantity,
		})
	}

	return results, nil
}

func computeAnalytics(positions []positionSnapshot) PortfolioAnalytics {
	analytics := PortfolioAnalytics{
		BucketWeights: BucketWeights{},
	}

	totalMarketValue := 0.0
	for _, pos := range positions {
		totalMarketValue += pos.marketValue
	}

	totalDuration := 0.0
	totalDv01 := 0.0

	for _, pos := range positions {
		if totalMarketValue > 0 {
			totalDuration += (pos.duration * pos.marketValue) / totalMarketValue
		}
		totalDv01 += pos.dv01
	}

	analytics.TotalMarketValue = totalMarketValue
	analytics.TotalDuration = totalDuration
	analytics.TotalDv01 = totalDv01
	analytics.CashBalance = 0
	if totalMarketValue > 0 {
		analytics.CashPercentage = 0
	}

	return analytics
}

func buildProposalTrades(positions []positionSnapshot, analytics PortfolioAnalytics, target targetSnapshot, durationTarget float64) ([]ProposalTrade, PortfolioAnalytics) {
	trades := []ProposalTrade{}
	predicted := analytics

	currentDuration := analytics.TotalDuration
	targetDuration := durationTarget
	if target.durationTarget > 0 {
		targetDuration = target.durationTarget
	}

	delta := targetDuration - currentDuration
	if math.Abs(delta) < 0.01 {
		return trades, predicted
	}

	var candidate *positionSnapshot
	for i := range positions {
		pos := &positions[i]
		if candidate == nil || pos.duration > candidate.duration {
			candidate = pos
		}
	}

	if candidate == nil {
		return trades, predicted
	}

	price := candidate.price
	if price <= 0 {
		price = candidate.avgCost
	}
	if price <= 0 {
		price = 100
	}

	side := "BUY"
	if delta < 0 {
		side = "SELL"
	}

	notionalBase := math.Max(analytics.TotalMarketValue, 100000)
	quantity := math.Abs(delta) * notionalBase / (math.Max(candidate.duration, 0.01) * price)
	quantity = math.Max(quantity, 1)

	tradeValue := quantity * price
	trades = append(trades, ProposalTrade{
		Side:           side,
		InstrumentID:   candidate.instrumentID,
		Cusip:          candidate.cusip,
		Description:    candidate.instrumentName,
		Quantity:       quantity,
		EstimatedPrice: price,
		EstimatedValue: tradeValue,
	})

	if analytics.TotalMarketValue > 0 {
		newMarketValue := analytics.TotalMarketValue
		if side == "BUY" {
			newMarketValue += tradeValue
		} else {
			newMarketValue = math.Max(0, newMarketValue-tradeValue)
		}
		predicted.TotalMarketValue = newMarketValue
		if newMarketValue > 0 {
			predicted.TotalDuration = (analytics.TotalDuration*analytics.TotalMarketValue + candidate.duration*tradeValue*sideMultiplier(side)) / newMarketValue
		}
		predicted.TotalDv01 = predicted.TotalMarketValue * predicted.TotalDuration * 0.0001
	}

	return trades, predicted
}

func sideMultiplier(side string) float64 {
	if side == "SELL" {
		return -1
	}
	return 1
}

func scopeAccountID(scope TargetScope, scopeID string) string {
	if scope == TargetScopeAccount {
		return scopeID
	}
	return ""
}

func scopeHouseholdID(scope TargetScope, scopeID string) string {
	if scope == TargetScopeHousehold {
		return scopeID
	}
	return ""
}

func jsonUnmarshal(data []byte, dest interface{}) error {
	if data == nil {
		return nil
	}
	return json.Unmarshal(data, dest)
}
