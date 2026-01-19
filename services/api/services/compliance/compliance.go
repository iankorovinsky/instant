package compliance

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"instant/services/api/eventbus"
	"instant/services/api/events"
	"instant/services/api/eventstore"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
)

const (
	evaluationPointPreTrade     = "PRE_TRADE"
	evaluationPointPreExecution = "PRE_EXECUTION"
	evaluationPointPostTrade    = "POST_TRADE"
)

type Service struct {
	eventStore *eventstore.EventStore
	eventBus   *eventbus.EventBus
	db         *sql.DB
	stopChan   chan struct{}
}

type Result struct {
	Status      string
	RulesPassed []string
	Warnings    []ViolationSummary
	Blocks      []ViolationSummary
	CheckedAt   time.Time
}

type ViolationSummary struct {
	RuleID      string
	RuleName    string
	Description string
	Metrics     map[string]interface{}
}

type OrderSnapshot struct {
	OrderID      string
	AccountID    string
	InstrumentID string
	Side         string
	Quantity     float64
	OrderType    string
	LimitPrice   sql.NullFloat64
	CurveSpread  sql.NullFloat64
}

type accountSnapshot struct {
	accountID   string
	householdID sql.NullString
}

type ruleRecord struct {
	ruleID               string
	ruleKey              string
	name                 string
	description          sql.NullString
	version              int
	severity             string
	scope                string
	scopeID              sql.NullString
	predicateJSON        []byte
	explanationTemplate  string
	evaluationPointsJSON []byte
	status               string
	effectiveFrom        time.Time
	effectiveTo          sql.NullTime
}

type predicate struct {
	Metric           string                 `json:"metric"`
	Operator         string                 `json:"operator"`
	Value            interface{}            `json:"value"`
	InstrumentFilter map[string]interface{} `json:"instrumentFilter,omitempty"`
}

// NewService creates a new Compliance service.
func NewService(db *sql.DB, es *eventstore.EventStore, eb *eventbus.EventBus) (*Service, error) {
	return &Service{
		eventStore: es,
		eventBus:   eb,
		db:         db,
		stopChan:   make(chan struct{}),
	}, nil
}

// Start listens for events and triggers compliance evaluation.
func (s *Service) Start() {
	subscriber, cleanup := s.eventBus.Subscribe("*", 1000)
	defer cleanup()

	for {
		select {
		case event := <-subscriber:
			if event == nil {
				continue
			}
			s.handleEvent(event)
		case <-s.stopChan:
			return
		}
	}
}

// Stop stops the service listener.
func (s *Service) Stop() {
	close(s.stopChan)
}

func (s *Service) handleEvent(event *events.Event) {
	switch event.EventType {
	case events.EventOrderAmended:
		s.evaluateOrderByID(event, evaluationPointPreTrade)
	case events.EventOrderApproved:
		s.evaluateOrderByID(event, evaluationPointPreExecution)
	case events.EventExecutionRequested:
		s.evaluateOrderByID(event, evaluationPointPreExecution)
	case events.EventSettlementBooked:
		s.evaluateOrderByID(event, evaluationPointPostTrade)
	}
}

// EvaluatePreTrade runs pre-trade compliance checks using provided order snapshot.
func (s *Service) EvaluatePreTrade(order OrderSnapshot, actorID, correlationID string) (*Result, error) {
	return s.evaluate(order, evaluationPointPreTrade, actorID, correlationID)
}

func (s *Service) evaluateOrderByID(event *events.Event, evaluationPoint string) {
	orderID, ok := event.Payload["orderId"].(string)
	if !ok || orderID == "" {
		return
	}

	order, err := s.fetchOrder(orderID)
	if err != nil {
		fmt.Printf("Compliance evaluation failed to load order %s: %v\n", orderID, err)
		return
	}

	_, _ = s.evaluate(*order, evaluationPoint, event.Actor.ActorID, event.CorrelationID)
}

