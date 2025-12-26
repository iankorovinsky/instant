// Instrument types for US Treasuries
export type InstrumentType = "bill" | "note" | "bond" | "tips";

// Maturity buckets for portfolio analysis
export type MaturityBucket = "0-2y" | "2-5y" | "5-10y" | "10-20y" | "20y+";

// Standard yield curve tenors
export type Tenor = "1M" | "3M" | "6M" | "1Y" | "2Y" | "3Y" | "5Y" | "7Y" | "10Y" | "20Y" | "30Y";

// Day count conventions
export type DayCountConvention = "ACT/ACT" | "30/360" | "ACT/360" | "ACT/365";

export interface Instrument {
  cusip: string;
  name: string;
  ticker?: string;
  type: InstrumentType;
  coupon: number; // Annual coupon rate (0 for bills)
  issueDate: Date;
  maturityDate: Date;
  couponFrequency: number; // Payments per year (0 for bills, 2 for notes/bonds)
  dayCount: DayCountConvention;
  issuedAmount: number;
  outstandingAmount: number;
  currency: string;
  standardPoorRating?: string;
  moodyRating?: string;
  fitchRating?: string;
  dbrsRating?: string;
  bloombergCompositeRating?: string;
  series?: string;
  maturityType?: string;
  announce?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InstrumentWithPricing extends Instrument {
  maturityBucket: MaturityBucket;
  evaluatedPrice: EvaluatedPrice | null;
}

export interface YieldCurvePoint {
  tenor: Tenor;
  parYield: number; // percentage
}

export interface YieldCurve {
  asOfDate: Date;
  curvePoints: YieldCurvePoint[];
  source: CurveSource;
}

export interface CurveSource {
  sourceUrl?: string;
  sourceHash?: string;
  ingestedAt: Date;
  ingestedBy: string;
}

export interface EvaluatedPrice {
  cusip: string;
  asOfDate: Date;
  cleanPrice: number; // per $100 par
  dirtyPrice: number; // per $100 par
  accruedInterest: number;
  yieldToMaturity: number; // percentage
  modifiedDuration: number; // years
  dv01: number; // dollars per $100 par
  pricingModelVersion: string;
  curveSource: CurveSource;
  computedAt: Date;
}

// Market data day aggregate
export interface MarketDataDay {
  asOfDate: Date;
  curvePoints: YieldCurvePoint[];
  source: CurveSource;
  instrumentCount: number;
}

// Summary statistics for dashboard
export interface MarketDataSummary {
  totalInstruments: number;
  billCount: number;
  noteCount: number;
  bondCount: number;
  tipsCount: number;
  bucketCounts: Record<MaturityBucket, number>;
  availableCurveDates: Date[];
  latestCurveDate: Date | null;
}

// Filter options for instruments
export interface InstrumentFilters {
  type?: InstrumentType[];
  maturityBucket?: MaturityBucket[];
  maturityFrom?: Date;
  maturityTo?: Date;
  cusip?: string;
  couponMin?: number;
  couponMax?: number;
}

// Grouping options
export type InstrumentGroupBy = "none" | "type" | "maturityBucket";

// Pricing history point
export interface PricingHistoryPoint {
  asOfDate: Date;
  cleanPrice: number;
  yieldToMaturity: number;
}

// Curve comparison
export interface CurveComparison {
  date1: Date;
  date2: Date;
  curve1: YieldCurvePoint[];
  curve2: YieldCurvePoint[];
}
