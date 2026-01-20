package projections

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"instant/services/api/eventbus"
	"instant/services/api/events"
	"strconv"
	"strings"

	_ "github.com/lib/pq"
)

type ComplianceProjection struct {
	db       *sql.DB
	eventBus *eventbus.EventBus
	stopChan chan struct{}
}

func NewComplianceProjection(db *sql.DB, eb *eventbus.EventBus) (*ComplianceProjection, error) {
	return &ComplianceProjection{
		db:       db,
		eventBus: eb,
		stopChan: make(chan struct{}),
	}, nil
}

func (p *ComplianceProjection) Start() {
	subscriber, cleanup := p.eventBus.Subscribe("*", 1000)
	defer cleanup()

	fmt.Println("Compliance Projection worker started")

	for {
		select {
		case event := <-subscriber:
			if event == nil {
				continue
			}
			if err := p.handleEvent(event); err != nil {
				fmt.Printf("Compliance projection error handling %s: %v\n", event.EventType, err)
			}
		case <-p.stopChan:
			fmt.Println("Compliance Projection worker stopped")
			return
		}
	}
}

func (p *ComplianceProjection) Stop() {
	close(p.stopChan)
}

func (p *ComplianceProjection) handleEvent(event *events.Event) error {
	switch event.EventType {
	case events.EventRuleSetPublished:
		return p.handleRuleSetPublished(event)
	case events.EventRuleCreated:
		return p.handleRuleCreated(event)
	case events.EventRuleUpdated:
		return p.handleRuleUpdated(event)
	case events.EventRuleEnabled:
		return p.handleRuleStatus(event, "ACTIVE")
	case events.EventRuleDisabled:
		return p.handleRuleStatus(event, "INACTIVE")
	case events.EventRuleDeleted:
		return p.handleRuleDeleted(event)
	case events.EventRuleEvaluated:
		return p.handleRuleEvaluated(event)
	case events.EventRuleViolationDetected:
		return p.handleRuleViolationDetected(event)
	}

	return nil
}

func (p *ComplianceProjection) handleRuleSetPublished(event *events.Event) error {
	payload := event.Payload
	ruleSetID, ok := payload["ruleSetId"].(string)
	if !ok || ruleSetID == "" {
		return nil
	}

	effectiveFrom, err := parseTime(payload["effectiveFrom"])
	if err != nil {
		return err
	}
	var effectiveTo interface{}
	if value, ok := payload["effectiveTo"]; ok {
		if parsed, err := parseTime(value); err == nil {
			effectiveTo = parsed
		}
	}

	query := `
		INSERT INTO compliance_rule_sets (
			"ruleSetId", name, description, version, status, "effectiveFrom", "effectiveTo",
			"createdAt", "createdBy", "updatedAt", "updatedBy"
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		ON CONFLICT ("ruleSetId")
		DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description,
			version = EXCLUDED.version, status = EXCLUDED.status,
			"effectiveFrom" = EXCLUDED."effectiveFrom", "effectiveTo" = EXCLUDED."effectiveTo",
			"updatedAt" = EXCLUDED."updatedAt", "updatedBy" = EXCLUDED."updatedBy"
	`

	_, err = p.db.Exec(
		query,
		ruleSetID,
		payload["name"],
		payload["description"],
		payload["version"],
		payload["status"],
		effectiveFrom,
		effectiveTo,
		event.OccurredAt,
		payload["publishedBy"],
		event.OccurredAt,
		payload["publishedBy"],
	)
	return err
}

func (p *ComplianceProjection) handleRuleCreated(event *events.Event) error {
	return p.upsertRule(event, true)
}

func (p *ComplianceProjection) handleRuleUpdated(event *events.Event) error {
	return p.upsertRule(event, false)
}