func (s *Service) evaluate(order OrderSnapshot, evaluationPoint, actorID, correlationID string) (*Result, error) {
	account, err := s.fetchAccount(order.AccountID)
	if err != nil {
		return nil, err
	}

	rules, err := s.fetchApplicableRules(order.AccountID, account.householdID, evaluationPoint)
	if err != nil {
		return nil, err
	}

	if len(rules) == 0 {
		return &Result{
			Status:      "PASS",
			RulesPassed: []string{},
			Warnings:    []ViolationSummary{},
			Blocks:      []ViolationSummary{},
			CheckedAt:   time.Now().UTC(),
		}, nil
	}

	portfolioMetrics, err := s.computePortfolioMetrics(order.AccountID)
	if err != nil {
		return nil, err
	}

	orderMetrics, err := s.computeOrderMetrics(order)
	if err != nil {
		return nil, err
	}

	result := &Result{
		Status:      "PASS",
		RulesPassed: []string{},
		Warnings:    []ViolationSummary{},
		Blocks:      []ViolationSummary{},
		CheckedAt:   time.Now().UTC(),
	}

	for _, rule := range rules {
		pred, err := parsePredicate(rule.predicateJSON)
		if err != nil {
			fmt.Printf("Invalid predicate for rule %s: %v\n", rule.ruleID, err)
			continue
		}

		metricValue, metricSnapshot, err := s.resolveMetric(pred, portfolioMetrics, orderMetrics, order.AccountID)
		if err != nil {
			fmt.Printf("Metric resolution error for rule %s: %v\n", rule.ruleID, err)
			continue
		}

		passes := evaluatePredicate(metricValue, pred.Operator, pred.Value)
		evalID := uuid.New().String()
		evaluatedAt := time.Now().UTC()

		resultValue := "PASS"
		if !passes {
			resultValue = rule.severity
		}

		explanation := buildExplanation(rule.explanationTemplate, metricValue, pred.Value)

		s.emitRuleEvaluated(rule, evalID, order, evaluationPoint, resultValue, metricValue, pred.Value, metricSnapshot, explanation, evaluatedAt, actorID, correlationID)

		if passes {
			result.RulesPassed = append(result.RulesPassed, rule.ruleKey)
			continue
		}

		violation := ViolationSummary{
			RuleID:      rule.ruleID,
			RuleName:    rule.name,
			Description: explanation,
			Metrics:     metricSnapshot,
		}

		s.emitRuleViolation(rule, order, evaluationPoint, metricValue, pred.Value, metricSnapshot, explanation, evaluatedAt, actorID, correlationID)

		if rule.severity == "BLOCK" {
			result.Blocks = append(result.Blocks, violation)
		} else {
			result.Warnings = append(result.Warnings, violation)
		}
	}

	if len(result.Blocks) > 0 {
		result.Status = "BLOCK"
	} else if len(result.Warnings) > 0 {
		result.Status = "WARN"
	}

	if evaluationPoint == evaluationPointPreTrade {
		if result.Status == "BLOCK" {
			s.emitOrderBlocked(order.OrderID, result.Blocks, actorID, correlationID)
		}
		if result.Status == "WARN" {
			s.emitOrderWarned(order.OrderID, result.Warnings, actorID, correlationID)
		}
	}

	if evaluationPoint == evaluationPointPreExecution && result.Status == "BLOCK" {
		s.emitExecutionBlocked(order.OrderID, result.Blocks, actorID, correlationID)
	}

	return result, nil
}

func (s *Service) fetchAccount(accountID string) (*accountSnapshot, error) {
	query := `SELECT "accountId", "householdId" FROM accounts WHERE "accountId" = $1`

	var snapshot accountSnapshot
	if err := s.db.QueryRow(query, accountID).Scan(&snapshot.accountID, &snapshot.householdID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("account not found")
		}
		return nil, fmt.Errorf("failed to fetch account: %w", err)
	}

	return &snapshot, nil
}

func (s *Service) fetchOrder(orderID string) (*OrderSnapshot, error) {
	query := `
		SELECT "orderId", "accountId", "instrumentId", side, quantity, "orderType", "limitPrice", "curveSpreadBp"
		FROM orders
		WHERE "orderId" = $1
	`

	var record OrderSnapshot
	if err := s.db.QueryRow(query, orderID).Scan(
		&record.OrderID,
		&record.AccountID,
		&record.InstrumentID,
		&record.Side,
		&record.Quantity,
		&record.OrderType,
		&record.LimitPrice,
		&record.CurveSpread,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("order not found")
		}
		return nil, fmt.Errorf("failed to fetch order: %w", err)
	}

	return &record, nil
}

