import type {
  Instrument,
  InstrumentWithPricing,
  YieldCurve,
  YieldCurvePoint,
  EvaluatedPrice,
  MarketDataDay,
  MarketDataSummary,
  InstrumentType,
  MaturityBucket,
  Tenor,
  CurveSource,
} from "./types";

// Helper to calculate maturity bucket
export function getMaturityBucket(maturityDate: Date, asOfDate: Date = new Date()): MaturityBucket {
  const yearsToMaturity = (maturityDate.getTime() - asOfDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (yearsToMaturity <= 2) return "0-2y";
  if (yearsToMaturity <= 5) return "2-5y";
  if (yearsToMaturity <= 10) return "5-10y";
  if (yearsToMaturity <= 20) return "10-20y";
  return "20y+";
}

// Sample instruments (50+ UST securities)
export const instruments: Instrument[] = [
  // Bills (0 coupon, short maturity)
  {
    cusip: "912796XY2",
    name: "US Treasury Bill 03/21/2024",
    type: "bill",
    coupon: 0,
    issueDate: new Date("2023-09-21"),
    maturityDate: new Date("2024-03-21"),
    couponFrequency: 0,
    dayCount: "ACT/360",
    issuedAmount: 75000000000,
    outstandingAmount: 75000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2023-09-21"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    cusip: "912796XZ9",
    name: "US Treasury Bill 04/18/2024",
    type: "bill",
    coupon: 0,
    issueDate: new Date("2023-10-19"),
    maturityDate: new Date("2024-04-18"),
    couponFrequency: 0,
    dayCount: "ACT/360",
    issuedAmount: 68000000000,
    outstandingAmount: 68000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2023-10-19"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    cusip: "912796YA3",
    name: "US Treasury Bill 05/16/2024",
    type: "bill",
    coupon: 0,
    issueDate: new Date("2023-11-16"),
    maturityDate: new Date("2024-05-16"),
    couponFrequency: 0,
    dayCount: "ACT/360",
    issuedAmount: 72000000000,
    outstandingAmount: 72000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2023-11-16"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    cusip: "912796YB1",
    name: "US Treasury Bill 06/20/2024",
    type: "bill",
    coupon: 0,
    issueDate: new Date("2023-12-21"),
    maturityDate: new Date("2024-06-20"),
    couponFrequency: 0,
    dayCount: "ACT/360",
    issuedAmount: 70000000000,
    outstandingAmount: 70000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2023-12-21"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    cusip: "912796YC9",
    name: "US Treasury Bill 07/18/2024",
    type: "bill",
    coupon: 0,
    issueDate: new Date("2024-01-18"),
    maturityDate: new Date("2024-07-18"),
    couponFrequency: 0,
    dayCount: "ACT/360",
    issuedAmount: 65000000000,
    outstandingAmount: 65000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2024-01-18"),
    updatedAt: new Date("2024-01-18"),
  },
  // Notes (2-10 year maturity)
  {
    cusip: "91282CJK5",
    name: "US Treasury Note 4.125% 01/31/2026",
    type: "note",
    coupon: 4.125,
    issueDate: new Date("2024-01-31"),
    maturityDate: new Date("2026-01-31"),
    couponFrequency: 2,
    dayCount: "ACT/ACT",
    issuedAmount: 58000000000,
    outstandingAmount: 58000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2024-01-31"),
    updatedAt: new Date("2024-01-31"),
  },
  {
    cusip: "91282CJL3",
    name: "US Treasury Note 4.25% 02/28/2026",
    type: "note",
    coupon: 4.25,
    issueDate: new Date("2024-02-28"),
    maturityDate: new Date("2026-02-28"),
    couponFrequency: 2,
    dayCount: "ACT/ACT",
    issuedAmount: 55000000000,
    outstandingAmount: 55000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2024-02-28"),
    updatedAt: new Date("2024-02-28"),
  },
  {
    cusip: "91282CJM1",
    name: "US Treasury Note 4.00% 12/31/2026",
    type: "note",
    coupon: 4.0,
    issueDate: new Date("2023-12-31"),
    maturityDate: new Date("2026-12-31"),
    couponFrequency: 2,
    dayCount: "ACT/ACT",
    issuedAmount: 52000000000,
    outstandingAmount: 52000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2023-12-31"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    cusip: "91282CJN9",
    name: "US Treasury Note 3.875% 08/15/2027",
    type: "note",
    coupon: 3.875,
    issueDate: new Date("2022-08-15"),
    maturityDate: new Date("2027-08-15"),
    couponFrequency: 2,
    dayCount: "ACT/ACT",
    issuedAmount: 48000000000,
    outstandingAmount: 48000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2022-08-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    cusip: "91282CJP4",
    name: "US Treasury Note 4.50% 11/30/2028",
    type: "note",
    coupon: 4.5,
    issueDate: new Date("2023-11-30"),
    maturityDate: new Date("2028-11-30"),
    couponFrequency: 2,
    dayCount: "ACT/ACT",
    issuedAmount: 45000000000,
    outstandingAmount: 45000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2023-11-30"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    cusip: "91282CJQ2",
    name: "US Treasury Note 4.625% 05/15/2029",
    type: "note",
    coupon: 4.625,
    issueDate: new Date("2024-05-15"),
    maturityDate: new Date("2029-05-15"),
    couponFrequency: 2,
    dayCount: "ACT/ACT",
    issuedAmount: 42000000000,
    outstandingAmount: 42000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2024-05-15"),
    updatedAt: new Date("2024-05-15"),
  },
  {
    cusip: "91282CJR0",
    name: "US Treasury Note 3.50% 02/15/2030",
    type: "note",
    coupon: 3.5,
    issueDate: new Date("2020-02-15"),
    maturityDate: new Date("2030-02-15"),
    couponFrequency: 2,
    dayCount: "ACT/ACT",
    issuedAmount: 38000000000,
    outstandingAmount: 38000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2020-02-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    cusip: "91282CJS8",
    name: "US Treasury Note 1.625% 05/15/2031",
    type: "note",
    coupon: 1.625,
    issueDate: new Date("2021-05-15"),
    maturityDate: new Date("2031-05-15"),
    couponFrequency: 2,
    dayCount: "ACT/ACT",
    issuedAmount: 35000000000,
    outstandingAmount: 35000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2021-05-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    cusip: "91282CJT6",
    name: "US Treasury Note 2.875% 05/15/2032",
    type: "note",
    coupon: 2.875,
    issueDate: new Date("2022-05-15"),
    maturityDate: new Date("2032-05-15"),
    couponFrequency: 2,
    dayCount: "ACT/ACT",
    issuedAmount: 32000000000,
    outstandingAmount: 32000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2022-05-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    cusip: "91282CJU3",
    name: "US Treasury Note 3.50% 02/15/2033",
    type: "note",
    coupon: 3.5,
    issueDate: new Date("2023-02-15"),
    maturityDate: new Date("2033-02-15"),
    couponFrequency: 2,
    dayCount: "ACT/ACT",
    issuedAmount: 30000000000,
    outstandingAmount: 30000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2023-02-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    cusip: "91282CJV1",
    name: "US Treasury Note 4.50% 11/15/2033",
    type: "note",
    coupon: 4.5,
    issueDate: new Date("2023-11-15"),
    maturityDate: new Date("2033-11-15"),
    couponFrequency: 2,
    dayCount: "ACT/ACT",
    issuedAmount: 28000000000,
    outstandingAmount: 28000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2023-11-15"),
    updatedAt: new Date("2024-01-15"),
  },
  // Bonds (10-30 year maturity)
  {
    cusip: "912810TV2",
    name: "US Treasury Bond 4.375% 02/15/2054",
    type: "bond",
    coupon: 4.375,
    issueDate: new Date("2024-02-15"),
    maturityDate: new Date("2054-02-15"),
    couponFrequency: 2,
    dayCount: "ACT/ACT",
    issuedAmount: 22000000000,
    outstandingAmount: 22000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-15"),
  },
  {
    cusip: "912810TU4",
    name: "US Treasury Bond 4.125% 08/15/2053",
    type: "bond",
    coupon: 4.125,
    issueDate: new Date("2023-08-15"),
    maturityDate: new Date("2053-08-15"),
    couponFrequency: 2,
    dayCount: "ACT/ACT",
    issuedAmount: 20000000000,
    outstandingAmount: 20000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2023-08-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    cusip: "912810TT7",
    name: "US Treasury Bond 3.625% 02/15/2053",
    type: "bond",
    coupon: 3.625,
    issueDate: new Date("2023-02-15"),
    maturityDate: new Date("2053-02-15"),
    couponFrequency: 2,
    dayCount: "ACT/ACT",
    issuedAmount: 18000000000,
    outstandingAmount: 18000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2023-02-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    cusip: "912810TS9",
    name: "US Treasury Bond 4.00% 11/15/2052",
    type: "bond",
    coupon: 4.0,
    issueDate: new Date("2022-11-15"),
    maturityDate: new Date("2052-11-15"),
    couponFrequency: 2,
    dayCount: "ACT/ACT",
    issuedAmount: 17000000000,
    outstandingAmount: 17000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2022-11-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    cusip: "912810TR1",
    name: "US Treasury Bond 3.00% 08/15/2052",
    type: "bond",
    coupon: 3.0,
    issueDate: new Date("2022-08-15"),
    maturityDate: new Date("2052-08-15"),
    couponFrequency: 2,
    dayCount: "ACT/ACT",
    issuedAmount: 16000000000,
    outstandingAmount: 16000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2022-08-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    cusip: "912810TQ3",
    name: "US Treasury Bond 3.875% 02/15/2043",
    type: "bond",
    coupon: 3.875,
    issueDate: new Date("2013-02-15"),
    maturityDate: new Date("2043-02-15"),
    couponFrequency: 2,
    dayCount: "ACT/ACT",
    issuedAmount: 32000000000,
    outstandingAmount: 32000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2013-02-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    cusip: "912810TP5",
    name: "US Treasury Bond 4.00% 11/15/2042",
    type: "bond",
    coupon: 4.0,
    issueDate: new Date("2012-11-15"),
    maturityDate: new Date("2042-11-15"),
    couponFrequency: 2,
    dayCount: "ACT/ACT",
    issuedAmount: 28000000000,
    outstandingAmount: 28000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2012-11-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    cusip: "912810TN0",
    name: "US Treasury Bond 4.625% 02/15/2040",
    type: "bond",
    coupon: 4.625,
    issueDate: new Date("2010-02-15"),
    maturityDate: new Date("2040-02-15"),
    couponFrequency: 2,
    dayCount: "ACT/ACT",
    issuedAmount: 25000000000,
    outstandingAmount: 25000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2010-02-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    cusip: "912810TM2",
    name: "US Treasury Bond 5.00% 05/15/2037",
    type: "bond",
    coupon: 5.0,
    issueDate: new Date("2007-05-15"),
    maturityDate: new Date("2037-05-15"),
    couponFrequency: 2,
    dayCount: "ACT/ACT",
    issuedAmount: 23000000000,
    outstandingAmount: 23000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2007-05-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    cusip: "912810TL4",
    name: "US Treasury Bond 4.25% 05/15/2039",
    type: "bond",
    coupon: 4.25,
    issueDate: new Date("2009-05-15"),
    maturityDate: new Date("2039-05-15"),
    couponFrequency: 2,
    dayCount: "ACT/ACT",
    issuedAmount: 22000000000,
    outstandingAmount: 22000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2009-05-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    cusip: "912810TK6",
    name: "US Treasury Bond 3.00% 11/15/2045",
    type: "bond",
    coupon: 3.0,
    issueDate: new Date("2015-11-15"),
    maturityDate: new Date("2045-11-15"),
    couponFrequency: 2,
    dayCount: "ACT/ACT",
    issuedAmount: 21000000000,
    outstandingAmount: 21000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2015-11-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    cusip: "912810TJ9",
    name: "US Treasury Bond 2.50% 05/15/2046",
    type: "bond",
    coupon: 2.5,
    issueDate: new Date("2016-05-15"),
    maturityDate: new Date("2046-05-15"),
    couponFrequency: 2,
    dayCount: "ACT/ACT",
    issuedAmount: 20000000000,
    outstandingAmount: 20000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2016-05-15"),
    updatedAt: new Date("2024-01-15"),
  },
  // TIPS (Treasury Inflation-Protected Securities)
  {
    cusip: "912828YK6",
    name: "US Treasury TIPS 0.125% 01/15/2025",
    type: "tips",
    coupon: 0.125,
    issueDate: new Date("2020-01-15"),
    maturityDate: new Date("2025-01-15"),
    couponFrequency: 2,
    dayCount: "ACT/ACT",
    issuedAmount: 18000000000,
    outstandingAmount: 18000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2020-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    cusip: "912828YL4",
    name: "US Treasury TIPS 0.625% 01/15/2026",
    type: "tips",
    coupon: 0.625,
    issueDate: new Date("2021-01-15"),
    maturityDate: new Date("2026-01-15"),
    couponFrequency: 2,
    dayCount: "ACT/ACT",
    issuedAmount: 20000000000,
    outstandingAmount: 20000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2021-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    cusip: "912828YM2",
    name: "US Treasury TIPS 1.75% 01/15/2028",
    type: "tips",
    coupon: 1.75,
    issueDate: new Date("2018-01-15"),
    maturityDate: new Date("2028-01-15"),
    couponFrequency: 2,
    dayCount: "ACT/ACT",
    issuedAmount: 22000000000,
    outstandingAmount: 22000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2018-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    cusip: "912828YN0",
    name: "US Treasury TIPS 2.125% 02/15/2054",
    type: "tips",
    coupon: 2.125,
    issueDate: new Date("2024-02-15"),
    maturityDate: new Date("2054-02-15"),
    couponFrequency: 2,
    dayCount: "ACT/ACT",
    issuedAmount: 9000000000,
    outstandingAmount: 9000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-15"),
  },
  {
    cusip: "912828YP5",
    name: "US Treasury TIPS 1.375% 01/15/2033",
    type: "tips",
    coupon: 1.375,
    issueDate: new Date("2023-01-15"),
    maturityDate: new Date("2033-01-15"),
    couponFrequency: 2,
    dayCount: "ACT/ACT",
    issuedAmount: 15000000000,
    outstandingAmount: 15000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  // Additional notes for variety
  {
    cusip: "91282CJW9",
    name: "US Treasury Note 2.25% 11/15/2027",
    type: "note",
    coupon: 2.25,
    issueDate: new Date("2017-11-15"),
    maturityDate: new Date("2027-11-15"),
    couponFrequency: 2,
    dayCount: "ACT/ACT",
    issuedAmount: 42000000000,
    outstandingAmount: 42000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2017-11-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    cusip: "91282CJX7",
    name: "US Treasury Note 2.00% 02/15/2025",
    type: "note",
    coupon: 2.0,
    issueDate: new Date("2015-02-15"),
    maturityDate: new Date("2025-02-15"),
    couponFrequency: 2,
    dayCount: "ACT/ACT",
    issuedAmount: 60000000000,
    outstandingAmount: 60000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2015-02-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    cusip: "91282CJY5",
    name: "US Treasury Note 4.00% 02/15/2028",
    type: "note",
    coupon: 4.0,
    issueDate: new Date("2023-02-15"),
    maturityDate: new Date("2028-02-15"),
    couponFrequency: 2,
    dayCount: "ACT/ACT",
    issuedAmount: 50000000000,
    outstandingAmount: 50000000000,
    currency: "USD",
    standardPoorRating: "AA+",
    moodyRating: "Aaa",
    createdAt: new Date("2023-02-15"),
    updatedAt: new Date("2024-01-15"),
  },
];

// Sample yield curves for different dates
export const yieldCurves: YieldCurve[] = [
  {
    asOfDate: new Date("2024-01-15"),
    curvePoints: [
      { tenor: "1M", parYield: 5.38 },
      { tenor: "3M", parYield: 5.42 },
      { tenor: "6M", parYield: 5.35 },
      { tenor: "1Y", parYield: 5.05 },
      { tenor: "2Y", parYield: 4.38 },
      { tenor: "3Y", parYield: 4.15 },
      { tenor: "5Y", parYield: 4.02 },
      { tenor: "7Y", parYield: 4.08 },
      { tenor: "10Y", parYield: 4.18 },
      { tenor: "20Y", parYield: 4.52 },
      { tenor: "30Y", parYield: 4.35 },
    ],
    source: {
      sourceUrl: "https://treasury.gov/yield-curve-2024-01-15.csv",
      sourceHash: "abc123def456",
      ingestedAt: new Date("2024-01-15T17:00:00"),
      ingestedBy: "system@instant.com",
    },
  },
  {
    asOfDate: new Date("2024-01-12"),
    curvePoints: [
      { tenor: "1M", parYield: 5.40 },
      { tenor: "3M", parYield: 5.44 },
      { tenor: "6M", parYield: 5.38 },
      { tenor: "1Y", parYield: 5.10 },
      { tenor: "2Y", parYield: 4.42 },
      { tenor: "3Y", parYield: 4.18 },
      { tenor: "5Y", parYield: 4.05 },
      { tenor: "7Y", parYield: 4.10 },
      { tenor: "10Y", parYield: 4.20 },
      { tenor: "20Y", parYield: 4.55 },
      { tenor: "30Y", parYield: 4.38 },
    ],
    source: {
      sourceUrl: "https://treasury.gov/yield-curve-2024-01-12.csv",
      sourceHash: "xyz789abc123",
      ingestedAt: new Date("2024-01-12T17:00:00"),
      ingestedBy: "system@instant.com",
    },
  },
  {
    asOfDate: new Date("2024-01-10"),
    curvePoints: [
      { tenor: "1M", parYield: 5.35 },
      { tenor: "3M", parYield: 5.40 },
      { tenor: "6M", parYield: 5.32 },
      { tenor: "1Y", parYield: 5.02 },
      { tenor: "2Y", parYield: 4.35 },
      { tenor: "3Y", parYield: 4.12 },
      { tenor: "5Y", parYield: 4.00 },
      { tenor: "7Y", parYield: 4.05 },
      { tenor: "10Y", parYield: 4.15 },
      { tenor: "20Y", parYield: 4.48 },
      { tenor: "30Y", parYield: 4.32 },
    ],
    source: {
      sourceUrl: "https://treasury.gov/yield-curve-2024-01-10.csv",
      sourceHash: "def456xyz789",
      ingestedAt: new Date("2024-01-10T17:00:00"),
      ingestedBy: "system@instant.com",
    },
  },
  {
    asOfDate: new Date("2024-01-08"),
    curvePoints: [
      { tenor: "1M", parYield: 5.32 },
      { tenor: "3M", parYield: 5.38 },
      { tenor: "6M", parYield: 5.28 },
      { tenor: "1Y", parYield: 4.98 },
      { tenor: "2Y", parYield: 4.30 },
      { tenor: "3Y", parYield: 4.08 },
      { tenor: "5Y", parYield: 3.95 },
      { tenor: "7Y", parYield: 4.00 },
      { tenor: "10Y", parYield: 4.10 },
      { tenor: "20Y", parYield: 4.45 },
      { tenor: "30Y", parYield: 4.28 },
    ],
    source: {
      sourceUrl: "https://treasury.gov/yield-curve-2024-01-08.csv",
      sourceHash: "ghi123jkl456",
      ingestedAt: new Date("2024-01-08T17:00:00"),
      ingestedBy: "system@instant.com",
    },
  },
  {
    asOfDate: new Date("2024-01-05"),
    curvePoints: [
      { tenor: "1M", parYield: 5.30 },
      { tenor: "3M", parYield: 5.35 },
      { tenor: "6M", parYield: 5.25 },
      { tenor: "1Y", parYield: 4.95 },
      { tenor: "2Y", parYield: 4.28 },
      { tenor: "3Y", parYield: 4.05 },
      { tenor: "5Y", parYield: 3.92 },
      { tenor: "7Y", parYield: 3.98 },
      { tenor: "10Y", parYield: 4.08 },
      { tenor: "20Y", parYield: 4.42 },
      { tenor: "30Y", parYield: 4.25 },
    ],
    source: {
      sourceUrl: "https://treasury.gov/yield-curve-2024-01-05.csv",
      sourceHash: "mno789pqr123",
      ingestedAt: new Date("2024-01-05T17:00:00"),
      ingestedBy: "system@instant.com",
    },
  },
];

// Generate sample evaluated prices for instruments
export function generateEvaluatedPrices(asOfDate: Date): Map<string, EvaluatedPrice> {
  const prices = new Map<string, EvaluatedPrice>();
  const curve = yieldCurves.find(
    (c) => c.asOfDate.toDateString() === asOfDate.toDateString()
  ) || yieldCurves[0];

  instruments.forEach((instrument) => {
    const yearsToMaturity = (instrument.maturityDate.getTime() - asOfDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

    // Skip expired instruments
    if (yearsToMaturity <= 0) return;

    // Simple pricing simulation based on coupon and maturity
    const baseYield = interpolateYield(curve.curvePoints, yearsToMaturity);
    const yieldDiff = instrument.coupon - baseYield;

    // Price approximation (simplified)
    let cleanPrice = 100;
    if (instrument.type === "bill") {
      // Bills: discount pricing
      cleanPrice = 100 / Math.pow(1 + baseYield / 100, yearsToMaturity);
    } else {
      // Notes/Bonds: approximate price based on coupon vs yield
      cleanPrice = 100 + (yieldDiff * yearsToMaturity * 0.85);
      cleanPrice = Math.min(Math.max(cleanPrice, 50), 150); // Clamp to reasonable range
    }

    // Accrued interest (simplified)
    const accruedInterest = instrument.coupon * (Math.random() * 0.5); // Random 0-6 months accrued

    // Duration approximation
    const modifiedDuration = yearsToMaturity * (1 - instrument.coupon / (100 + baseYield)) * 0.95;

    // DV01 = Modified Duration × Price × 0.0001
    const dv01 = modifiedDuration * cleanPrice * 0.0001;

    prices.set(instrument.cusip, {
      cusip: instrument.cusip,
      asOfDate,
      cleanPrice: Number(cleanPrice.toFixed(4)),
      dirtyPrice: Number((cleanPrice + accruedInterest).toFixed(4)),
      accruedInterest: Number(accruedInterest.toFixed(4)),
      yieldToMaturity: Number(baseYield.toFixed(3)),
      modifiedDuration: Number(modifiedDuration.toFixed(3)),
      dv01: Number(dv01.toFixed(4)),
      pricingModelVersion: "v1.0.0",
      curveSource: curve.source,
      computedAt: new Date(),
    });
  });

  return prices;
}

// Linear interpolation of yield for a given maturity
function interpolateYield(curvePoints: YieldCurvePoint[], yearsToMaturity: number): number {
  const tenorYears: Record<Tenor, number> = {
    "1M": 1/12,
    "3M": 0.25,
    "6M": 0.5,
    "1Y": 1,
    "2Y": 2,
    "3Y": 3,
    "5Y": 5,
    "7Y": 7,
    "10Y": 10,
    "20Y": 20,
    "30Y": 30,
  };

  // Find surrounding tenors
  const sortedPoints = curvePoints.map((p) => ({
    years: tenorYears[p.tenor],
    yield: p.parYield,
  })).sort((a, b) => a.years - b.years);

  // Handle edge cases
  if (yearsToMaturity <= sortedPoints[0].years) {
    return sortedPoints[0].yield;
  }
  if (yearsToMaturity >= sortedPoints[sortedPoints.length - 1].years) {
    return sortedPoints[sortedPoints.length - 1].yield;
  }

  // Linear interpolation
  for (let i = 0; i < sortedPoints.length - 1; i++) {
    if (yearsToMaturity >= sortedPoints[i].years && yearsToMaturity <= sortedPoints[i + 1].years) {
      const t = (yearsToMaturity - sortedPoints[i].years) / (sortedPoints[i + 1].years - sortedPoints[i].years);
      return sortedPoints[i].yield + t * (sortedPoints[i + 1].yield - sortedPoints[i].yield);
    }
  }

  return sortedPoints[sortedPoints.length - 1].yield;
}

// Get instruments with pricing
export function getInstrumentsWithPricing(asOfDate: Date = new Date("2024-01-15")): InstrumentWithPricing[] {
  const prices = generateEvaluatedPrices(asOfDate);

  return instruments.map((instrument) => ({
    ...instrument,
    maturityBucket: getMaturityBucket(instrument.maturityDate, asOfDate),
    evaluatedPrice: prices.get(instrument.cusip) || null,
  })).filter((i) => i.evaluatedPrice !== null);
}

// Get instrument by CUSIP with pricing
export function getInstrumentWithPricing(cusip: string, asOfDate: Date = new Date("2024-01-15")): InstrumentWithPricing | undefined {
  const instrument = instruments.find((i) => i.cusip === cusip);
  if (!instrument) return undefined;

  const prices = generateEvaluatedPrices(asOfDate);
  return {
    ...instrument,
    maturityBucket: getMaturityBucket(instrument.maturityDate, asOfDate),
    evaluatedPrice: prices.get(cusip) || null,
  };
}

// Get yield curve for date
export function getYieldCurve(asOfDate: Date): YieldCurve | undefined {
  return yieldCurves.find(
    (c) => c.asOfDate.toDateString() === asOfDate.toDateString()
  );
}

// Get available curve dates
export function getAvailableCurveDates(): Date[] {
  return yieldCurves.map((c) => c.asOfDate).sort((a, b) => b.getTime() - a.getTime());
}

// Get market data summary
export function getMarketDataSummary(): MarketDataSummary {
  const availableDates = getAvailableCurveDates();

  const bucketCounts: Record<MaturityBucket, number> = {
    "0-2y": 0,
    "2-5y": 0,
    "5-10y": 0,
    "10-20y": 0,
    "20y+": 0,
  };

  instruments.forEach((i) => {
    const bucket = getMaturityBucket(i.maturityDate);
    bucketCounts[bucket]++;
  });

  return {
    totalInstruments: instruments.length,
    billCount: instruments.filter((i) => i.type === "bill").length,
    noteCount: instruments.filter((i) => i.type === "note").length,
    bondCount: instruments.filter((i) => i.type === "bond").length,
    tipsCount: instruments.filter((i) => i.type === "tips").length,
    bucketCounts,
    availableCurveDates: availableDates,
    latestCurveDate: availableDates[0] || null,
  };
}

// Type colors for badges
export function getTypeColor(type: InstrumentType): string {
  switch (type) {
    case "bill":
      return "bg-blue-100 text-blue-800";
    case "note":
      return "bg-green-100 text-green-800";
    case "bond":
      return "bg-purple-100 text-purple-800";
    case "tips":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Bucket colors
export function getBucketColor(bucket: MaturityBucket): string {
  switch (bucket) {
    case "0-2y":
      return "bg-blue-100 text-blue-800";
    case "2-5y":
      return "bg-green-100 text-green-800";
    case "5-10y":
      return "bg-yellow-100 text-yellow-800";
    case "10-20y":
      return "bg-orange-100 text-orange-800";
    case "20y+":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Formatting helpers
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPrice(value: number): string {
  return value.toFixed(4);
}

export function formatYield(value: number): string {
  return `${value.toFixed(3)}%`;
}

export function formatDuration(value: number): string {
  return `${value.toFixed(2)}y`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function formatLargeNumber(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return formatCurrency(value);
}
