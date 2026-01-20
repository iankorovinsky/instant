package pricing

import (
	"errors"
	"math"
	"sort"
	"time"
)

const ModelVersion = "v1.0.0"

type CurvePoint struct {
	TenorYears float64
	ParYield   float64
}

type CurveData struct {
	AsOfDate   time.Time
	Points     []CurvePoint
	SourceURL  string
	SourceHash string
	IngestedAt time.Time
	IngestedBy string
}

type InstrumentInput struct {
	Cusip           string
	Type            string
	Coupon          float64
	IssueDate       time.Time
	MaturityDate    time.Time
	CouponFrequency int
	DayCount        string
}

type EvaluatedPrice struct {
	Cusip               string
	AsOfDate            time.Time
	CleanPrice          float64
	DirtyPrice          float64
	AccruedInterest     float64
	YieldToMaturity     float64
	ModifiedDuration    float64
	DV01                float64
	PricingModelVersion string
	CurveSource         CurveSource
	ComputedAt          time.Time
}

type CurveSource struct {
	SourceURL  string
	SourceHash string
	IngestedAt time.Time
	IngestedBy string
}

type Service struct{}

func NewService() *Service {
	return &Service{}
}

func (s *Service) Evaluate(instrument InstrumentInput, curve CurveData, asOfDate time.Time) (*EvaluatedPrice, error) {
	if len(curve.Points) == 0 {
		return nil, errors.New("curve has no points")
	}
	if !instrument.MaturityDate.After(asOfDate) {
		return nil, errors.New("instrument matured before as-of date")
	}

	tenorYears := yearFraction(asOfDate, instrument.MaturityDate, instrument.DayCount)
	interpolatedYield := interpolateYield(tenorYears, curve.Points)

	cashflows := buildCashflows(instrument, asOfDate)
	if len(cashflows) == 0 {
		return nil, errors.New("no future cashflows")
	}

	dirtyPrice := priceFromYield(cashflows, interpolatedYield)
	accrued := accruedInterest(instrument, asOfDate)
	cleanPrice := dirtyPrice - accrued

	ytm := solveYield(cashflows, dirtyPrice, interpolatedYield)
	modifiedDuration := modifiedDuration(cashflows, dirtyPrice, ytm)
	dv01 := modifiedDuration * dirtyPrice * 0.0001

	return &EvaluatedPrice{
		Cusip:               instrument.Cusip,
		AsOfDate:            asOfDate,
		CleanPrice:          cleanPrice,
		DirtyPrice:          dirtyPrice,
		AccruedInterest:     accrued,
		YieldToMaturity:     ytm * 100,
		ModifiedDuration:    modifiedDuration,
		DV01:                dv01,
		PricingModelVersion: ModelVersion,
		CurveSource: CurveSource{
			SourceURL:  curve.SourceURL,
			SourceHash: curve.SourceHash,
			IngestedAt: curve.IngestedAt,
			IngestedBy: curve.IngestedBy,
		},
		ComputedAt: time.Now().UTC(),
	}, nil
}

type cashflow struct {
	timeYears float64
	amount    float64
}

func buildCashflows(instrument InstrumentInput, asOfDate time.Time) []cashflow {
	if instrument.CouponFrequency <= 0 || instrument.Coupon == 0 {
		years := yearFraction(asOfDate, instrument.MaturityDate, instrument.DayCount)
		return []cashflow{{timeYears: years, amount: 100}}
	}

	periodMonths := 12 / instrument.CouponFrequency
	nextCoupon := nextCouponDate(instrument.IssueDate, asOfDate, periodMonths)
	couponAmount := (instrument.Coupon / 100) * 100 / float64(instrument.CouponFrequency)

	var flows []cashflow
	for !nextCoupon.After(instrument.MaturityDate) {
		amount := couponAmount
		if sameDate(nextCoupon, instrument.MaturityDate) {
			amount += 100
		}
		flows = append(flows, cashflow{
			timeYears: yearFraction(asOfDate, nextCoupon, instrument.DayCount),
			amount:    amount,
		})
		nextCoupon = addMonths(nextCoupon, periodMonths)
	}

	return flows
}

func interpolateYield(maturityYears float64, points []CurvePoint) float64 {
	sorted := make([]CurvePoint, len(points))
	copy(sorted, points)
	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].TenorYears < sorted[j].TenorYears
	})

	if maturityYears <= sorted[0].TenorYears {
		return sorted[0].ParYield / 100
	}
	last := sorted[len(sorted)-1]
	if maturityYears >= last.TenorYears {
		return last.ParYield / 100
	}

	for i := 1; i < len(sorted); i++ {
		prev := sorted[i-1]
		curr := sorted[i]
		if maturityYears <= curr.TenorYears {
			weight := (maturityYears - prev.TenorYears) / (curr.TenorYears - prev.TenorYears)
			yield := prev.ParYield + weight*(curr.ParYield-prev.ParYield)
			return yield / 100
		}
	}

	return last.ParYield / 100
}