func (s *Service) fetchApplicableRules(accountID string, householdID sql.NullString, evaluationPoint string) ([]ruleRecord, error) {
	query := `
		SELECT "ruleId", "ruleKey", name, description, version, severity, scope, "scopeId",
		       predicate, "explanationTemplate", "evaluationPoints", status, "effectiveFrom", "effectiveTo"
		FROM compliance_rules
		WHERE status = 'ACTIVE'
		  AND "effectiveFrom" <= $1
		  AND ("effectiveTo" IS NULL OR "effectiveTo" > $1)
		  AND (
		    scope = 'GLOBAL'
		    OR (scope = 'HOUSEHOLD' AND "scopeId" = $2)
		    OR (scope = 'ACCOUNT' AND "scopeId" = $3)
		  )
	`

	now := time.Now().UTC()
	household := ""
	if householdID.Valid {
		household = householdID.String
	}

	rows, err := s.db.Query(query, now, household, accountID)
	if err != nil {
		return nil, fmt.Errorf("failed to query rules: %w", err)
	}
	defer rows.Close()

	rules := []ruleRecord{}
	for rows.Next() {
		var record ruleRecord
		if err := rows.Scan(
			&record.ruleID,
			&record.ruleKey,
			&record.name,
			&record.description,
			&record.version,
			&record.severity,
			&record.scope,
			&record.scopeID,
			&record.predicateJSON,
			&record.explanationTemplate,
			&record.evaluationPointsJSON,
			&record.status,
			&record.effectiveFrom,
			&record.effectiveTo,
		); err != nil {
			return nil, fmt.Errorf("failed to scan rules: %w", err)
		}

		if !hasEvaluationPoint(record.evaluationPointsJSON, evaluationPoint) {
			continue
		}
		rules = append(rules, record)
	}

	return applyRulePrecedence(rules), nil
}

func (s *Service) computePortfolioMetrics(accountID string) (map[string]float64, error) {
	query := `
		SELECT COALESCE(SUM("marketValue"), 0),
		       COALESCE(SUM(duration * "marketValue"), 0),
		       COALESCE(SUM(dv01), 0)
		FROM positions
		WHERE "accountId" = $1
	`

	var marketValue float64
	var durationWeighted float64
	var dv01 float64

	if err := s.db.QueryRow(query, accountID).Scan(&marketValue, &durationWeighted, &dv01); err != nil {
		return nil, fmt.Errorf("failed to compute portfolio metrics: %w", err)
	}

	duration := 0.0
	if marketValue > 0 {
		duration = durationWeighted / marketValue
	}

	cash := 0.0
	cashPct := 0.0
	if marketValue > 0 {
		cashPct = (cash / marketValue) * 100
	}

	return map[string]float64{
		"portfolio.duration":       duration,
		"portfolio.dv01":           dv01,
		"portfolio.marketValue":    marketValue,
		"portfolio.cash":           cash,
		"portfolio.cashPercentage": cashPct,
	}, nil
}

func (s *Service) computeOrderMetrics(order OrderSnapshot) (map[string]interface{}, error) {
	price := 100.0

	query := `SELECT "askPrice" FROM instruments WHERE cusip = $1`
	var askPrice sql.NullFloat64
	if err := s.db.QueryRow(query, order.InstrumentID).Scan(&askPrice); err == nil {
		if askPrice.Valid {
			price = askPrice.Float64
		}
	}

	if order.OrderType == "LIMIT" && order.LimitPrice.Valid {
		price = order.LimitPrice.Float64
	}

	value := order.Quantity * price

	return map[string]interface{}{
		"order.quantity": order.Quantity,
		"order.value":    value,
		"order.side":     order.Side,
	}, nil
}

