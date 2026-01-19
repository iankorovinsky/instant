package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"instant/services/api/eventstore"
	"instant/services/api/oms"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

// OMSQueryHandler handles OMS query operations
type OMSQueryHandler struct {
	db         *sql.DB
	eventStore *eventstore.EventStore
}

// NewOMSQueryHandler creates a new OMS query handler
func NewOMSQueryHandler(databaseURL string, es *eventstore.EventStore) (*OMSQueryHandler, error) {
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &OMSQueryHandler{
		db:         db,
		eventStore: es,
	}, nil
}

// Close closes the database connection
func (h *OMSQueryHandler) Close() error {
	return h.db.Close()
}

// GetBlotter returns a list of orders (blotter view)
func (h *OMSQueryHandler) GetBlotter(c *gin.Context) {
	// Query parameters for filtering
	accountID := c.Query("accountId")
	householdID := c.Query("householdId")
	state := c.Query("state")
	fromDate := c.Query("fromDate")
	toDate := c.Query("toDate")
	limit := c.DefaultQuery("limit", "100")
	offset := c.DefaultQuery("offset", "0")

	// Build query
	query := `
		SELECT
			o."orderId", o."accountId", o."instrumentId", o.side, o.quantity,
			o."orderType", o."limitPrice", o."curveSpreadBp", o."timeInForce",
			o.state, o."batchId", o."complianceResult",
			o."createdAt", o."createdBy", o."updatedAt", o."lastStateChangeAt",
			o."sentToEmsAt", o."fullyFilledAt", o."settledAt",
			i.name as "instrumentName", i.cusip, i.type as "instrumentType",
			a.name as "accountName", a."householdId"
		FROM orders o
		LEFT JOIN instruments i ON o."instrumentId" = i.cusip
		LEFT JOIN accounts a ON o."accountId" = a."accountId"
		WHERE 1=1
	`

	args := []interface{}{}
	argPos := 1

	if accountID != "" {
		query += fmt.Sprintf(` AND o."accountId" = $%d`, argPos)
		args = append(args, accountID)
		argPos++
	}

	if householdID != "" {
		query += fmt.Sprintf(` AND a."householdId" = $%d`, argPos)
		args = append(args, householdID)
		argPos++
	}

	if state != "" {
		query += fmt.Sprintf(` AND o.state = $%d`, argPos)
		args = append(args, state)
		argPos++
	}

	if fromDate != "" {
		query += fmt.Sprintf(` AND o."createdAt" >= $%d`, argPos)
		args = append(args, fromDate)
		argPos++
	}

	if toDate != "" {
		query += fmt.Sprintf(` AND o."createdAt" <= $%d`, argPos)
		args = append(args, toDate)
		argPos++
	}

	query += ` ORDER BY o."createdAt" DESC`
	query += fmt.Sprintf(` LIMIT $%d OFFSET $%d`, argPos, argPos+1)
	args = append(args, limit, offset)

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	orders := []map[string]interface{}{}

	for rows.Next() {
		var (
			orderID          string
			accountID        string
			instrumentID     string
			side             string
			quantity         float64
			orderType        string
			limitPrice       sql.NullFloat64
			curveSpreadBp    sql.NullFloat64
			timeInForce      string
			state            string
			batchID          sql.NullString
			complianceResult []byte
			createdAt        time.Time
			createdBy        string
			updatedAt        time.Time
			lastStateChangeAt time.Time
			sentToEmsAt      sql.NullTime
			fullyFilledAt    sql.NullTime
			settledAt        sql.NullTime
			instrumentName   string
			cusip            string
			instrumentType   string
			accountName      string
			householdIDVal   string
		)

		err := rows.Scan(
			&orderID, &accountID, &instrumentID, &side, &quantity,
			&orderType, &limitPrice, &curveSpreadBp, &timeInForce,
			&state, &batchID, &complianceResult,
			&createdAt, &createdBy, &updatedAt, &lastStateChangeAt,
			&sentToEmsAt, &fullyFilledAt, &settledAt,
			&instrumentName, &cusip, &instrumentType,
			&accountName, &householdIDVal,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		order := map[string]interface{}{
			"orderId":          orderID,
			"accountId":        accountID,
			"accountName":      accountName,
			"householdId":      householdIDVal,
			"instrumentId":     instrumentID,
			"instrumentName":   instrumentName,
			"cusip":            cusip,
			"instrumentType":   instrumentType,
			"side":             side,
			"quantity":         quantity,
			"orderType":        orderType,
			"timeInForce":      timeInForce,
			"state":            state,
			"createdAt":        createdAt,
			"createdBy":        createdBy,
			"updatedAt":        updatedAt,
			"lastStateChangeAt": lastStateChangeAt,
		}

		if limitPrice.Valid {
			order["limitPrice"] = limitPrice.Float64
		}
		if curveSpreadBp.Valid {
			order["curveSpreadBp"] = curveSpreadBp.Float64
		}
		if batchID.Valid {
			order["batchId"] = batchID.String
		}
		if sentToEmsAt.Valid {
			order["sentToEmsAt"] = sentToEmsAt.Time
		}
		if fullyFilledAt.Valid {
			order["fullyFilledAt"] = fullyFilledAt.Time
		}
		if settledAt.Valid {
			order["settledAt"] = settledAt.Time
		}
		if complianceResult != nil {
			var cr interface{}
			if err := json.Unmarshal(complianceResult, &cr); err == nil {
				order["complianceResult"] = cr
			}
		}

		orders = append(orders, order)
	}

	c.JSON(http.StatusOK, gin.H{
		"orders": orders,
		"count":  len(orders),
	})
}

// GetOrderByID returns a single order with full details including event timeline
func (h *OMSQueryHandler) GetOrderByID(c *gin.Context) {
	orderID := c.Param("id")

	// Query order details
	query := `
		SELECT
			o."orderId", o."accountId", o."instrumentId", o.side, o.quantity,
			o."orderType", o."limitPrice", o."curveSpreadBp", o."timeInForce",
			o.state, o."batchId", o."complianceResult",
			o."createdAt", o."createdBy", o."updatedAt", o."lastStateChangeAt",
			o."sentToEmsAt", o."fullyFilledAt", o."settledAt",
			i.name as "instrumentName", i.cusip, i.type as "instrumentType",
			a.name as "accountName", a."householdId"
		FROM orders o
		LEFT JOIN instruments i ON o."instrumentId" = i.cusip
		LEFT JOIN accounts a ON o."accountId" = a."accountId"
		WHERE o."orderId" = $1
	`

	var (
		orderIDVal       string
		accountID        string
		instrumentID     string
		side             string
		quantity         float64
		orderType        string
		limitPrice       sql.NullFloat64
		curveSpreadBp    sql.NullFloat64
		timeInForce      string
		state            string
		batchID          sql.NullString
		complianceResult []byte
		createdAt        time.Time
		createdBy        string
		updatedAt        time.Time
		lastStateChangeAt time.Time
		sentToEmsAt      sql.NullTime
		fullyFilledAt    sql.NullTime
		settledAt        sql.NullTime
		instrumentName   string
		cusip            string
		instrumentType   string
		accountName      string
		householdIDVal   string
	)

	err := h.db.QueryRow(query, orderID).Scan(
		&orderIDVal, &accountID, &instrumentID, &side, &quantity,
		&orderType, &limitPrice, &curveSpreadBp, &timeInForce,
		&state, &batchID, &complianceResult,
		&createdAt, &createdBy, &updatedAt, &lastStateChangeAt,
		&sentToEmsAt, &fullyFilledAt, &settledAt,
		&instrumentName, &cusip, &instrumentType,
		&accountName, &householdIDVal,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	order := map[string]interface{}{
		"orderId":          orderIDVal,
		"accountId":        accountID,
		"accountName":      accountName,
		"householdId":      householdIDVal,
		"instrumentId":     instrumentID,
		"instrumentName":   instrumentName,
		"cusip":            cusip,
		"instrumentType":   instrumentType,
		"side":             side,
		"quantity":         quantity,
		"orderType":        orderType,
		"timeInForce":      timeInForce,
		"state":            state,
		"createdAt":        createdAt,
		"createdBy":        createdBy,
		"updatedAt":        updatedAt,
		"lastStateChangeAt": lastStateChangeAt,
	}

	if limitPrice.Valid {
		order["limitPrice"] = limitPrice.Float64
	}
	if curveSpreadBp.Valid {
		order["curveSpreadBp"] = curveSpreadBp.Float64
	}
	if batchID.Valid {
		order["batchId"] = batchID.String
	}
	if sentToEmsAt.Valid {
		order["sentToEmsAt"] = sentToEmsAt.Time
	}
	if fullyFilledAt.Valid {
		order["fullyFilledAt"] = fullyFilledAt.Time
	}
	if settledAt.Valid {
		order["settledAt"] = settledAt.Time
	}
	if complianceResult != nil {
		var cr interface{}
		if err := json.Unmarshal(complianceResult, &cr); err == nil {
			order["complianceResult"] = cr
		}
	}

	// Get event timeline for this order
	events, err := h.eventStore.GetByAggregate("Order", orderID)
	if err != nil {
		fmt.Printf("Failed to get events for order: %v\n", err)
	} else {
		order["events"] = events
	}

	c.JSON(http.StatusOK, order)
}

// GetOrdersByBatchID returns all orders in a batch
func (h *OMSQueryHandler) GetOrdersByBatchID(c *gin.Context) {
	batchID := c.Param("batchId")

	query := `
		SELECT
			o."orderId", o."accountId", o."instrumentId", o.side, o.quantity,
			o."orderType", o."limitPrice", o."curveSpreadBp", o."timeInForce",
			o.state, o."batchId", o."complianceResult",
			o."createdAt", o."createdBy", o."updatedAt", o."lastStateChangeAt",
			o."sentToEmsAt", o."fullyFilledAt", o."settledAt"
		FROM orders o
		WHERE o."batchId" = $1
		ORDER BY o."createdAt" ASC
	`

	rows, err := h.db.Query(query, batchID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	orders := []oms.Order{}

	for rows.Next() {
		var order oms.Order
		var limitPrice sql.NullFloat64
		var curveSpreadBp sql.NullFloat64
		var batchIDVal sql.NullString
		var complianceResult []byte
		var sentToEmsAt sql.NullTime
		var fullyFilledAt sql.NullTime
		var settledAt sql.NullTime

		err := rows.Scan(
			&order.OrderID, &order.AccountID, &order.InstrumentID, &order.Side, &order.Quantity,
			&order.OrderType, &limitPrice, &curveSpreadBp, &order.TimeInForce,
			&order.State, &batchIDVal, &complianceResult,
			&order.CreatedAt, &order.CreatedBy, &order.UpdatedAt, &order.LastStateChangeAt,
			&sentToEmsAt, &fullyFilledAt, &settledAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if limitPrice.Valid {
			val := limitPrice.Float64
			order.LimitPrice = &val
		}
		if curveSpreadBp.Valid {
			val := curveSpreadBp.Float64
			order.CurveSpreadBp = &val
		}
		if batchIDVal.Valid {
			order.BatchID = &batchIDVal.String
		}
		if sentToEmsAt.Valid {
			order.SentToEmsAt = &sentToEmsAt.Time
		}
		if fullyFilledAt.Valid {
			order.FullyFilledAt = &fullyFilledAt.Time
		}
		if settledAt.Valid {
			order.SettledAt = &settledAt.Time
		}
		if complianceResult != nil {
			var cr oms.ComplianceResult
			if err := json.Unmarshal(complianceResult, &cr); err == nil {
				order.ComplianceResult = &cr
			}
		}

		orders = append(orders, order)
	}

	c.JSON(http.StatusOK, gin.H{
		"batchId": batchID,
		"orders":  orders,
		"count":   len(orders),
	})
}