func priceFromYield(flows []cashflow, yield float64) float64 {
	price := 0.0
	for _, flow := range flows {
		discount := math.Pow(1+yield, flow.timeYears)
		price += flow.amount / discount
	}
	return price
}

func solveYield(flows []cashflow, targetPrice float64, initialYield float64) float64 {
	yield := initialYield
	for i := 0; i < 50; i++ {
		price := priceFromYield(flows, yield)
		diff := price - targetPrice
		if math.Abs(diff) < 1e-8 {
			return yield
		}

		derivative := 0.0
		for _, flow := range flows {
			if flow.timeYears == 0 {
				continue
			}
			discount := math.Pow(1+yield, flow.timeYears+1)
			derivative -= flow.timeYears * flow.amount / discount
		}

		if derivative == 0 {
			break
		}
		yield -= diff / derivative
		if yield < -0.5 {
			yield = -0.5
		}
		if yield > 1 {
			yield = 1
		}
	}
	return yield
}

func modifiedDuration(flows []cashflow, price float64, yield float64) float64 {
	if price == 0 {
		return 0
	}
	weighted := 0.0
	for _, flow := range flows {
		discount := math.Pow(1+yield, flow.timeYears)
		pv := flow.amount / discount
		weighted += flow.timeYears * pv
	}
	macaulay := weighted / price
	return macaulay / (1 + yield)
}

func accruedInterest(instrument InstrumentInput, asOfDate time.Time) float64 {
	if instrument.CouponFrequency <= 0 || instrument.Coupon == 0 {
		return 0
	}

	periodMonths := 12 / instrument.CouponFrequency
	nextCoupon := nextCouponDate(instrument.IssueDate, asOfDate, periodMonths)
	lastCoupon := addMonths(nextCoupon, -periodMonths)
	if lastCoupon.After(asOfDate) {
		lastCoupon = instrument.IssueDate
	}

	periodFraction := yearFraction(lastCoupon, nextCoupon, instrument.DayCount)
	if periodFraction == 0 {
		return 0
	}

	accrualFraction := yearFraction(lastCoupon, asOfDate, instrument.DayCount) / periodFraction
	couponAmount := (instrument.Coupon / 100) * 100 / float64(instrument.CouponFrequency)
	return couponAmount * accrualFraction
}

func nextCouponDate(issueDate, asOfDate time.Time, periodMonths int) time.Time {
	if !issueDate.Before(asOfDate) {
		return issueDate
	}
	next := issueDate
	for !next.After(asOfDate) {
		next = addMonths(next, periodMonths)
	}
	return next
}

func addMonths(date time.Time, months int) time.Time {
	year := date.Year()
	month := int(date.Month()) + months
	for month > 12 {
		month -= 12
		year++
	}
	for month <= 0 {
		month += 12
		year--
	}
	day := date.Day()
	last := lastDayOfMonth(year, month)
	if day > last {
		day = last
	}
	return time.Date(year, time.Month(month), day, 0, 0, 0, 0, time.UTC)
}

func lastDayOfMonth(year, month int) int {
	return time.Date(year, time.Month(month)+1, 0, 0, 0, 0, 0, time.UTC).Day()
}

func yearFraction(start, end time.Time, dayCount string) float64 {
	if end.Before(start) {
		return 0
	}
	switch dayCount {
	case "30/360":
		return dayCount30360(start, end)
	case "ACT/360":
		return end.Sub(start).Hours() / 24 / 360
	case "ACT/365":
		return end.Sub(start).Hours() / 24 / 365
	default:
		return end.Sub(start).Hours() / 24 / 365.25
	}
}

func dayCount30360(start, end time.Time) float64 {
	sy, sm, sd := start.Date()
	ey, em, ed := end.Date()

	if sd == 31 {
		sd = 30
	}
	if ed == 31 && sd == 30 {
		ed = 30
	}
	days := (ey-sy)*360 + (int(em)-int(sm))*30 + (ed - sd)
	return float64(days) / 360
}

func sameDate(a, b time.Time) bool {
	ay, am, ad := a.Date()
	by, bm, bd := b.Date()
	return ay == by && am == bm && ad == bd
}
