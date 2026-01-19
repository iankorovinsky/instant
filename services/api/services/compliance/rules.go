package compliance

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"instant/services/api/events"
	"time"

	"github.com/google/uuid"
)

type RuleInput struct {
	RuleKey             string
	Name                string
	Description         *string
	Severity            string
	Scope               string
	ScopeID             *string
	Predicate           map[string]interface{}
	ExplanationTemplate string
	EvaluationPoints    []string
	Status              string
	EffectiveFrom       time.Time
	EffectiveTo         *time.Time
	RuleSetID           *string
	ActorID             string
}

type RuleRecord struct {
	RuleID          string
	RuleKey         string
	Version         int
	Status          string
	EvaluationCount int
}

type RuleSetInput struct {
	RuleSetID     string
	Name          string
	Description   *string
	Version       int
	Status        string
	EffectiveFrom time.Time
	EffectiveTo   *time.Time
	ActorID       string
}

func (s *Service) CreateRule(input RuleInput, correlationID string) (string, error) {
	if input.RuleKey == "" || input.Name == "" {
		return "", errors.New("ruleKey and name are required")
	}
	if input.ActorID == "" {
		return "", errors.New("createdBy is required")
	}
	if input.Status == "" {
		input.Status = "DRAFT"
	}
	if input.EffectiveFrom.IsZero() {
		input.EffectiveFrom = time.Now().UTC()
	}

	exists, err := s.ruleKeyExists(input.RuleKey)
	if err != nil {
		return "", err
	}
	if exists {
		return "", errors.New("ruleKey already exists")
	}

	ruleID := uuid.New().String()

	payload, err := buildRulePayload(ruleID, input, 1, input.RuleKey, input.ActorID)
	if err != nil {
		return "", err
	}

	event := events.NewEvent(
		events.EventRuleCreated,
		events.AggregateRule,
		ruleID,
		input.ActorID,
		"user",
		correlationID,
		payload,
	)

	if err := s.eventStore.Append(event); err != nil {
		return "", err
	}
	s.eventBus.Publish(event)

	return ruleID, nil
}

func (s *Service) UpdateRule(ruleID string, input RuleInput, correlationID string) (string, error) {
	if ruleID == "" {
		return "", errors.New("ruleId is required")
	}
	if input.ActorID == "" {
		return "", errors.New("updatedBy is required")
	}

	existing, err := s.fetchRuleRecord(ruleID)
	if err != nil {
		return "", err
	}

	if input.RuleKey != "" && input.RuleKey != existing.RuleKey {
		return "", errors.New("ruleKey cannot be changed")
	}

	if input.Status == "" {
		input.Status = existing.Status
	}
	if input.EffectiveFrom.IsZero() {
		input.EffectiveFrom = time.Now().UTC()
	}

	newVersion := existing.Version + 1
	payload, err := buildRulePayload(ruleID, input, newVersion, existing.RuleKey, input.ActorID)
	if err != nil {
		return "", err
	}

	event := events.NewEvent(
		events.EventRuleUpdated,
		events.AggregateRule,
		ruleID,
		input.ActorID,
		"user",
		correlationID,
		payload,
	)

	if err := s.eventStore.Append(event); err != nil {
		return "", err
	}
	s.eventBus.Publish(event)

	return ruleID, nil
}

func (s *Service) EnableRule(ruleID, actorID, correlationID string) error {
	return s.emitRuleStatus(ruleID, "ACTIVE", events.EventRuleEnabled, actorID, correlationID)
}

func (s *Service) DisableRule(ruleID, actorID, correlationID string) error {
	return s.emitRuleStatus(ruleID, "INACTIVE", events.EventRuleDisabled, actorID, correlationID)
}

func (s *Service) DeleteRule(ruleID, actorID, correlationID string) error {
	if ruleID == "" {
		return errors.New("ruleId is required")
	}

	record, err := s.fetchRuleRecord(ruleID)
	if err != nil {
		return err
	}
	if record.EvaluationCount > 0 {
		return errors.New("rule has evaluations and cannot be deleted")
	}

	payload := map[string]interface{}{
		"ruleId": ruleID,
		"deletedBy": actorID,
	}

	event := events.NewEvent(
		events.EventRuleDeleted,
		events.AggregateRule,
		ruleID,
		actorID,
		"user",
		correlationID,
		payload,
	)

	if err := s.eventStore.Append(event); err != nil {
		return err
	}
	s.eventBus.Publish(event)

	return nil
}

