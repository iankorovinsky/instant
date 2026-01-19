package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"instant/services/api/services/pricing"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
)

type MarketDataQueryHandler struct {
	db      *sql.DB
	pricing *pricing.Service
}

func NewMarketDataQueryHandler(db *sql.DB) (*MarketDataQueryHandler, error) {
	return &MarketDataQueryHandler{
		db:      db,
		pricing: pricing.NewService(),
	}, nil
}

func (h *MarketDataQueryHandler) GetCurveDates(c *gin.Context) {
	rows, err := h.db.Query(`SELECT DISTINCT "asOfDate" FROM yield_curves ORDER BY "asOfDate" DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var dates []time.Time
	for rows.Next() {
		var date time.Time
		if err := rows.Scan(&date); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		dates = append(dates, date)
	}

	c.JSON(http.StatusOK, gin.H{"dates": dates})
}

func (h *MarketDataQueryHandler) GetYieldCurve(c *gin.Context) {
	asOfDate, err := h.resolveAsOfDate(c.Query("asOfDate"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	curve, err := h.fetchCurve(asOfDate)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"asOfDate":    curve.AsOfDate,
		"curvePoints": mapCurvePoints(curve.Points),
		"source": gin.H{
			"sourceUrl":  curve.SourceURL,
			"sourceHash": curve.SourceHash,
			"ingestedAt": curve.IngestedAt,
			"ingestedBy": curve.IngestedBy,
		},
	})
}

func (h *MarketDataQueryHandler) GetInstruments(c *gin.Context) {
	asOfDate, err := h.resolveAsOfDate(c.Query("asOfDate"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	curve, err := h.fetchCurve(asOfDate)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	instruments, err := h.fetchInstruments(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	filterBuckets := parseList(c.Query("buckets"))

	response := make([]map[string]interface{}, 0, len(instruments))
	for _, instrument := range instruments {
		maturityBucket := getMaturityBucket(instrument.MaturityDate, asOfDate)
		if len(filterBuckets) > 0 && !contains(filterBuckets, maturityBucket) {
			continue
		}

		evaluated, evalErr := h.pricing.Evaluate(instrument.pricingInput(), curve, asOfDate)
		var evaluatedMap map[string]interface{}
		if evalErr == nil {
			evaluatedMap = mapEvaluatedPrice(evaluated)
		}

		response = append(response, instrument.response(maturityBucket, evaluatedMap))
	}

	c.JSON(http.StatusOK, gin.H{
		"asOfDate":    asOfDate,
		"instruments": response,
		"count":       len(response),
	})
}

func (h *MarketDataQueryHandler) GetInstrumentByCusip(c *gin.Context) {
	cusip := c.Param("cusip")
	asOfDate, err := h.resolveAsOfDate(c.Query("asOfDate"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	instrument, err := h.fetchInstrument(cusip)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	curve, curveErr := h.fetchCurve(asOfDate)
	var evaluatedMap map[string]interface{}
	if curveErr == nil {
		evaluated, evalErr := h.pricing.Evaluate(instrument.pricingInput(), curve, asOfDate)
		if evalErr == nil {
			evaluatedMap = mapEvaluatedPrice(evaluated)
		}
	}

	maturityBucket := getMaturityBucket(instrument.MaturityDate, asOfDate)
	c.JSON(http.StatusOK, gin.H{
		"instrument": instrument.response(maturityBucket, evaluatedMap),
	})
}

func (h *MarketDataQueryHandler) GetMarketGrid(c *gin.Context) {
	asOfDate, err := h.resolveAsOfDate(c.Query("asOfDate"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	curve, err := h.fetchCurve(asOfDate)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	instruments, err := h.fetchInstruments(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := make([]map[string]interface{}, 0, len(instruments))
	for _, instrument := range instruments {
		maturityBucket := getMaturityBucket(instrument.MaturityDate, asOfDate)
		evaluated, evalErr := h.pricing.Evaluate(instrument.pricingInput(), curve, asOfDate)
		if evalErr != nil {
			continue
		}
		response = append(response, instrument.response(maturityBucket, mapEvaluatedPrice(evaluated)))
	}

	c.JSON(http.StatusOK, gin.H{
		"asOfDate": asOfDate,
		"curveSource": gin.H{
			"sourceUrl":  curve.SourceURL,
			"sourceHash": curve.SourceHash,
			"ingestedAt": curve.IngestedAt,
			"ingestedBy": curve.IngestedBy,
		},
		"instruments": response,
		"count":       len(response),
	})
}

func (h *MarketDataQueryHandler) GetEvaluatedPricing(c *gin.Context) {
	cusip := c.Param("cusip")
	asOfDate, err := h.resolveAsOfDate(c.Query("asOfDate"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	instrument, err := h.fetchInstrument(cusip)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	curve, err := h.fetchCurve(asOfDate)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	evaluated, err := h.pricing.Evaluate(instrument.pricingInput(), curve, asOfDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, mapEvaluatedPrice(evaluated))
}

func (h *MarketDataQueryHandler) GetPricingHistory(c *gin.Context) {
	cusip := c.Param("cusip")
	limit := parseIntWithDefault(c.DefaultQuery("limit", "10"), 10)

	instrument, err := h.fetchInstrument(cusip)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	rows, err := h.db.Query(`SELECT DISTINCT "asOfDate" FROM yield_curves ORDER BY "asOfDate" DESC LIMIT $1`, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var history []map[string]interface{}
	for rows.Next() {
		var date time.Time
		if err := rows.Scan(&date); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		curve, err := h.fetchCurve(date)
		if err != nil {
			continue
		}
		evaluated, err := h.pricing.Evaluate(instrument.pricingInput(), curve, date)
		if err != nil {
			continue
		}
		history = append(history, mapEvaluatedPrice(evaluated))
	}

	c.JSON(http.StatusOK, gin.H{
		"cusip":   cusip,
		"history": history,
	})
}

func (h *MarketDataQueryHandler) GetMarketDataSummary(c *gin.Context) {
	var (
		total int
		bill  int
		note  int
		bond  int
		tips  int
	)

	countQuery := `SELECT "type", COUNT(*) FROM instruments GROUP BY "type"`
	rows, err := h.db.Query(countQuery)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	for rows.Next() {
		var t string
		var count int
		if err := rows.Scan(&t, &count); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		total += count
		switch t {
		case "bill":
			bill = count
		case "note":
			note = count
		case "bond":
			bond = count
		case "tips":
			tips = count
		}
	}

	var latestCurve time.Time
	err = h.db.QueryRow(`SELECT MAX("asOfDate") FROM yield_curves`).Scan(&latestCurve)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	bucketCounts := map[string]int{
		"0-2y":   0,
		"2-5y":   0,
		"5-10y":  0,
		"10-20y": 0,
		"20y+":   0,
	}

	rows, err = h.db.Query(`SELECT "maturityDate" FROM instruments`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	for rows.Next() {
		var maturity time.Time
		if err := rows.Scan(&maturity); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		bucket := getMaturityBucket(maturity, latestCurve)
		bucketCounts[bucket]++
	}

	c.JSON(http.StatusOK, gin.H{
		"totalInstruments": total,
		"billCount":        bill,
		"noteCount":        note,
		"bondCount":        bond,
		"tipsCount":        tips,
		"bucketCounts":     bucketCounts,
		"latestCurveDate":  latestCurve,
	})
}

type instrumentRow struct {
	Cusip                    string
	Name                     string
	Ticker                   sql.NullString
	Type                     string
	Coupon                   float64
	IssueDate                time.Time
	MaturityDate             time.Time
	CouponFrequency          int
	AskModifiedDuration      sql.NullFloat64
	BidModifiedDuration      sql.NullFloat64
	AskYieldToMaturity       sql.NullFloat64
	AskPrice                 sql.NullFloat64
	MaturityType             sql.NullString
	IssuedAmount             sql.NullInt64
	OutstandingAmount        sql.NullInt64
	Currency                 sql.NullString
	StandardPoorRating       sql.NullString
	MoodyRating              sql.NullString
	FitchRating              sql.NullString
	DBRSRating               sql.NullString
	Series                   sql.NullString
	BloombergCompositeRating sql.NullString
	Announce                 sql.NullString
	CreatedAt                time.Time
	UpdatedAt                time.Time
}

func (row instrumentRow) pricingInput() pricing.InstrumentInput {
	dayCount := "ACT/ACT"
	if row.Type == "bill" || row.CouponFrequency == 0 || row.Coupon == 0 {
		dayCount = "ACT/360"
	}

	return pricing.InstrumentInput{
		Cusip:           row.Cusip,
		Type:            row.Type,
		Coupon:          row.Coupon,
		IssueDate:       row.IssueDate,
		MaturityDate:    row.MaturityDate,
		CouponFrequency: row.CouponFrequency,
		DayCount:        dayCount,
	}
}

func (row instrumentRow) response(maturityBucket string, evaluated map[string]interface{}) map[string]interface{} {
	result := map[string]interface{}{
		"cusip":             row.Cusip,
		"name":              row.Name,
		"type":              row.Type,
		"coupon":            row.Coupon,
		"issueDate":         row.IssueDate,
		"maturityDate":      row.MaturityDate,
		"couponFrequency":   row.CouponFrequency,
		"dayCount":          row.pricingInput().DayCount,
		"maturityBucket":    maturityBucket,
		"issuedAmount":      nullInt64(row.IssuedAmount),
		"outstandingAmount": nullInt64(row.OutstandingAmount),
		"currency":          nullStringOrDefault(row.Currency, "USD"),
		"createdAt":         row.CreatedAt,
		"updatedAt":         row.UpdatedAt,
		"evaluatedPrice":    evaluated,
	}

	optionalString(&result, "ticker", row.Ticker)
	optionalString(&result, "standardPoorRating", row.StandardPoorRating)
	optionalString(&result, "moodyRating", row.MoodyRating)
	optionalString(&result, "fitchRating", row.FitchRating)
	optionalString(&result, "dbrsRating", row.DBRSRating)
	optionalString(&result, "series", row.Series)
	optionalString(&result, "bloombergCompositeRating", row.BloombergCompositeRating)
	optionalString(&result, "announce", row.Announce)
	optionalString(&result, "maturityType", row.MaturityType)

	return result
}

func (h *MarketDataQueryHandler) fetchInstruments(c *gin.Context) ([]instrumentRow, error) {
	var (
		types        = parseList(c.Query("types"))
		maturityFrom = c.Query("maturityFrom")
		maturityTo   = c.Query("maturityTo")
		cusipSearch  = c.Query("cusip")
		couponMin    = c.Query("couponMin")
		couponMax    = c.Query("couponMax")
		limit        = parseIntWithDefault(c.DefaultQuery("limit", "500"), 500)
		offset       = parseIntWithDefault(c.DefaultQuery("offset", "0"), 0)
	)

	query := `
		SELECT
			"cusip", "name", "ticker", "type", "coupon", "issueDate", "maturityDate",
			"couponFrequency", "askModifiedDuration", "bidModifiedDuration",
			"askYieldToMaturity", "askPrice", "maturityType", "issuedAmount",
			"outstandingAmount", "currency", "standardPoorRating", "moodyRating",
			"fitchRating", "dbrsRating", "series", "bloombergCompositeRating",
			"announce", "createdAt", "updatedAt"
		FROM instruments
		WHERE 1=1
	`

	args := []interface{}{}
	argPos := 1

	if len(types) > 0 {
		query += fmt.Sprintf(` AND "type" = ANY($%d)`, argPos)
		args = append(args, pq.Array(types))
		argPos++
	}
	if maturityFrom != "" {
		query += fmt.Sprintf(` AND "maturityDate" >= $%d`, argPos)
		args = append(args, maturityFrom)
		argPos++
	}
	if maturityTo != "" {
		query += fmt.Sprintf(` AND "maturityDate" <= $%d`, argPos)
		args = append(args, maturityTo)
		argPos++
	}
	if cusipSearch != "" {
		query += fmt.Sprintf(` AND ("cusip" ILIKE $%d OR "name" ILIKE $%d)`, argPos, argPos)
		args = append(args, "%"+cusipSearch+"%")
		argPos++
	}
	if couponMin != "" {
		query += fmt.Sprintf(` AND "coupon" >= $%d`, argPos)
		args = append(args, couponMin)
		argPos++
	}
	if couponMax != "" {
		query += fmt.Sprintf(` AND "coupon" <= $%d`, argPos)
		args = append(args, couponMax)
		argPos++
	}

	query += ` ORDER BY "maturityDate" ASC`
	query += fmt.Sprintf(` LIMIT $%d OFFSET $%d`, argPos, argPos+1)
	args = append(args, limit, offset)

	rows, err := h.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var instruments []instrumentRow
	for rows.Next() {
		var row instrumentRow
		if err := rows.Scan(
			&row.Cusip, &row.Name, &row.Ticker, &row.Type, &row.Coupon,
			&row.IssueDate, &row.MaturityDate, &row.CouponFrequency,
			&row.AskModifiedDuration, &row.BidModifiedDuration, &row.AskYieldToMaturity,
			&row.AskPrice, &row.MaturityType, &row.IssuedAmount, &row.OutstandingAmount,
			&row.Currency, &row.StandardPoorRating, &row.MoodyRating, &row.FitchRating,
			&row.DBRSRating, &row.Series, &row.BloombergCompositeRating, &row.Announce,
			&row.CreatedAt, &row.UpdatedAt,
		); err != nil {
			return nil, err
		}
		instruments = append(instruments, row)
	}
	return instruments, nil
}

func (h *MarketDataQueryHandler) fetchInstrument(cusip string) (instrumentRow, error) {
	var row instrumentRow
	err := h.db.QueryRow(`
		SELECT
			"cusip", "name", "ticker", "type", "coupon", "issueDate", "maturityDate",
			"couponFrequency", "askModifiedDuration", "bidModifiedDuration",
			"askYieldToMaturity", "askPrice", "maturityType", "issuedAmount",
			"outstandingAmount", "currency", "standardPoorRating", "moodyRating",
			"fitchRating", "dbrsRating", "series", "bloombergCompositeRating",
			"announce", "createdAt", "updatedAt"
		FROM instruments
		WHERE "cusip" = $1
	`, cusip).Scan(
		&row.Cusip, &row.Name, &row.Ticker, &row.Type, &row.Coupon,
		&row.IssueDate, &row.MaturityDate, &row.CouponFrequency,
		&row.AskModifiedDuration, &row.BidModifiedDuration, &row.AskYieldToMaturity,
		&row.AskPrice, &row.MaturityType, &row.IssuedAmount, &row.OutstandingAmount,
		&row.Currency, &row.StandardPoorRating, &row.MoodyRating, &row.FitchRating,
		&row.DBRSRating, &row.Series, &row.BloombergCompositeRating, &row.Announce,
		&row.CreatedAt, &row.UpdatedAt,
	)
	if err != nil {
		return row, err
	}
	return row, nil
}

func (h *MarketDataQueryHandler) fetchCurve(asOfDate time.Time) (pricing.CurveData, error) {
	rows, err := h.db.Query(`
		SELECT "tenor", "parYield", "ingestedAt"
		FROM yield_curves
		WHERE "asOfDate" = $1
	`, asOfDate)
	if err != nil {
		return pricing.CurveData{}, err
	}
	defer rows.Close()

	var points []pricing.CurvePoint
	var ingestedAt time.Time
	for rows.Next() {
		var tenor string
		var parYield float64
		var ingested time.Time
		if err := rows.Scan(&tenor, &parYield, &ingested); err != nil {
			return pricing.CurveData{}, err
		}
		ingestedAt = ingested
		tenorYears, _ := tenorYearsFromEnum(tenor)
		if tenorYears == 0 {
			continue
		}
		points = append(points, pricing.CurvePoint{
			TenorYears: tenorYears,
			ParYield:   parYield,
		})
	}

	if len(points) == 0 {
		return pricing.CurveData{}, fmt.Errorf("no curve points for %s", asOfDate.Format("2006-01-02"))
	}

	return pricing.CurveData{
		AsOfDate:   asOfDate,
		Points:     points,
		SourceURL:  "https://fred.stlouisfed.org",
		SourceHash: "",
		IngestedAt: ingestedAt,
		IngestedBy: "ingest_yield_curves_fred.py",
	}, nil
}

func (h *MarketDataQueryHandler) resolveAsOfDate(value string) (time.Time, error) {
	if value != "" {
		if parsed, err := parseDate(value); err == nil {
			return parsed, nil
		}
		return time.Time{}, fmt.Errorf("invalid asOfDate")
	}

	var latest time.Time
	err := h.db.QueryRow(`SELECT MAX("asOfDate") FROM yield_curves`).Scan(&latest)
	if err != nil {
		return time.Time{}, err
	}
	if latest.IsZero() {
		return time.Time{}, fmt.Errorf("no curve dates available")
	}
	return latest, nil
}

func parseDate(value string) (time.Time, error) {
	if parsed, err := time.Parse("2006-01-02", value); err == nil {
		return parsed, nil
	}
	return time.Parse(time.RFC3339, value)
}

func parseList(value string) []string {
	if value == "" {
		return nil
	}
	parts := strings.Split(value, ",")
	results := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			results = append(results, trimmed)
		}
	}
	return results
}

func parseIntWithDefault(value string, fallback int) int {
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func mapEvaluatedPrice(price *pricing.EvaluatedPrice) map[string]interface{} {
	if price == nil {
		return nil
	}
	return map[string]interface{}{
		"cusip":               price.Cusip,
		"asOfDate":            price.AsOfDate,
		"cleanPrice":          price.CleanPrice,
		"dirtyPrice":          price.DirtyPrice,
		"accruedInterest":     price.AccruedInterest,
		"yieldToMaturity":     price.YieldToMaturity,
		"modifiedDuration":    price.ModifiedDuration,
		"dv01":                price.DV01,
		"pricingModelVersion": price.PricingModelVersion,
		"curveSource": map[string]interface{}{
			"sourceUrl":  price.CurveSource.SourceURL,
			"sourceHash": price.CurveSource.SourceHash,
			"ingestedAt": price.CurveSource.IngestedAt,
			"ingestedBy": price.CurveSource.IngestedBy,
		},
		"computedAt": price.ComputedAt,
	}
}

func mapCurvePoints(points []pricing.CurvePoint) []map[string]interface{} {
	mapped := make([]map[string]interface{}, 0, len(points))
	for _, point := range points {
		label := tenorLabel(point.TenorYears)
		mapped = append(mapped, map[string]interface{}{
			"tenor":    label,
			"parYield": point.ParYield,
		})
	}
	return mapped
}

func tenorYearsFromEnum(value string) (float64, string) {
	switch value {
	case "M1":
		return 1.0 / 12.0, "1M"
	case "M3":
		return 0.25, "3M"
	case "M6":
		return 0.5, "6M"
	case "Y1":
		return 1, "1Y"
	case "Y2":
		return 2, "2Y"
	case "Y3":
		return 3, "3Y"
	case "Y5":
		return 5, "5Y"
	case "Y7":
		return 7, "7Y"
	case "Y10":
		return 10, "10Y"
	case "Y20":
		return 20, "20Y"
	case "Y30":
		return 30, "30Y"
	default:
		return 0, value
	}
}

func tenorLabel(years float64) string {
	switch years {
	case 1.0 / 12.0:
		return "1M"
	case 0.25:
		return "3M"
	case 0.5:
		return "6M"
	case 1:
		return "1Y"
	case 2:
		return "2Y"
	case 3:
		return "3Y"
	case 5:
		return "5Y"
	case 7:
		return "7Y"
	case 10:
		return "10Y"
	case 20:
		return "20Y"
	case 30:
		return "30Y"
	default:
		return fmt.Sprintf("%.1fY", years)
	}
}

func getMaturityBucket(maturityDate, asOfDate time.Time) string {
	years := maturityDate.Sub(asOfDate).Hours() / 24 / 365.25
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

func nullInt64(value sql.NullInt64) int64 {
	if value.Valid {
		return value.Int64
	}
	return 0
}

func nullStringOrDefault(value sql.NullString, fallback string) string {
	if value.Valid {
		return value.String
	}
	return fallback
}

func optionalString(dest *map[string]interface{}, key string, value sql.NullString) {
	if value.Valid {
		(*dest)[key] = value.String
	}
}

func contains(list []string, value string) bool {
	for _, item := range list {
		if item == value {
			return true
		}
	}
	return false
}