func (p *ComplianceProjection) upsertRule(event *events.Event, isCreate bool) error {
	payload := event.Payload
	ruleID, ok := payload["ruleId"].(string)
	if !ok || ruleID == "" {
		return nil
	}

	predicateJSON, err := jsonFromPayload(payload["predicate"])
	if err != nil {
		return err
	}
	evaluationPointsJSON, err := jsonFromPayload(payload["evaluationPoints"])
	if err != nil {
		return err
	}

	effectiveFrom, err := parseTime(payload["effectiveFrom"])
	if err != nil {
		return err
	}
	var effectiveTo interface{}
	if value, ok := payload["effectiveTo"]; ok {
		if parsed, err := parseTime(value); err == nil {
			effectiveTo = parsed
		}
	}

	query := `
		INSERT INTO compliance_rules (
			"ruleId", "ruleSetId", "ruleKey", name, description, version,
			severity, scope, "scopeId", predicate, "explanationTemplate",
			"evaluationPoints", status, "effectiveFrom", "effectiveTo",
			"evaluationCount", "violationCount", "createdAt", "createdBy", "updatedAt", "updatedBy"
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
		ON CONFLICT ("ruleId")
		DO UPDATE SET
			"ruleSetId" = EXCLUDED."ruleSetId",
			"ruleKey" = EXCLUDED."ruleKey",
			name = EXCLUDED.name,
			description = EXCLUDED.description,
			version = EXCLUDED.version,
			severity = EXCLUDED.severity,
			scope = EXCLUDED.scope,
			"scopeId" = EXCLUDED."scopeId",
			predicate = EXCLUDED.predicate,
			"explanationTemplate" = EXCLUDED."explanationTemplate",
			"evaluationPoints" = EXCLUDED."evaluationPoints",
			status = EXCLUDED.status,
			"effectiveFrom" = EXCLUDED."effectiveFrom",
			"effectiveTo" = EXCLUDED."effectiveTo",
			"updatedAt" = EXCLUDED."updatedAt",
			"updatedBy" = EXCLUDED."updatedBy"
	`

	createdBy := payload["createdBy"]
	if createdBy == nil {
		createdBy = event.Actor.ActorID
	}
	updatedBy := payload["updatedBy"]
	if updatedBy == nil {
		updatedBy = event.Actor.ActorID
	}

	evaluationCount := 0
	violationCount := 0
	if !isCreate {
		_ = p.db.QueryRow(`SELECT "evaluationCount", "violationCount" FROM compliance_rules WHERE "ruleId" = $1`, ruleID).Scan(&evaluationCount, &violationCount)
	}

	_, err = p.db.Exec(
		query,
		ruleID,
		payload["ruleSetId"],
		payload["ruleKey"],
		payload["name"],
		payload["description"],
		payload["version"],
		payload["severity"],
		payload["scope"],
		payload["scopeId"],
		predicateJSON,
		payload["explanationTemplate"],
		evaluationPointsJSON,
		payload["status"],
		effectiveFrom,
		effectiveTo,
		evaluationCount,
		violationCount,
		event.OccurredAt,
		createdBy,
		event.OccurredAt,
		updatedBy,
	)

	return err
}

func (p *ComplianceProjection) handleRuleStatus(event *events.Event, status string) error {
	payload := event.Payload
	ruleID, ok := payload["ruleId"].(string)
	if !ok || ruleID == "" {
		return nil
	}

	query := `
		UPDATE compliance_rules
		SET status = $1, "updatedAt" = $2, "updatedBy" = $3
		WHERE "ruleId" = $4
	`

	_, err := p.db.Exec(query, status, event.OccurredAt, payload["updatedBy"], ruleID)
	return err
}

func (p *ComplianceProjection) handleRuleDeleted(event *events.Event) error {
	payload := event.Payload
	ruleID, ok := payload["ruleId"].(string)
	if !ok || ruleID == "" {
		return nil
	}

	_, err := p.db.Exec(`DELETE FROM compliance_rules WHERE "ruleId" = $1`, ruleID)
	return err
}