func (s *Service) resolveMetric(pred predicate, portfolioMetrics map[string]float64, orderMetrics map[string]interface{}, accountID string) (interface{}, map[string]interface{}, error) {
	metric := pred.Metric

	if strings.HasPrefix(metric, "portfolio.") {
		value := portfolioMetrics[metric]
		return value, map[string]interface{}{
			metric: value,
			"portfolio.duration":       portfolioMetrics["portfolio.duration"],
			"portfolio.dv01":           portfolioMetrics["portfolio.dv01"],
			"portfolio.marketValue":    portfolioMetrics["portfolio.marketValue"],
			"portfolio.cash":           portfolioMetrics["portfolio.cash"],
			"portfolio.cashPercentage": portfolioMetrics["portfolio.cashPercentage"],
		}, nil
	}

	if strings.HasPrefix(metric, "order.") {
		value := orderMetrics[metric]
		return value, map[string]interface{}{
			metric: value,
			"order.quantity": orderMetrics["order.quantity"],
			"order.value":    orderMetrics["order.value"],
			"order.side":     orderMetrics["order.side"],
		}, nil
	}

	if strings.HasPrefix(metric, "position.") {
		instrumentID := ""
		if pred.InstrumentFilter != nil {
			if value, ok := pred.InstrumentFilter["cusip"].(string); ok {
				instrumentID = value
			}
		}

		if instrumentID == "" {
			return 0.0, map[string]interface{}{metric: 0.0}, nil
		}

		query := `
			SELECT quantity, "marketValue"
			FROM positions
			WHERE "accountId" = $1 AND "instrumentId" = $2
		`
		var quantity float64
		var marketValue float64
		if err := s.db.QueryRow(query, accountID, instrumentID).Scan(&quantity, &marketValue); err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				return 0.0, map[string]interface{}{metric: 0.0}, nil
			}
			return nil, nil, fmt.Errorf("failed to fetch position: %w", err)
		}

		portfolioMarketValue := portfolioMetrics["portfolio.marketValue"]
		percentage := 0.0
		if portfolioMarketValue > 0 {
			percentage = (marketValue / portfolioMarketValue) * 100
		}

		snapshot := map[string]interface{}{
			"position.quantity":     quantity,
			"position.marketValue":  marketValue,
			"position.percentage":   percentage,
			"position.instrumentId": instrumentID,
		}

		switch metric {
		case "position.quantity":
			return quantity, snapshot, nil
		case "position.marketValue":
			return marketValue, snapshot, nil
		case "position.percentage":
			return percentage, snapshot, nil
		}
	}

	return nil, map[string]interface{}{}, fmt.Errorf("unsupported metric: %s", metric)
}

func (s *Service) emitRuleEvaluated(rule ruleRecord, evaluationID string, order OrderSnapshot, evaluationPoint, result string, metricValue interface{}, threshold interface{}, metricSnapshot map[string]interface{}, explanation string, evaluatedAt time.Time, actorID, correlationID string) {
	payload := map[string]interface{}{
		"evaluationId":    evaluationID,
		"ruleId":          rule.ruleID,
		"ruleVersion":     rule.version,
		"orderId":         order.OrderID,
		"accountId":       order.AccountID,
		"evaluationPoint": evaluationPoint,
		"result":          result,
		"metricValue":     metricValue,
		"threshold":       threshold,
		"metricSnapshot":  metricSnapshot,
		"explanation":     explanation,
		"evaluatedAt":     evaluatedAt,
	}

	event := events.NewEvent(
		events.EventRuleEvaluated,
		events.AggregateRule,
		rule.ruleID,
		actorID,
		"system",
		correlationID,
		payload,
	)

	if err := s.eventStore.Append(event); err == nil {
		s.eventBus.Publish(event)
	}
}

func (s *Service) emitRuleViolation(rule ruleRecord, order OrderSnapshot, evaluationPoint string, metricValue interface{}, threshold interface{}, metricSnapshot map[string]interface{}, explanation string, evaluatedAt time.Time, actorID, correlationID string) {
	payload := map[string]interface{}{
		"violationId":     uuid.New().String(),
		"ruleId":          rule.ruleID,
		"ruleName":        rule.name,
		"ruleVersion":     rule.version,
		"severity":        rule.severity,
		"scope":           rule.scope,
		"scopeId":         nullableString(rule.scopeID),
		"orderId":         order.OrderID,
		"accountId":       order.AccountID,
		"evaluationPoint": evaluationPoint,
		"metricValue":     metricValue,
		"threshold":       threshold,
		"status":          "ACTIVE",
		"explanation":     explanation,
		"metricSnapshot":  metricSnapshot,
		"evaluatedAt":     evaluatedAt,
	}

	event := events.NewEvent(
		events.EventRuleViolationDetected,
		events.AggregateRule,
		rule.ruleID,
		actorID,
		"system",
		correlationID,
		payload,
	)

	if err := s.eventStore.Append(event); err == nil {
		s.eventBus.Publish(event)
	}
}

