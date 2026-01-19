package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

// EMSQueryHandler handles EMS query operations.
type EMSQueryHandler struct {
	db *sql.DB
}

// NewEMSQueryHandler creates a new EMS query handler.
func NewEMSQueryHandler(databaseURL string) (*EMSQueryHandler, error) {
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &EMSQueryHandler{db: db}, nil
}

// Close closes the database connection.
func (h *EMSQueryHandler) Close() error {
	return h.db.Close()
}

// GetExecutions returns a list of executions with optional filters.
func (h *EMSQueryHandler) GetExecutions(c *gin.Context) {
	orderID := c.Query("orderId")
	status := c.Query("status")
	fromDate := c.Query("fromDate")
	toDate := c.Query("toDate")
	limit := c.DefaultQuery("limit", "100")
	offset := c.DefaultQuery("offset", "0")

	query := `
		SELECT
			e."executionId", e."orderId", e."accountId", e."instrumentId", e.side,
			e."totalQuantity", e."filledQuantity", e."avgFillPrice", e.status,
			e."asOfDate", e."executionStartTime", e."executionEndTime",
			e."settlementDate", e."settledDate",
			e."slippageTotal", e."slippageBreakdown", e."deterministicInputs",
			e.explanation, e."createdAt", e."updatedAt",
			i.name as "instrumentName", i.cusip, a.name as "accountName"
		FROM executions e
		LEFT JOIN instruments i ON e."instrumentId" = i.cusip
		LEFT JOIN accounts a ON e."accountId" = a."accountId"
		WHERE 1=1
	`

	args := []interface{}{}
	argPos := 1

	if orderID != "" {
		query += fmt.Sprintf(` AND e."orderId" = $%d`, argPos)
		args = append(args, orderID)
		argPos++
	}

	if status != "" {
		query += fmt.Sprintf(` AND e.status = $%d`, argPos)
		args = append(args, status)
		argPos++
	}

	if fromDate != "" {
		query += fmt.Sprintf(` AND e."asOfDate" >= $%d`, argPos)
		args = append(args, fromDate)
		argPos++
	}

	if toDate != "" {
		query += fmt.Sprintf(` AND e."asOfDate" <= $%d`, argPos)
		args = append(args, toDate)
		argPos++
	}

	query += ` ORDER BY e."asOfDate" DESC`
	query += fmt.Sprintf(` LIMIT $%d OFFSET $%d`, argPos, argPos+1)
	args = append(args, limit, offset)

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	executions := []map[string]interface{}{}

	for rows.Next() {
		var (
			executionID       string
			orderIDVal        string
			accountID         string
			instrumentID      string
			side              string
			totalQuantity     float64
			filledQuantity    float64
			avgFillPrice      sql.NullFloat64
			statusVal         string
			asOfDate          time.Time
			executionStart    sql.NullTime
			executionEnd      sql.NullTime
			settlementDate    sql.NullTime
			settledDate       sql.NullTime
			slippageTotal     sql.NullFloat64
			slippageBreakdown []byte
			deterministic     []byte
			explanation       sql.NullString
			createdAt         time.Time
			updatedAt         time.Time
			instrumentName    sql.NullString
			cusip             sql.NullString
			accountName       sql.NullString
		)

		if err := rows.Scan(
			&executionID, &orderIDVal, &accountID, &instrumentID, &side,
			&totalQuantity, &filledQuantity, &avgFillPrice, &statusVal,
			&asOfDate, &executionStart, &executionEnd,
			&settlementDate, &settledDate,
			&slippageTotal, &slippageBreakdown, &deterministic,
			&explanation, &createdAt, &updatedAt,
			&instrumentName, &cusip, &accountName,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		execution := map[string]interface{}{
			"executionId":    executionID,
			"orderId":        orderIDVal,
			"accountId":      accountID,
			"instrumentId":   instrumentID,
			"side":           side,
			"totalQuantity":  totalQuantity,
			"filledQuantity": filledQuantity,
			"status":         statusVal,
			"asOfDate":       asOfDate,
			"createdAt":      createdAt,
			"updatedAt":      updatedAt,
		}

		if avgFillPrice.Valid {
			execution["avgFillPrice"] = avgFillPrice.Float64
		}
		if executionStart.Valid {
			execution["executionStartTime"] = executionStart.Time
		}
		if executionEnd.Valid {
			execution["executionEndTime"] = executionEnd.Time
		}
		if settlementDate.Valid {
			execution["settlementDate"] = settlementDate.Time
		}
		if settledDate.Valid {
			execution["settledDate"] = settledDate.Time
		}
		if slippageTotal.Valid {
			execution["slippageTotal"] = slippageTotal.Float64
		}
		if slippageBreakdown != nil {
			var breakdown interface{}
			if err := json.Unmarshal(slippageBreakdown, &breakdown); err == nil {
				execution["slippageBreakdown"] = breakdown
			}
		}
		if deterministic != nil {
			var inputs interface{}
			if err := json.Unmarshal(deterministic, &inputs); err == nil {
				execution["deterministicInputs"] = inputs
			}
		}
		if explanation.Valid {
			execution["explanation"] = explanation.String
		}
		if instrumentName.Valid {
			execution["instrumentName"] = instrumentName.String
		}
		if cusip.Valid {
			execution["cusip"] = cusip.String
		}
		if accountName.Valid {
			execution["accountName"] = accountName.String
		}

		executions = append(executions, execution)
	}

	c.JSON(http.StatusOK, gin.H{
		"executions": executions,
		"count":      len(executions),
	})
}

// GetExecutionByID returns execution detail with fills.
func (h *EMSQueryHandler) GetExecutionByID(c *gin.Context) {
	executionID := c.Param("id")
	if executionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "executionId is required"})
		return
	}

	query := `
		SELECT
			"executionId", "orderId", "accountId", "instrumentId", side,
			"totalQuantity", "filledQuantity", "avgFillPrice", status,
			"asOfDate", "executionStartTime", "executionEndTime",
			"settlementDate", "settledDate",
			"slippageTotal", "slippageBreakdown", "deterministicInputs",
			explanation, "createdAt", "updatedAt"
		FROM executions
		WHERE "executionId" = $1
	`

	var (
		orderIDVal        string
		accountID         string
		instrumentID      string
		side              string
		totalQuantity     float64
		filledQuantity    float64
		avgFillPrice      sql.NullFloat64
		statusVal         string
		asOfDate          time.Time
		executionStart    sql.NullTime
		executionEnd      sql.NullTime
		settlementDate    sql.NullTime
		settledDate       sql.NullTime
		slippageTotal     sql.NullFloat64
		slippageBreakdown []byte
		deterministic     []byte
		explanation       sql.NullString
		createdAt         time.Time
		updatedAt         time.Time
	)

	err := h.db.QueryRow(query, executionID).Scan(
		&executionID, &orderIDVal, &accountID, &instrumentID, &side,
		&totalQuantity, &filledQuantity, &avgFillPrice, &statusVal,
		&asOfDate, &executionStart, &executionEnd,
		&settlementDate, &settledDate,
		&slippageTotal, &slippageBreakdown, &deterministic,
		&explanation, &createdAt, &updatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "execution not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	execution := map[string]interface{}{
		"executionId":    executionID,
		"orderId":        orderIDVal,
		"accountId":      accountID,
		"instrumentId":   instrumentID,
		"side":           side,
		"totalQuantity":  totalQuantity,
		"filledQuantity": filledQuantity,
		"status":         statusVal,
		"asOfDate":       asOfDate,
		"createdAt":      createdAt,
		"updatedAt":      updatedAt,
	}

	if avgFillPrice.Valid {
		execution["avgFillPrice"] = avgFillPrice.Float64
	}
	if executionStart.Valid {
		execution["executionStartTime"] = executionStart.Time
	}
	if executionEnd.Valid {
		execution["executionEndTime"] = executionEnd.Time
	}
	if settlementDate.Valid {
		execution["settlementDate"] = settlementDate.Time
	}
	if settledDate.Valid {
		execution["settledDate"] = settledDate.Time
	}
	if slippageTotal.Valid {
		execution["slippageTotal"] = slippageTotal.Float64
	}
	if slippageBreakdown != nil {
		var breakdown interface{}
		if err := json.Unmarshal(slippageBreakdown, &breakdown); err == nil {
			execution["slippageBreakdown"] = breakdown
		}
	}
	if deterministic != nil {
		var inputs interface{}
		if err := json.Unmarshal(deterministic, &inputs); err == nil {
			execution["deterministicInputs"] = inputs
		}
	}
	if explanation.Valid {
		execution["explanation"] = explanation.String
	}

	fillsQuery := `
		SELECT "fillId", "clipIndex", quantity, price, timestamp, slippage
		FROM fills
		WHERE "executionId" = $1
		ORDER BY "clipIndex" ASC
	`

	fillRows, err := h.db.Query(fillsQuery, executionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer fillRows.Close()

	fills := []map[string]interface{}{}
	for fillRows.Next() {
		var (
			fillID    string
			clipIndex int
			quantity  float64
			price     float64
			timestamp time.Time
			slippage  float64
		)

		if err := fillRows.Scan(&fillID, &clipIndex, &quantity, &price, &timestamp, &slippage); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		fills = append(fills, map[string]interface{}{
			"fillId":    fillID,
			"clipIndex": clipIndex,
			"quantity":  quantity,
			"price":     price,
			"timestamp": timestamp,
			"slippage":  slippage,
		})
	}

	execution["fills"] = fills

	c.JSON(http.StatusOK, execution)
}