func (p *ComplianceProjection) handleRuleEvaluated(event *events.Event) error {
	payload := event.Payload
	evaluationID, ok := payload["evaluationId"].(string)
	if !ok || evaluationID == "" {
		return nil
	}

	evaluatedAt, err := parseTime(payload["evaluatedAt"])
	if err != nil {
		return err
	}

	metricSnapshotJSON, err := jsonFromPayload(payload["metricSnapshot"])
	if err != nil {
		return err
	}

	metricValue := nullableFloat(payload["metricValue"])
	threshold := nullableFloat(payload["threshold"])

	query := `
		INSERT INTO compliance_evaluations (
			"evaluationId", "ruleId", "ruleVersion", "orderId", "accountId",
			"evaluationPoint", result, "metricValue", "threshold", "metricSnapshot",
			explanation, "evaluatedAt"
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`

	_, err = p.db.Exec(
		query,
		evaluationID,
		payload["ruleId"],
		payload["ruleVersion"],
		payload["orderId"],
		payload["accountId"],
		payload["evaluationPoint"],
		payload["result"],
		metricValue,
		threshold,
		metricSnapshotJSON,
		payload["explanation"],
		evaluatedAt,
	)
	if err != nil {
		return err
	}

	_, _ = p.db.Exec(
		`UPDATE compliance_rules SET "evaluationCount" = "evaluationCount" + 1, "lastEvaluatedAt" = $1 WHERE "ruleId" = $2`,
		evaluatedAt,
		payload["ruleId"],
	)

	return nil
}

func (p *ComplianceProjection) handleRuleViolationDetected(event *events.Event) error {
	payload := event.Payload
	violationID, ok := payload["violationId"].(string)
	if !ok || violationID == "" {
		return nil
	}

	evaluatedAt, err := parseTime(payload["evaluatedAt"])
	if err != nil {
		return err
	}

	metricSnapshotJSON, err := jsonFromPayload(payload["metricSnapshot"])
	if err != nil {
		return err
	}

	metricValue := nullableFloat(payload["metricValue"])
	threshold := nullableFloat(payload["threshold"])

	query := `
		INSERT INTO compliance_violations (
			"violationId", "ruleId", "ruleName", "ruleVersion", severity, scope, "scopeId",
			"orderId", "accountId", "evaluationPoint", "metricValue", "threshold", status,
			explanation, "metricSnapshot", "evaluatedAt", "resolvedAt"
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
	`

	_, err = p.db.Exec(
		query,
		violationID,
		payload["ruleId"],
		payload["ruleName"],
		payload["ruleVersion"],
		payload["severity"],
		payload["scope"],
		payload["scopeId"],
		payload["orderId"],
		payload["accountId"],
		payload["evaluationPoint"],
		metricValue,
		threshold,
		payload["status"],
		payload["explanation"],
		metricSnapshotJSON,
		evaluatedAt,
		nil,
	)
	if err != nil {
		return err
	}

	_, _ = p.db.Exec(
		`UPDATE compliance_rules SET "violationCount" = "violationCount" + 1, "lastViolatedAt" = $1 WHERE "ruleId" = $2`,
		evaluatedAt,
		payload["ruleId"],
	)

	return nil
}

func jsonFromPayload(value interface{}) ([]byte, error) {
	if value == nil {
		return json.Marshal(map[string]interface{}{})
	}

	switch v := value.(type) {
	case json.RawMessage:
		return v, nil
	case []byte:
		return v, nil
	default:
		return json.Marshal(v)
	}
}

func nullableFloat(value interface{}) interface{} {
	switch v := value.(type) {
	case float64:
		return v
	case float32:
		return float64(v)
	case int:
		return float64(v)
	case int64:
		return float64(v)
	case string:
		if parsed, err := strconv.ParseFloat(strings.TrimSpace(v), 64); err == nil {
			return parsed
		}
	case json.Number:
		if parsed, err := v.Float64(); err == nil {
			return parsed
		}
	}
	return nil
}