func (s *Service) PublishRuleSet(input RuleSetInput, correlationID string) (string, error) {
	if input.RuleSetID == "" {
		input.RuleSetID = uuid.New().String()
	}
	if input.Name == "" {
		return "", errors.New("name is required")
	}
	if input.ActorID == "" {
		return "", errors.New("actorId is required")
	}
	if input.Status == "" {
		input.Status = "PUBLISHED"
	}
	if input.Version == 0 {
		input.Version = 1
	}
	if input.EffectiveFrom.IsZero() {
		input.EffectiveFrom = time.Now().UTC()
	}

	payload := map[string]interface{}{
		"ruleSetId":     input.RuleSetID,
		"name":          input.Name,
		"description":   input.Description,
		"version":       input.Version,
		"status":        input.Status,
		"effectiveFrom": input.EffectiveFrom,
		"effectiveTo":   input.EffectiveTo,
		"publishedBy":   input.ActorID,
	}

	event := events.NewEvent(
		events.EventRuleSetPublished,
		events.AggregateRuleSet,
		input.RuleSetID,
		input.ActorID,
		"user",
		correlationID,
		payload,
	)

	if err := s.eventStore.Append(event); err != nil {
		return "", err
	}
	s.eventBus.Publish(event)

	return input.RuleSetID, nil
}

func (s *Service) emitRuleStatus(ruleID, status, eventType, actorID, correlationID string) error {
	if ruleID == "" {
		return errors.New("ruleId is required")
	}
	if actorID == "" {
		return errors.New("actorId is required")
	}

	payload := map[string]interface{}{
		"ruleId":   ruleID,
		"status":   status,
		"updatedBy": actorID,
	}

	event := events.NewEvent(
		eventType,
		events.AggregateRule,
		ruleID,
		actorID,
		"user",
		correlationID,
		payload,
	)

	if err := s.eventStore.Append(event); err != nil {
		return err
	}
	s.eventBus.Publish(event)

	return nil
}

func (s *Service) ruleKeyExists(ruleKey string) (bool, error) {
	query := `SELECT 1 FROM compliance_rules WHERE "ruleKey" = $1 LIMIT 1`
	var exists int
	if err := s.db.QueryRow(query, ruleKey).Scan(&exists); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, nil
		}
		return false, fmt.Errorf("failed to check ruleKey: %w", err)
	}
	return true, nil
}

func (s *Service) fetchRuleRecord(ruleID string) (*RuleRecord, error) {
	query := `SELECT "ruleId", "ruleKey", version, status, "evaluationCount" FROM compliance_rules WHERE "ruleId" = $1`
	var record RuleRecord
	if err := s.db.QueryRow(query, ruleID).Scan(&record.RuleID, &record.RuleKey, &record.Version, &record.Status, &record.EvaluationCount); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("rule not found")
		}
		return nil, fmt.Errorf("failed to fetch rule: %w", err)
	}

	return &record, nil
}

func buildRulePayload(ruleID string, input RuleInput, version int, ruleKey string, updatedBy string) (map[string]interface{}, error) {
	predicateJSON, err := json.Marshal(input.Predicate)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal predicate: %w", err)
	}
	evaluationPointsJSON, err := json.Marshal(input.EvaluationPoints)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal evaluationPoints: %w", err)
	}

	payload := map[string]interface{}{
		"ruleId":              ruleID,
		"ruleKey":             ruleKey,
		"name":                input.Name,
		"description":         input.Description,
		"version":             version,
		"severity":            input.Severity,
		"scope":               input.Scope,
		"scopeId":             input.ScopeID,
		"predicate":           json.RawMessage(predicateJSON),
		"explanationTemplate": input.ExplanationTemplate,
		"evaluationPoints":    json.RawMessage(evaluationPointsJSON),
		"status":              input.Status,
		"effectiveFrom":       input.EffectiveFrom,
		"effectiveTo":         input.EffectiveTo,
		"ruleSetId":            input.RuleSetID,
		"updatedBy":           updatedBy,
	}

	if input.Description == nil {
		delete(payload, "description")
	}
	if input.ScopeID == nil {
		delete(payload, "scopeId")
	}
	if input.EffectiveTo == nil {
		delete(payload, "effectiveTo")
	}
	if input.RuleSetID == nil {
		delete(payload, "ruleSetId")
	}

	payload["createdBy"] = input.ActorID

	return payload, nil
}
