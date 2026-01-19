package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

// PMSQueryHandler handles PMS query operations.
type PMSQueryHandler struct {
	db *sql.DB
}

// NewPMSQueryHandler creates a new PMS query handler.
func NewPMSQueryHandler(db *sql.DB) (*PMSQueryHandler, error) {
	return &PMSQueryHandler{db: db}, nil
}

// GetAccountView returns an account view with positions and analytics.
func (h *PMSQueryHandler) GetAccountView(c *gin.Context) {
	accountID := c.Param("id")
	asOfDate := parseDateQuery(c.Query("asOfDate"))

	account, err := h.fetchAccount(accountID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	positions, latestUpdate, err := h.fetchPositionsByAccount(accountID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if len(positions) == 0 {
		executionPositions, builtAt, buildErr := h.positionsFromExecutions(accountID)
		if buildErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": buildErr.Error()})
			return
		}
		if len(executionPositions) > 0 {
			positions = executionPositions
			latestUpdate = builtAt
		}
	}

	analytics := computeAnalyticsWithBuckets(positions, asOfDate)
	viewAsOf := latestUpdate
	if !asOfDate.IsZero() {
		viewAsOf = asOfDate
	}

	c.JSON(http.StatusOK, gin.H{
		"account":   account,
		"positions": positions,
		"analytics": analytics,
		"asOfDate":  viewAsOf,
	})
}

// GetAccounts returns account list with basic stats.
func (h *PMSQueryHandler) GetAccounts(c *gin.Context) {
	query := `
		SELECT a."accountId", a."householdId", a.name, a."accountType",
		       a."modelId", a."createdAt", a."createdBy", h.name AS "householdName",
		       COALESCE(SUM(p."marketValue"), 0) AS "marketValue",
		       COALESCE(SUM(p.duration * p."marketValue"), 0) AS "durationWeighted",
		       MAX(COALESCE(p."updatedAt", a."createdAt")) AS "lastActivity"
		FROM accounts a
		LEFT JOIN households h ON a."householdId" = h."householdId"
		LEFT JOIN positions p ON p."accountId" = a."accountId"
		GROUP BY a."accountId", a."householdId", a.name, a."accountType", a."modelId", a."createdAt", a."createdBy", h.name
		ORDER BY a."createdAt" DESC
	`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	accounts := []map[string]interface{}{}
	for rows.Next() {
		var (
			accountID        string
			householdID      string
			name             string
			accountType      string
			modelID          sql.NullString
			createdAt        time.Time
			createdBy        string
			householdName    sql.NullString
			marketValue      float64
			durationWeighted float64
			lastActivity     sql.NullTime
		)

		if err := rows.Scan(
			&accountID,
			&householdID,
			&name,
			&accountType,
			&modelID,
			&createdAt,
			&createdBy,
			&householdName,
			&marketValue,
			&durationWeighted,
			&lastActivity,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		duration := 0.0
		if marketValue > 0 {
			duration = durationWeighted / marketValue
		}

		account := map[string]interface{}{
			"accountId":    accountID,
			"householdId":  householdID,
			"name":         name,
			"accountType":  accountType,
			"createdAt":    createdAt,
			"createdBy":    createdBy,
			"marketValue":  marketValue,
			"duration":     duration,
			"lastActivity": createdAt,
		}
		if modelID.Valid {
			account["modelId"] = modelID.String
		}
		if householdName.Valid {
			account["householdName"] = householdName.String
		}
		if lastActivity.Valid {
			account["lastActivity"] = lastActivity.Time
		}

		accounts = append(accounts, account)
	}

	c.JSON(http.StatusOK, gin.H{
		"accounts": accounts,
		"count":    len(accounts),
	})
}

// GetHouseholds returns household list with aggregated stats.
func (h *PMSQueryHandler) GetHouseholds(c *gin.Context) {
	query := `
		SELECT h."householdId", h.name, h."createdAt", h."createdBy",
		       COUNT(DISTINCT a."accountId") AS "accountCount",
		       COALESCE(SUM(p."marketValue"), 0) AS "totalMarketValue",
		       MAX(COALESCE(p."updatedAt", a."createdAt", h."createdAt")) AS "lastActivity"
		FROM households h
		LEFT JOIN accounts a ON h."householdId" = a."householdId"
		LEFT JOIN positions p ON p."accountId" = a."accountId"
		GROUP BY h."householdId", h.name, h."createdAt", h."createdBy"
		ORDER BY h."createdAt" DESC
	`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	households := []map[string]interface{}{}
	for rows.Next() {
		var (
			householdID      string
			name             string
			createdAt        time.Time
			createdBy        string
			accountCount     int
			totalMarketValue float64
			lastActivity     sql.NullTime
		)
		if err := rows.Scan(
			&householdID,
			&name,
			&createdAt,
			&createdBy,
			&accountCount,
			&totalMarketValue,
			&lastActivity,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		household := map[string]interface{}{
			"householdId":      householdID,
			"name":             name,
			"createdAt":        createdAt,
			"createdBy":        createdBy,
			"accountCount":     accountCount,
			"totalMarketValue": totalMarketValue,
			"lastActivity":     createdAt,
		}
		if lastActivity.Valid {
			household["lastActivity"] = lastActivity.Time
		}

		households = append(households, household)
	}

	c.JSON(http.StatusOK, gin.H{
		"households": households,
		"count":      len(households),
	})
}

// GetHouseholdView returns a household view with aggregated positions and analytics.
func (h *PMSQueryHandler) GetHouseholdView(c *gin.Context) {
	householdID := c.Param("id")
	asOfDate := parseDateQuery(c.Query("asOfDate"))

	household, err := h.fetchHousehold(householdID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	accounts, err := h.fetchAccountsByHousehold(householdID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	positions, latestUpdate, err := h.fetchPositionsByHousehold(householdID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	analytics := computeAnalyticsWithBuckets(positions, asOfDate)
	viewAsOf := latestUpdate
	if !asOfDate.IsZero() {
		viewAsOf = asOfDate
	}

	c.JSON(http.StatusOK, gin.H{
		"household": household,
		"accounts":  accounts,
		"positions": aggregatePositions(positions),
		"analytics": analytics,
		"asOfDate":  viewAsOf,
	})
}

// GetProposalByID returns a proposal by id.
func (h *PMSQueryHandler) GetProposalByID(c *gin.Context) {
	proposalID := c.Param("id")

	query := `
		SELECT "proposalId", "accountId", "householdId", "asOfDate", "targetId",
		       trades, "currentAnalytics", "predictedAnalytics", assumptions, status,
		       "createdAt", "createdBy", "approvedAt", "approvedBy", "sentToOmsAt"
		FROM proposals
		WHERE "proposalId" = $1
	`

	var (
		accountID          sql.NullString
		householdID        sql.NullString
		targetID           sql.NullString
		tradesRaw          []byte
		currentAnalytics   []byte
		predictedAnalytics []byte
		assumptions        string
		status             string
		asOfDate           time.Time
		createdAt          time.Time
		createdBy          string
		approvedAt         sql.NullTime
		approvedBy         sql.NullString
		sentToOmsAt        sql.NullTime
	)

	var proposalIDVal string
	if err := h.db.QueryRow(query, proposalID).Scan(
		&proposalIDVal,
		&accountID,
		&householdID,
		&asOfDate,
		&targetID,
		&tradesRaw,
		&currentAnalytics,
		&predictedAnalytics,
		&assumptions,
		&status,
		&createdAt,
		&createdBy,
		&approvedAt,
		&approvedBy,
		&sentToOmsAt,
	); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "proposal not found"})
		return
	}

	var trades interface{}
	if tradesRaw != nil {
		_ = json.Unmarshal(tradesRaw, &trades)
	}
	var current interface{}
	if currentAnalytics != nil {
		_ = json.Unmarshal(currentAnalytics, &current)
	}
	var predicted interface{}
	if predictedAnalytics != nil {
		_ = json.Unmarshal(predictedAnalytics, &predicted)
	}

	response := gin.H{
		"proposalId":         proposalIDVal,
		"asOfDate":           asOfDate,
		"trades":             trades,
		"currentAnalytics":   current,
		"predictedAnalytics": predicted,
		"assumptions":        assumptions,
		"status":             status,
		"createdAt":          createdAt,
		"createdBy":          createdBy,
	}

	if accountID.Valid {
		response["accountId"] = accountID.String
	}
	if householdID.Valid {
		response["householdId"] = householdID.String
	}
	if targetID.Valid {
		response["targetId"] = targetID.String
	}
	if approvedAt.Valid {
		response["approvedAt"] = approvedAt.Time
	}
	if approvedBy.Valid {
		response["approvedBy"] = approvedBy.String
	}
	if sentToOmsAt.Valid {
		response["sentToOmsAt"] = sentToOmsAt.Time
	}

	c.JSON(http.StatusOK, response)
}

// GetProposals returns a list of proposals.
func (h *PMSQueryHandler) GetProposals(c *gin.Context) {
	query := `
		SELECT "proposalId", "accountId", "householdId", "asOfDate", "targetId",
		       trades, "currentAnalytics", "predictedAnalytics", assumptions, status,
		       "createdAt", "createdBy", "approvedAt", "approvedBy", "sentToOmsAt"
		FROM proposals
		ORDER BY "createdAt" DESC
	`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	proposals := []map[string]interface{}{}
	for rows.Next() {
		var (
			proposalID         string
			accountID          sql.NullString
			householdID        sql.NullString
			targetID           sql.NullString
			tradesRaw          []byte
			currentAnalytics   []byte
			predictedAnalytics []byte
			assumptions        string
			status             string
			asOfDate           time.Time
			createdAt          time.Time
			createdBy          string
			approvedAt         sql.NullTime
			approvedBy         sql.NullString
			sentToOmsAt        sql.NullTime
		)

		if err := rows.Scan(
			&proposalID,
			&accountID,
			&householdID,
			&asOfDate,
			&targetID,
			&tradesRaw,
			&currentAnalytics,
			&predictedAnalytics,
			&assumptions,
			&status,
			&createdAt,
			&createdBy,
			&approvedAt,
			&approvedBy,
			&sentToOmsAt,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		var trades interface{}
		if tradesRaw != nil {
			_ = json.Unmarshal(tradesRaw, &trades)
		}
		var current interface{}
		if currentAnalytics != nil {
			_ = json.Unmarshal(currentAnalytics, &current)
		}
		var predicted interface{}
		if predictedAnalytics != nil {
			_ = json.Unmarshal(predictedAnalytics, &predicted)
		}

		proposal := map[string]interface{}{
			"proposalId":         proposalID,
			"asOfDate":           asOfDate,
			"trades":             trades,
			"currentAnalytics":   current,
			"predictedAnalytics": predicted,
			"assumptions":        assumptions,
			"status":             status,
			"createdAt":          createdAt,
			"createdBy":          createdBy,
		}
		if accountID.Valid {
			proposal["accountId"] = accountID.String
		}
		if householdID.Valid {
			proposal["householdId"] = householdID.String
		}
		if targetID.Valid {
			proposal["targetId"] = targetID.String
		}
		if approvedAt.Valid {
			proposal["approvedAt"] = approvedAt.Time
		}
		if approvedBy.Valid {
			proposal["approvedBy"] = approvedBy.String
		}
		if sentToOmsAt.Valid {
			proposal["sentToOmsAt"] = sentToOmsAt.Time
		}

		proposals = append(proposals, proposal)
	}

	c.JSON(http.StatusOK, gin.H{
		"proposals": proposals,
		"count":     len(proposals),
	})
}

// GetDriftView returns drift metrics across accounts.
func (h *PMSQueryHandler) GetDriftView(c *gin.Context) {
	accounts, err := h.fetchAllAccounts()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	targets, err := h.fetchLatestAccountTargets()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	drifts := []gin.H{}
	for _, account := range accounts {
		positions, _, err := h.fetchPositionsByAccount(account["accountId"].(string))
		if err != nil {
			continue
		}

		analytics := computeAnalyticsWithBuckets(positions, time.Time{})
		target := targets[account["accountId"].(string)]
		targetDuration := target.durationTarget
		if targetDuration == 0 {
			continue
		}

		durationDrift := analytics.TotalDuration - targetDuration
		overallDrift := 0.0
		if targetDuration != 0 {
			overallDrift = math.Abs(durationDrift / targetDuration)
		}

		drifts = append(drifts, gin.H{
			"accountId":        account["accountId"],
			"asOfDate":         time.Now().UTC(),
			"currentDuration":  analytics.TotalDuration,
			"targetDuration":   targetDuration,
			"durationDrift":    durationDrift,
			"bucketDrifts":     bucketDrift(analytics.BucketWeights, target.bucketWeights),
			"overallDrift":     overallDrift,
			"lastRebalancedAt": target.effectiveFrom,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"drift": drifts,
		"count": len(drifts),
	})
}

type positionRow struct {
	AccountID    string       `json:"accountId"`
	InstrumentID string       `json:"instrumentId"`
	Cusip        string       `json:"cusip"`
	Description  string       `json:"description"`
	Quantity     float64      `json:"quantity"`
	AvgCost      float64      `json:"avgCost"`
	MarketValue  float64      `json:"marketValue"`
	Duration     float64      `json:"duration"`
	Dv01         float64      `json:"dv01"`
	MaturityDate sql.NullTime `json:"maturityDate"`
	UpdatedAt    time.Time    `json:"updatedAt"`
}

type targetRow struct {
	durationTarget float64
	bucketWeights  map[string]float64
	effectiveFrom  time.Time
}

func (h *PMSQueryHandler) fetchAccount(accountID string) (map[string]interface{}, error) {
	query := `
		SELECT "accountId", "householdId", name, "accountType", "modelId", "createdAt", "createdBy"
		FROM accounts
		WHERE "accountId" = $1
	`

	var (
		householdID string
		name        string
		accountType string
		modelID     sql.NullString
		createdAt   time.Time
		createdBy   string
	)

	if err := h.db.QueryRow(query, accountID).Scan(
		&accountID,
		&householdID,
		&name,
		&accountType,
		&modelID,
		&createdAt,
		&createdBy,
	); err != nil {
		return nil, fmt.Errorf("account not found")
	}

	account := map[string]interface{}{
		"accountId":   accountID,
		"householdId": householdID,
		"name":        name,
		"accountType": accountType,
		"createdAt":   createdAt,
		"createdBy":   createdBy,
	}
	if modelID.Valid {
		account["modelId"] = modelID.String
	}

	return account, nil
}

func (h *PMSQueryHandler) fetchHousehold(householdID string) (map[string]interface{}, error) {
	query := `
		SELECT "householdId", name, "createdAt", "createdBy"
		FROM households
		WHERE "householdId" = $1
	`

	var (
		name      string
		createdAt time.Time
		createdBy string
	)

	if err := h.db.QueryRow(query, householdID).Scan(
		&householdID,
		&name,
		&createdAt,
		&createdBy,
	); err != nil {
		return nil, fmt.Errorf("household not found")
	}

	return map[string]interface{}{
		"householdId": householdID,
		"name":        name,
		"createdAt":   createdAt,
		"createdBy":   createdBy,
	}, nil
}

func (h *PMSQueryHandler) fetchAccountsByHousehold(householdID string) ([]map[string]interface{}, error) {
	query := `
		SELECT a."accountId", a."householdId", a.name, a."accountType", a."createdAt", a."createdBy",
		       COALESCE(SUM(p."marketValue"), 0) AS "marketValue",
		       COUNT(p."instrumentId") AS "positionCount"
		FROM accounts a
		LEFT JOIN positions p ON p."accountId" = a."accountId"
		WHERE a."householdId" = $1
		GROUP BY a."accountId", a."householdId", a.name, a."accountType", a."createdAt", a."createdBy"
	`

	rows, err := h.db.Query(query, householdID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	accounts := []map[string]interface{}{}
	for rows.Next() {
		var (
			accountID     string
			householdID   string
			name          string
			accountType   string
			createdAt     time.Time
			createdBy     string
			marketValue   float64
			positionCount int
		)
		if err := rows.Scan(
			&accountID,
			&householdID,
			&name,
			&accountType,
			&createdAt,
			&createdBy,
			&marketValue,
			&positionCount,
		); err != nil {
			return nil, err
		}
		accounts = append(accounts, map[string]interface{}{
			"accountId":     accountID,
			"householdId":   householdID,
			"name":          name,
			"accountType":   accountType,
			"createdAt":     createdAt,
			"createdBy":     createdBy,
			"marketValue":   marketValue,
			"positionCount": positionCount,
		})
	}

	return accounts, nil
}

func (h *PMSQueryHandler) fetchAllAccounts() ([]map[string]interface{}, error) {
	query := `
		SELECT "accountId", "householdId", name, "accountType"
		FROM accounts
	`

	rows, err := h.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	accounts := []map[string]interface{}{}
	for rows.Next() {
		var (
			accountID   string
			householdID string
			name        string
			accountType string
		)
		if err := rows.Scan(&accountID, &householdID, &name, &accountType); err != nil {
			return nil, err
		}
		accounts = append(accounts, map[string]interface{}{
			"accountId":   accountID,
			"householdId": householdID,
			"name":        name,
			"accountType": accountType,
		})
	}

	return accounts, nil
}

func (h *PMSQueryHandler) fetchPositionsByAccount(accountID string) ([]positionRow, time.Time, error) {
	query := `
		SELECT p."accountId", p."instrumentId", p.quantity, p."avgCost", p."marketValue", p.duration, p.dv01,
		       i.name, i.cusip, i."maturityDate", p."updatedAt"
		FROM positions p
		LEFT JOIN instruments i ON p."instrumentId" = i.cusip
		WHERE p."accountId" = $1
	`

	rows, err := h.db.Query(query, accountID)
	if err != nil {
		return nil, time.Time{}, err
	}
	defer rows.Close()

	return scanPositions(rows)
}

func (h *PMSQueryHandler) positionsFromExecutions(accountID string) ([]positionRow, time.Time, error) {
	query := `
		SELECT e."instrumentId",
		       SUM(CASE WHEN e.side = 'SELL' THEN -e."filledQuantity" ELSE e."filledQuantity" END) AS "netQuantity",
		       SUM(e."filledQuantity" * COALESCE(e."avgFillPrice", 0)) AS "weightedCost",
		       SUM(e."filledQuantity") AS "totalQty",
		       i.name, i.cusip, i."maturityDate",
		       COALESCE(i."askPrice", 0) AS "askPrice",
		       COALESCE(i."askModifiedDuration", 0) AS "duration"
		FROM executions e
		LEFT JOIN instruments i ON e."instrumentId" = i.cusip
		WHERE e."accountId" = $1
		GROUP BY e."instrumentId", i.name, i.cusip, i."maturityDate", i."askPrice", i."askModifiedDuration"
	`

	rows, err := h.db.Query(query, accountID)
	if err != nil {
		return nil, time.Time{}, err
	}
	defer rows.Close()

	rebuilt := []positionRow{}
	latestUpdate := time.Now().UTC()

	for rows.Next() {
		var (
			instrumentID string
			netQuantity  float64
			weightedCost float64
			totalQty     float64
			description  sql.NullString
			cusip        sql.NullString
			maturityDate sql.NullTime
			askPrice     float64
			duration     float64
		)

		if err := rows.Scan(
			&instrumentID,
			&netQuantity,
			&weightedCost,
			&totalQty,
			&description,
			&cusip,
			&maturityDate,
			&askPrice,
			&duration,
		); err != nil {
			return nil, time.Time{}, err
		}

		if math.Abs(netQuantity) < 0.000001 {
			continue
		}

		avgCost := 0.0
		if totalQty != 0 {
			avgCost = weightedCost / totalQty
		}

		price := askPrice
		if price <= 0 {
			price = avgCost
		}
		if price <= 0 {
			price = 100
		}

		marketValue := netQuantity * price
		dv01 := marketValue * duration * 0.0001

		rebuilt = append(rebuilt, positionRow{
			AccountID:    accountID,
			InstrumentID: instrumentID,
			Cusip:        cusip.String,
			Description:  description.String,
			Quantity:     netQuantity,
			AvgCost:      avgCost,
			MarketValue:  marketValue,
			Duration:     duration,
			Dv01:         dv01,
			MaturityDate: maturityDate,
			UpdatedAt:    latestUpdate,
		})
	}

	return rebuilt, latestUpdate, nil
}

func (h *PMSQueryHandler) fetchPositionsByHousehold(householdID string) ([]positionRow, time.Time, error) {
	query := `
		SELECT p."accountId", p."instrumentId", p.quantity, p."avgCost", p."marketValue", p.duration, p.dv01,
		       i.name, i.cusip, i."maturityDate", p."updatedAt"
		FROM positions p
		LEFT JOIN instruments i ON p."instrumentId" = i.cusip
		WHERE p."accountId" IN (SELECT "accountId" FROM accounts WHERE "householdId" = $1)
	`

	rows, err := h.db.Query(query, householdID)
	if err != nil {
		return nil, time.Time{}, err
	}
	defer rows.Close()

	return scanPositions(rows)
}

func scanPositions(rows *sql.Rows) ([]positionRow, time.Time, error) {
	positions := []positionRow{}
	latestUpdate := time.Time{}

	for rows.Next() {
		var row positionRow
		if err := rows.Scan(
			&row.AccountID,
			&row.InstrumentID,
			&row.Quantity,
			&row.AvgCost,
			&row.MarketValue,
			&row.Duration,
			&row.Dv01,
			&row.Description,
			&row.Cusip,
			&row.MaturityDate,
			&row.UpdatedAt,
		); err != nil {
			return nil, time.Time{}, err
		}
		if row.UpdatedAt.After(latestUpdate) {
			latestUpdate = row.UpdatedAt
		}
		positions = append(positions, row)
	}

	return positions, latestUpdate, nil
}

func aggregatePositions(positions []positionRow) []positionRow {
	aggregated := map[string]positionRow{}
	for _, pos := range positions {
		key := pos.Cusip
		entry, ok := aggregated[key]
		if !ok {
			aggregated[key] = pos
			continue
		}

		totalQty := entry.Quantity + pos.Quantity
		totalValue := entry.MarketValue + pos.MarketValue
		avgCost := entry.AvgCost
		if totalQty != 0 {
			avgCost = (entry.AvgCost*entry.Quantity + pos.AvgCost*pos.Quantity) / totalQty
		}
		entry.Quantity = totalQty
		entry.MarketValue = totalValue
		entry.Dv01 += pos.Dv01
		entry.AvgCost = avgCost
		aggregated[key] = entry
	}

	results := []positionRow{}
	for _, pos := range aggregated {
		results = append(results, pos)
	}

	return results
}

type analyticsWithBuckets struct {
	TotalMarketValue float64            `json:"totalMarketValue"`
	TotalDuration    float64            `json:"totalDuration"`
	TotalDv01        float64            `json:"totalDv01"`
	CashBalance      float64            `json:"cashBalance"`
	CashPercentage   float64            `json:"cashPercentage"`
	BucketWeights    map[string]float64 `json:"bucketWeights"`
}

func computeAnalyticsWithBuckets(positions []positionRow, asOfDate time.Time) analyticsWithBuckets {
	buckets := map[string]float64{
		"0-2y":   0,
		"2-5y":   0,
		"5-10y":  0,
		"10-20y": 0,
		"20y+":   0,
	}

	totalMarketValue := 0.0
	for _, pos := range positions {
		totalMarketValue += pos.MarketValue
	}

	totalDuration := 0.0
	totalDv01 := 0.0

	for _, pos := range positions {
		if totalMarketValue > 0 {
			totalDuration += (pos.Duration * pos.MarketValue) / totalMarketValue
		}
		totalDv01 += pos.Dv01

		if pos.MaturityDate.Valid {
			bucket := maturityBucket(pos.MaturityDate.Time, asOfDate)
			buckets[bucket] += pos.MarketValue
		}
	}

	if totalMarketValue > 0 {
		for bucket, value := range buckets {
			buckets[bucket] = math.Round((value/totalMarketValue)*100*100) / 100
		}
	}

	return analyticsWithBuckets{
		TotalMarketValue: totalMarketValue,
		TotalDuration:    totalDuration,
		TotalDv01:        totalDv01,
		CashBalance:      0,
		CashPercentage:   0,
		BucketWeights:    buckets,
	}
}

func maturityBucket(maturity time.Time, asOfDate time.Time) string {
	ref := time.Now().UTC()
	if !asOfDate.IsZero() {
		ref = asOfDate
	}
	years := maturity.Sub(ref).Hours() / (24 * 365.25)
	switch {
	case years <= 2:
		return "0-2y"
	case years <= 5:
		return "2-5y"
	case years <= 10:
		return "5-10y"
	case years <= 20:
		return "10-20y"
	default:
		return "20y+"
	}
}

func parseDateQuery(value string) time.Time {
	if value == "" {
		return time.Time{}
	}
	parsed, err := time.Parse(time.RFC3339, value)
	if err != nil {
		return time.Time{}
	}
	return parsed
}

func (h *PMSQueryHandler) fetchLatestAccountTargets() (map[string]targetRow, error) {
	query := `
		SELECT "scopeId", "durationTarget", "bucketWeights", "effectiveFrom"
		FROM portfolio_targets
		WHERE scope = 'account'
		ORDER BY "scopeId", "effectiveFrom" DESC
	`

	rows, err := h.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	targets := map[string]targetRow{}
	for rows.Next() {
		var (
			scopeID       string
			duration      float64
			bucketWeights []byte
			effectiveFrom time.Time
		)
		if err := rows.Scan(&scopeID, &duration, &bucketWeights, &effectiveFrom); err != nil {
			return nil, err
		}

		if _, exists := targets[scopeID]; exists {
			continue
		}

		weights := map[string]float64{}
		if bucketWeights != nil {
			_ = json.Unmarshal(bucketWeights, &weights)
		}

		targets[scopeID] = targetRow{
			durationTarget: duration,
			bucketWeights:  weights,
			effectiveFrom:  effectiveFrom,
		}
	}

	return targets, nil
}

func bucketDrift(current, target map[string]float64) map[string]float64 {
	drift := map[string]float64{}
	for bucket, currentWeight := range current {
		drift[bucket] = currentWeight - target[bucket]
	}
	return drift
}
