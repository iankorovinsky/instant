package pricing

import (
	"math"
	"testing"
	"time"
)

func TestEvaluateZeroCouponBill(t *testing.T) {
	asOfDate := time.Date(2024, 7, 1, 0, 0, 0, 0, time.UTC)
	maturity := time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)
	curve := CurveData{
		AsOfDate: asOfDate,
		Points: []CurvePoint{
			{TenorYears: 1, ParYield: 5.0},
		},
		SourceURL:  "https://fred.stlouisfed.org",
		IngestedAt: time.Date(2024, 7, 1, 12, 0, 0, 0, time.UTC),
		IngestedBy: "test",
	}

	instrument := InstrumentInput{
		Cusip:           "BILL123",
		Type:            "bill",
		Coupon:          0,
		IssueDate:       time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
		MaturityDate:    maturity,
		CouponFrequency: 0,
		DayCount:        "ACT/360",
	}

	service := NewService()
	result, err := service.Evaluate(instrument, curve, asOfDate)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	years := maturity.Sub(asOfDate).Hours() / 24 / 360
	expectedPrice := 100 / math.Pow(1+0.05, years)

	assertNear(t, result.CleanPrice, expectedPrice, 1e-6)
	assertNear(t, result.DirtyPrice, expectedPrice, 1e-6)
	assertNear(t, result.AccruedInterest, 0, 1e-9)
	assertNear(t, result.YieldToMaturity, 5.0, 1e-4)
}

func TestEvaluateInterpolatedYield(t *testing.T) {
	asOfDate := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	maturity := time.Date(2025, 7, 1, 0, 0, 0, 0, time.UTC)
	curve := CurveData{
		AsOfDate: asOfDate,
		Points: []CurvePoint{
			{TenorYears: 1, ParYield: 5.0},
			{TenorYears: 2, ParYield: 7.0},
		},
		SourceURL:  "https://fred.stlouisfed.org",
		IngestedAt: time.Date(2024, 1, 1, 12, 0, 0, 0, time.UTC),
		IngestedBy: "test",
	}

	instrument := InstrumentInput{
		Cusip:           "ZERO123",
		Type:            "bill",
		Coupon:          0,
		IssueDate:       time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
		MaturityDate:    maturity,
		CouponFrequency: 0,
		DayCount:        "ACT/365",
	}

	service := NewService()
	result, err := service.Evaluate(instrument, curve, asOfDate)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	years := maturity.Sub(asOfDate).Hours() / 24 / 365
	expectedYield := 0.05 + (0.07-0.05)*(years-1)/(2-1)

	assertNear(t, result.YieldToMaturity/100, expectedYield, 5e-4)
}

func TestEvaluateCouponAccruedInterest(t *testing.T) {
	asOfDate := time.Date(2024, 10, 1, 0, 0, 0, 0, time.UTC)
	maturity := time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)
	curve := CurveData{
		AsOfDate: asOfDate,
		Points: []CurvePoint{
			{TenorYears: 1, ParYield: 4.0},
		},
		SourceURL:  "https://fred.stlouisfed.org",
		IngestedAt: time.Date(2024, 10, 1, 12, 0, 0, 0, time.UTC),
		IngestedBy: "test",
	}

	instrument := InstrumentInput{
		Cusip:           "NOTE123",
		Type:            "note",
		Coupon:          4.0,
		IssueDate:       time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
		MaturityDate:    maturity,
		CouponFrequency: 2,
		DayCount:        "ACT/ACT",
	}

	service := NewService()
	result, err := service.Evaluate(instrument, curve, asOfDate)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	expectedAccrued := 1.0
	assertNear(t, result.AccruedInterest, expectedAccrued, 1e-6)
	assertNear(t, result.DirtyPrice-result.CleanPrice, expectedAccrued, 1e-6)

	if result.ModifiedDuration <= 0 {
		t.Fatalf("expected positive duration, got %f", result.ModifiedDuration)
	}
	if result.DV01 <= 0 {
		t.Fatalf("expected positive dv01, got %f", result.DV01)
	}
}

func assertNear(t *testing.T, actual float64, expected float64, tolerance float64) {
	t.Helper()
	if math.Abs(actual-expected) > tolerance {
		t.Fatalf("expected %.8f +/- %.8f, got %.8f", expected, tolerance, actual)
	}
}
