package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"instant/services/api/eventstore"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

type ComplianceQueryHandler struct {
	db         *sql.DB
	eventStore *eventstore.EventStore
}

func NewComplianceQueryHandler(db *sql.DB, es *eventstore.EventStore) (*ComplianceQueryHandler, error) {
	return &ComplianceQueryHandler{db: db, eventStore: es}, nil
}

func (h *ComplianceQueryHandler) GetRules(c *gin.Context) {
	severity := c.Query("severity")
	scope := c.Query("scope")
	status := c.Query("status")
	evaluationPoint := c.Query("evaluationPoint")

	query := `
		SELECT r."ruleId", r."ruleKey", r.name, r.description, r.version, r.severity, r.scope, r."scopeId",
		       r.predicate, r."explanationTemplate", r."evaluationPoints", r.status,
		       r."effectiveFrom", r."effectiveTo", r."evaluationCount", r."violationCount",
		       r."createdAt", r."createdBy", r."updatedAt", r."updatedBy", r."lastEvaluatedAt", r."lastViolatedAt",
		       h.name as "householdName", a.name as "accountName"
		FROM compliance_rules r
		LEFT JOIN households h ON r.scope = 'HOUSEHOLD' AND r."scopeId" = h."householdId"
		LEFT JOIN accounts a ON r.scope = 'ACCOUNT' AND r."scopeId" = a."accountId"
		WHERE 1=1
	`

	args := []interface{}{}
	argPos := 1
	if severity != "" {
		query += fmt.Sprintf(" AND r.severity = $%d", argPos)
		args = append(args, severity)
		argPos++
	}
	if scope != "" {
		query += fmt.Sprintf(" AND r.scope = $%d", argPos)
		args = append(args, scope)
		argPos++
	}
	if status != "" {
		query += fmt.Sprintf(" AND r.status = $%d", argPos)
		args = append(args, status)
		argPos++
	}
	query += ` ORDER BY r."updatedAt" DESC`

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	rules := []map[string]interface{}{}
	for rows.Next() {
		var (
			ruleID          string
			ruleKey         string
			name            string
			description     sql.NullString
			version         int
			severityVal     string
			scopeVal        string
			scopeID         sql.NullString
			predicateJSON   []byte
			explanation     string
			evalPointsJSON  []byte
			statusVal       string
			effectiveFrom   time.Time
			effectiveTo     sql.NullTime
			evaluationCount int
			violationCount  int
			createdAt       time.Time
			createdBy       string
			updatedAt       time.Time
			updatedBy       string
			lastEvaluatedAt sql.NullTime
			lastViolatedAt  sql.NullTime
			householdName   sql.NullString
			accountName     sql.NullString
		)

		if err := rows.Scan(
			&ruleID,
			&ruleKey,
			&name,
			&description,
			&version,
			&severityVal,
			&scopeVal,
			&scopeID,
			&predicateJSON,
			&explanation,
			&evalPointsJSON,
			&statusVal,
			&effectiveFrom,
			&effectiveTo,
			&evaluationCount,
			&violationCount,
			&createdAt,
			&createdBy,
			&updatedAt,
			&updatedBy,
			&lastEvaluatedAt,
			&lastViolatedAt,
			&householdName,
			&accountName,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if evaluationPoint != "" && !containsEvaluationPoint(evalPointsJSON, evaluationPoint) {
			continue
		}

		predicate := map[string]interface{}{}
		_ = json.Unmarshal(predicateJSON, &predicate)

		evaluationPoints := []string{}
		_ = json.Unmarshal(evalPointsJSON, &evaluationPoints)

		rule := map[string]interface{}{
			"ruleId":           ruleID,
			"ruleKey":          ruleKey,
			"name":             name,
			"version":          version,
			"severity":         severityVal,
			"scope":            scopeVal,
			"predicate":        predicate,
			"explanationTemplate": explanation,
			"evaluationPoints": evaluationPoints,
			"status":           statusVal,
			"effectiveFrom":    effectiveFrom,
			"evaluationCount":  evaluationCount,
			"violationCount":   violationCount,
			"createdAt":        createdAt,
			"createdBy":        createdBy,
			"updatedAt":        updatedAt,
			"updatedBy":        updatedBy,
		}
		if description.Valid {
			rule["description"] = description.String
		}
		if scopeID.Valid {
			rule["scopeId"] = scopeID.String
		}
		if effectiveTo.Valid {
			rule["effectiveTo"] = effectiveTo.Time
		}
		if lastEvaluatedAt.Valid {
			rule["lastEvaluatedAt"] = lastEvaluatedAt.Time
		}
		if lastViolatedAt.Valid {
			rule["lastViolatedAt"] = lastViolatedAt.Time
		}
		if scopeVal == "HOUSEHOLD" && householdName.Valid {
			rule["scopeName"] = householdName.String
		}
		if scopeVal == "ACCOUNT" && accountName.Valid {
			rule["scopeName"] = accountName.String
		}

		rules = append(rules, rule)
	}

	c.JSON(http.StatusOK, gin.H{
		"rules": rules,
		"count": len(rules),
	})
}

func (h *ComplianceQueryHandler) GetRuleDetail(c *gin.Context) {
	ruleID := c.Param("id")

	rule, err := h.fetchRule(ruleID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	versions, _ := h.fetchRuleVersions(ruleID)
	evaluations, _ := h.fetchEvaluations(ruleID)
	violations, _ := h.fetchViolationsByRule(ruleID)

	c.JSON(http.StatusOK, gin.H{
		"rule":        rule,
		"versions":    versions,
		"evaluations": evaluations,
		"violations":  violations,
	})
}

func (h *ComplianceQueryHandler) GetViolations(c *gin.Context) {
	severity := c.Query("severity")
	scope := c.Query("scope")
	accountID := c.Query("accountId")
	ruleID := c.Query("ruleId")
	status := c.Query("status")
	evaluationPoint := c.Query("evaluationPoint")
	fromDate := c.Query("fromDate")
	toDate := c.Query("toDate")

	query := `
		SELECT v."violationId", v."ruleId", v."ruleName", v."ruleVersion", v.severity, v.scope, v."scopeId",
		       v."orderId", v."accountId", v."evaluationPoint", v."metricValue", v."threshold", v.status,
		       v.explanation, v."metricSnapshot", v."evaluatedAt", v."resolvedAt",
		       a.name AS "accountName", h.name AS "householdName"
		FROM compliance_violations v
		LEFT JOIN accounts a ON v."accountId" = a."accountId"
		LEFT JOIN households h ON a."householdId" = h."householdId"
		WHERE 1=1
	`

	args := []interface{}{}
	argPos := 1
	if severity != "" {
		query += fmt.Sprintf(" AND v.severity = $%d", argPos)
		args = append(args, severity)
		argPos++
	}
	if scope != "" {
		query += fmt.Sprintf(" AND v.scope = $%d", argPos)
		args = append(args, scope)
		argPos++
	}
	if accountID != "" {
		query += fmt.Sprintf(" AND v.\"accountId\" = $%d", argPos)
		args = append(args, accountID)
		argPos++
	}
	if ruleID != "" {
		query += fmt.Sprintf(" AND v.\"ruleId\" = $%d", argPos)
		args = append(args, ruleID)
		argPos++
	}
	if status != "" {
		query += fmt.Sprintf(" AND v.status = $%d", argPos)
		args = append(args, status)
		argPos++
	}
	if evaluationPoint != "" {
		query += fmt.Sprintf(" AND v.\"evaluationPoint\" = $%d", argPos)
		args = append(args, evaluationPoint)
		argPos++
	}
	if fromDate != "" {
		query += fmt.Sprintf(" AND v.\"evaluatedAt\" >= $%d", argPos)
		args = append(args, fromDate)
		argPos++
	}
	if toDate != "" {
		query += fmt.Sprintf(" AND v.\"evaluatedAt\" <= $%d", argPos)
		args = append(args, toDate)
		argPos++
	}

	query += ` ORDER BY v."evaluatedAt" DESC`

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	violations := []map[string]interface{}{}
	for rows.Next() {
		var (
			violationID     string
			ruleIDVal       string
			ruleName        string
			ruleVersion     int
			severityVal     string
			scopeVal        string
			scopeID         sql.NullString
			orderID         sql.NullString
			accountIDVal    sql.NullString
			evaluationPointVal string
			metricValue     sql.NullFloat64
			threshold       sql.NullFloat64
			statusVal       string
			explanation     string
			metricSnapshotJSON []byte
			evaluatedAt     time.Time
			resolvedAt      sql.NullTime
			accountName     sql.NullString
			householdName   sql.NullString
		)

		if err := rows.Scan(
			&violationID,
			&ruleIDVal,
			&ruleName,
			&ruleVersion,
			&severityVal,
			&scopeVal,
			&scopeID,
			&orderID,
			&accountIDVal,
			&evaluationPointVal,
			&metricValue,
			&threshold,
			&statusVal,
			&explanation,
			&metricSnapshotJSON,
			&evaluatedAt,
			&resolvedAt,
			&accountName,
			&householdName,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		metricSnapshot := map[string]interface{}{}
		_ = json.Unmarshal(metricSnapshotJSON, &metricSnapshot)

		violation := map[string]interface{}{
			"violationId":     violationID,
			"ruleId":          ruleIDVal,
			"ruleName":        ruleName,
			"ruleVersion":     ruleVersion,
			"severity":        severityVal,
			"scope":           scopeVal,
			"evaluationPoint": evaluationPointVal,
			"status":          statusVal,
			"explanation":     explanation,
			"metricSnapshot":  metricSnapshot,
			"evaluatedAt":     evaluatedAt,
		}
		if scopeID.Valid {
			violation["scopeId"] = scopeID.String
		}
		if orderID.Valid {
			violation["orderId"] = orderID.String
		}
		if accountIDVal.Valid {
			violation["accountId"] = accountIDVal.String
		}
		if metricValue.Valid {
			violation["metricValue"] = metricValue.Float64
		}
		if threshold.Valid {
			violation["threshold"] = threshold.Float64
		}
		if resolvedAt.Valid {
			violation["resolvedAt"] = resolvedAt.Time
		}
		if accountName.Valid {
			violation["accountName"] = accountName.String
		}
		if householdName.Valid {
			violation["householdName"] = householdName.String
		}

		violations = append(violations, violation)
	}

	c.JSON(http.StatusOK, gin.H{
		"violations": violations,
		"count":      len(violations),
	})
}

func (h *ComplianceQueryHandler) fetchRule(ruleID string) (map[string]interface{}, error) {
	query := `
		SELECT r."ruleId", r."ruleKey", r.name, r.description, r.version, r.severity, r.scope, r."scopeId",
		       r.predicate, r."explanationTemplate", r."evaluationPoints", r.status,
		       r."effectiveFrom", r."effectiveTo", r."evaluationCount", r."violationCount",
		       r."createdAt", r."createdBy", r."updatedAt", r."updatedBy", r."lastEvaluatedAt", r."lastViolatedAt",
		       h.name as "householdName", a.name as "accountName"
		FROM compliance_rules r
		LEFT JOIN households h ON r.scope = 'HOUSEHOLD' AND r."scopeId" = h."householdId"
		LEFT JOIN accounts a ON r.scope = 'ACCOUNT' AND r."scopeId" = a."accountId"
		WHERE r."ruleId" = $1
	`

	var (
		ruleKey         string
		name            string
		description     sql.NullString
		version         int
		severityVal     string
		scopeVal        string
		scopeID         sql.NullString
		predicateJSON   []byte
		explanation     string
		evalPointsJSON  []byte
		statusVal       string
		effectiveFrom   time.Time
		effectiveTo     sql.NullTime
		evaluationCount int
		violationCount  int
		createdAt       time.Time
		createdBy       string
		updatedAt       time.Time
		updatedBy       string
		lastEvaluatedAt sql.NullTime
		lastViolatedAt  sql.NullTime
		householdName   sql.NullString
		accountName     sql.NullString
	)

	if err := h.db.QueryRow(query, ruleID).Scan(
		&ruleID,
		&ruleKey,
		&name,
		&description,
		&version,
		&severityVal,
		&scopeVal,
		&scopeID,
		&predicateJSON,
		&explanation,
		&evalPointsJSON,
		&statusVal,
		&effectiveFrom,
		&effectiveTo,
		&evaluationCount,
		&violationCount,
		&createdAt,
		&createdBy,
		&updatedAt,
		&updatedBy,
		&lastEvaluatedAt,
		&lastViolatedAt,
		&householdName,
		&accountName,
	); err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("rule not found")
		}
		return nil, err
	}

	predicate := map[string]interface{}{}
	_ = json.Unmarshal(predicateJSON, &predicate)

	evaluationPoints := []string{}
	_ = json.Unmarshal(evalPointsJSON, &evaluationPoints)

	rule := map[string]interface{}{
		"ruleId":           ruleID,
		"ruleKey":          ruleKey,
		"name":             name,
		"version":          version,
		"severity":         severityVal,
		"scope":            scopeVal,
		"predicate":        predicate,
		"explanationTemplate": explanation,
		"evaluationPoints": evaluationPoints,
		"status":           statusVal,
		"effectiveFrom":    effectiveFrom,
		"evaluationCount":  evaluationCount,
		"violationCount":   violationCount,
		"createdAt":        createdAt,
		"createdBy":        createdBy,
		"updatedAt":        updatedAt,
		"updatedBy":        updatedBy,
	}
	if description.Valid {
		rule["description"] = description.String
	}
	if scopeID.Valid {
		rule["scopeId"] = scopeID.String
	}
	if effectiveTo.Valid {
		rule["effectiveTo"] = effectiveTo.Time
	}
	if lastEvaluatedAt.Valid {
		rule["lastEvaluatedAt"] = lastEvaluatedAt.Time
	}
	if lastViolatedAt.Valid {
		rule["lastViolatedAt"] = lastViolatedAt.Time
	}
	if scopeVal == "HOUSEHOLD" && householdName.Valid {
		rule["scopeName"] = householdName.String
	}
	if scopeVal == "ACCOUNT" && accountName.Valid {
		rule["scopeName"] = accountName.String
	}

	return rule, nil
}

func (h *ComplianceQueryHandler) fetchRuleVersions(ruleID string) ([]map[string]interface{}, error) {
	eventsList, err := h.eventStore.GetByAggregate("Rule", ruleID)
	if err != nil {
		return nil, err
	}

	versions := []map[string]interface{}{}
	for _, event := range eventsList {
		if event.EventType != "RuleCreated" && event.EventType != "RuleUpdated" {
			continue
		}

		payload := event.Payload
		versionFloat, _ := payload["version"].(float64)
		version := int(versionFloat)

		predicate := map[string]interface{}{}
		if raw, ok := payload["predicate"]; ok {
			switch value := raw.(type) {
			case map[string]interface{}:
				predicate = value
			case json.RawMessage:
				_ = json.Unmarshal(value, &predicate)
			}
		}

		versions = append(versions, map[string]interface{}{
			"versionId":          event.EventID,
			"ruleId":             ruleID,
			"version":            version,
			"predicate":          predicate,
			"severity":           payload["severity"],
			"explanationTemplate": payload["explanationTemplate"],
			"createdAt":          event.OccurredAt,
			"createdBy":          event.Actor.ActorID,
		})
	}

	return versions, nil
}

func (h *ComplianceQueryHandler) fetchEvaluations(ruleID string) ([]map[string]interface{}, error) {
	query := `
		SELECT e."evaluationId", e."ruleId", e."ruleVersion", e."orderId", e."accountId", e."evaluationPoint",
		       e.result, e."metricValue", e."threshold", e."metricSnapshot", e.explanation, e."evaluatedAt",
		       a.name AS "accountName"
		FROM compliance_evaluations e
		LEFT JOIN accounts a ON e."accountId" = a."accountId"
		WHERE e."ruleId" = $1
		ORDER BY e."evaluatedAt" DESC
	`

	rows, err := h.db.Query(query, ruleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	results := []map[string]interface{}{}
	for rows.Next() {
		var (
			evaluationID   string
			ruleIDVal      string
			ruleVersion    int
			orderID        sql.NullString
			accountID      sql.NullString
			evaluationPoint string
			resultVal      string
			metricValue    sql.NullFloat64
			threshold      sql.NullFloat64
			metricSnapshotJSON []byte
			explanation    string
			evaluatedAt    time.Time
			accountName    sql.NullString
		)

		if err := rows.Scan(
			&evaluationID,
			&ruleIDVal,
			&ruleVersion,
			&orderID,
			&accountID,
			&evaluationPoint,
			&resultVal,
			&metricValue,
			&threshold,
			&metricSnapshotJSON,
			&explanation,
			&evaluatedAt,
			&accountName,
		); err != nil {
			return nil, err
		}

		metricSnapshot := map[string]interface{}{}
		_ = json.Unmarshal(metricSnapshotJSON, &metricSnapshot)

		evaluation := map[string]interface{}{
			"evaluationId":    evaluationID,
			"ruleId":          ruleIDVal,
			"ruleVersion":     ruleVersion,
			"evaluationPoint": evaluationPoint,
			"result":          resultVal,
			"metricSnapshot":  metricSnapshot,
			"explanation":     explanation,
			"evaluatedAt":     evaluatedAt,
		}
		if orderID.Valid {
			evaluation["orderId"] = orderID.String
		}
		if accountID.Valid {
			evaluation["accountId"] = accountID.String
		}
		if accountName.Valid {
			evaluation["accountName"] = accountName.String
		}
		if metricValue.Valid {
			evaluation["metricValue"] = metricValue.Float64
		}
		if threshold.Valid {
			evaluation["threshold"] = threshold.Float64
		}

		results = append(results, evaluation)
	}

	return results, nil
}

func (h *ComplianceQueryHandler) fetchViolationsByRule(ruleID string) ([]map[string]interface{}, error) {
	query := `
		SELECT v."violationId", v."ruleId", v."ruleName", v."ruleVersion", v.severity, v.scope, v."scopeId",
		       v."orderId", v."accountId", v."evaluationPoint", v."metricValue", v."threshold", v.status,
		       v.explanation, v."metricSnapshot", v."evaluatedAt", v."resolvedAt",
		       a.name AS "accountName", h.name AS "householdName"
		FROM compliance_violations v
		LEFT JOIN accounts a ON v."accountId" = a."accountId"
		LEFT JOIN households h ON a."householdId" = h."householdId"
		WHERE v."ruleId" = $1
		ORDER BY v."evaluatedAt" DESC
	`

	rows, err := h.db.Query(query, ruleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	violations := []map[string]interface{}{}
	for rows.Next() {
		var (
			violationID     string
			ruleIDVal       string
			ruleName        string
			ruleVersion     int
			severityVal     string
			scopeVal        string
			scopeID         sql.NullString
			orderID         sql.NullString
			accountIDVal    sql.NullString
			evaluationPointVal string
			metricValue     sql.NullFloat64
			threshold       sql.NullFloat64
			statusVal       string
			explanation     string
			metricSnapshotJSON []byte
			evaluatedAt     time.Time
			resolvedAt      sql.NullTime
			accountName     sql.NullString
			householdName   sql.NullString
		)

		if err := rows.Scan(
			&violationID,
			&ruleIDVal,
			&ruleName,
			&ruleVersion,
			&severityVal,
			&scopeVal,
			&scopeID,
			&orderID,
			&accountIDVal,
			&evaluationPointVal,
			&metricValue,
			&threshold,
			&statusVal,
			&explanation,
			&metricSnapshotJSON,
			&evaluatedAt,
			&resolvedAt,
			&accountName,
			&householdName,
		); err != nil {
			return nil, err
		}

		metricSnapshot := map[string]interface{}{}
		_ = json.Unmarshal(metricSnapshotJSON, &metricSnapshot)

		violation := map[string]interface{}{
			"violationId":     violationID,
			"ruleId":          ruleIDVal,
			"ruleName":        ruleName,
			"ruleVersion":     ruleVersion,
			"severity":        severityVal,
			"scope":           scopeVal,
			"evaluationPoint": evaluationPointVal,
			"status":          statusVal,
			"explanation":     explanation,
			"metricSnapshot":  metricSnapshot,
			"evaluatedAt":     evaluatedAt,
		}
		if scopeID.Valid {
			violation["scopeId"] = scopeID.String
		}
		if orderID.Valid {
			violation["orderId"] = orderID.String
		}
		if accountIDVal.Valid {
			violation["accountId"] = accountIDVal.String
		}
		if metricValue.Valid {
			violation["metricValue"] = metricValue.Float64
		}
		if threshold.Valid {
			violation["threshold"] = threshold.Float64
		}
		if resolvedAt.Valid {
			violation["resolvedAt"] = resolvedAt.Time
		}
		if accountName.Valid {
			violation["accountName"] = accountName.String
		}
		if householdName.Valid {
			violation["householdName"] = householdName.String
		}

		violations = append(violations, violation)
	}

	return violations, nil
}

func containsEvaluationPoint(data []byte, point string) bool {
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