func (s *Service) emitOrderBlocked(orderID string, blocks []ViolationSummary, actorID, correlationID string) {
	payload := map[string]interface{}{
		"orderId": orderID,
		"blocks":  blocks,
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

	if err := s.eventStore.Append(event); err == nil {
		s.eventBus.Publish(event)
	}
}

func (s *Service) emitOrderWarned(orderID string, warnings []ViolationSummary, actorID, correlationID string) {
	payload := map[string]interface{}{
		"orderId":  orderID,
		"warnings": warnings,
	}

	event := events.NewEvent(
		events.EventOrderWarnedByCompliance,
		events.AggregateOrder,
		orderID,
		actorID,
		"system",
		correlationID,
		payload,
	)

	if err := s.eventStore.Append(event); err == nil {
		s.eventBus.Publish(event)
	}
}

func (s *Service) emitExecutionBlocked(orderID string, blocks []ViolationSummary, actorID, correlationID string) {
	payload := map[string]interface{}{
		"orderId": orderID,
		"blocks":  blocks,
	}

	event := events.NewEvent(
		events.EventExecutionBlockedByCompliance,
		events.AggregateOrder,
		orderID,
		actorID,
		"system",
		correlationID,
		payload,
	)

	if err := s.eventStore.Append(event); err == nil {
		s.eventBus.Publish(event)
	}
}

func parsePredicate(data []byte) (predicate, error) {
	if len(data) == 0 {
		return predicate{}, errors.New("missing predicate")
	}

	var pred predicate
	if err := json.Unmarshal(data, &pred); err != nil {
		return predicate{}, err
	}
	return pred, nil
}

func hasEvaluationPoint(data []byte, point string) bool {
	if len(data) == 0 {
		return false
	}

	var points []string
	if err := json.Unmarshal(data, &points); err != nil {
		return false
	}

	for _, p := range points {
		if p == point {
			return true
		}
	}

	return false
}

func applyRulePrecedence(rules []ruleRecord) []ruleRecord {
	byKey := map[string]ruleRecord{}
	for _, rule := range rules {
		existing, ok := byKey[rule.ruleKey]
		if !ok || scopePriority(rule.scope) > scopePriority(existing.scope) {
			byKey[rule.ruleKey] = rule
		}
	}

	result := make([]ruleRecord, 0, len(byKey))
	for _, rule := range byKey {
		result = append(result, rule)
	}

	return result
}

func scopePriority(scope string) int {
	switch scope {
	case "ACCOUNT":
		return 3
	case "HOUSEHOLD":
		return 2
	case "GLOBAL":
		return 1
	default:
		return 0
	}
}

func evaluatePredicate(metricValue interface{}, operator string, threshold interface{}) bool {
	metricFloat, metricIsNumber := toFloat(metricValue)
	thresholdFloat, thresholdIsNumber := toFloat(threshold)

	if metricIsNumber && thresholdIsNumber {
		switch operator {
		case "<=":
			return metricFloat <= thresholdFloat
		case ">=":
			return metricFloat >= thresholdFloat
		case "<":
			return metricFloat < thresholdFloat
		case ">":
			return metricFloat > thresholdFloat
		case "==":
			return math.Abs(metricFloat-thresholdFloat) < 0.000001
		case "!=":
			return math.Abs(metricFloat-thresholdFloat) >= 0.000001
		case "in":
			return false
		}
	}

	metricStr := fmt.Sprintf("%v", metricValue)

	switch operator {
	case "==":
		return metricStr == fmt.Sprintf("%v", threshold)
	case "!=":
		return metricStr != fmt.Sprintf("%v", threshold)
	case "in":
		if list, ok := threshold.([]interface{}); ok {
			for _, item := range list {
				if metricStr == fmt.Sprintf("%v", item) {
					return true
				}
			}
		}
	}

	return false
}

func toFloat(value interface{}) (float64, bool) {
	switch v := value.(type) {
	case float64:
		return v, true
	case float32:
		return float64(v), true
	case int:
		return float64(v), true
	case int64:
		return float64(v), true
	case json.Number:
		parsed, err := v.Float64()
		if err == nil {
			return parsed, true
		}
	case string:
		parsed, err := strconv.ParseFloat(strings.TrimSpace(v), 64)
		if err == nil {
			return parsed, true
		}
	}

	return 0, false
}

func buildExplanation(template string, metricValue interface{}, threshold interface{}) string {
	if template == "" {
		return fmt.Sprintf("Metric %v compared to %v", metricValue, threshold)
	}

	result := strings.ReplaceAll(template, "{metric}", fmt.Sprintf("%v", metricValue))
	result = strings.ReplaceAll(result, "{value}", fmt.Sprintf("%v", metricValue))
	result = strings.ReplaceAll(result, "{threshold}", fmt.Sprintf("%v", threshold))

	return result
}

func nullableString(value sql.NullString) interface{} {
	if value.Valid {
		return value.String
	}
	return nil
}
