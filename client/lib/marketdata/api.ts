import type {
  CurveSource,
  EvaluatedPrice,
  Instrument,
  InstrumentWithPricing,
  MarketDataSummary,
  Tenor,
  YieldCurve,
} from "@/lib/marketdata/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

type ApiCurvePoint = { tenor: Tenor; parYield: number };
type ApiCurve = { asOfDate: string; curvePoints: ApiCurvePoint[]; source: ApiCurveSource };
type ApiCurveSource = {
  sourceUrl?: string;
  sourceHash?: string;
  ingestedAt: string;
  ingestedBy: string;
};

type ApiEvaluatedPrice = {
  cusip: string;
  asOfDate: string;
  cleanPrice: number;
  dirtyPrice: number;
  accruedInterest: number;
  yieldToMaturity: number;
  modifiedDuration: number;
  dv01: number;
  pricingModelVersion: string;
  curveSource: ApiCurveSource;
  computedAt: string;
};

type ApiInstrument = {
  cusip: string;
  name: string;
  ticker?: string;
  type: Instrument["type"];
  coupon: number;
  issueDate: string;
  maturityDate: string;
  couponFrequency: number;
  dayCount: Instrument["dayCount"];
  maturityBucket: InstrumentWithPricing["maturityBucket"];
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
  createdAt: string;
  updatedAt: string;
  evaluatedPrice?: ApiEvaluatedPrice | null;
};

function parseDate(value: string | Date | undefined): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  return new Date(value);
}

function mapCurveSource(source: ApiCurveSource): CurveSource {
  return {
    sourceUrl: source.sourceUrl,
    sourceHash: source.sourceHash,
    ingestedAt: parseDate(source.ingestedAt),
    ingestedBy: source.ingestedBy,
  };
}

function mapEvaluatedPrice(price: ApiEvaluatedPrice): EvaluatedPrice {
  return {
    cusip: price.cusip,
    asOfDate: parseDate(price.asOfDate),
    cleanPrice: Number(price.cleanPrice),
    dirtyPrice: Number(price.dirtyPrice),
    accruedInterest: Number(price.accruedInterest),
    yieldToMaturity: Number(price.yieldToMaturity),
    modifiedDuration: Number(price.modifiedDuration),
    dv01: Number(price.dv01),
    pricingModelVersion: price.pricingModelVersion,
    curveSource: mapCurveSource(price.curveSource),
    computedAt: parseDate(price.computedAt),
  };
}

function mapInstrument(api: ApiInstrument): InstrumentWithPricing {
  return {
    cusip: api.cusip,
    name: api.name,
    ticker: api.ticker,
    type: api.type,
    coupon: Number(api.coupon),
    issueDate: parseDate(api.issueDate),
    maturityDate: parseDate(api.maturityDate),
    couponFrequency: Number(api.couponFrequency),
    dayCount: api.dayCount,
    maturityBucket: api.maturityBucket,
    issuedAmount: Number(api.issuedAmount),
    outstandingAmount: Number(api.outstandingAmount),
    currency: api.currency,
    standardPoorRating: api.standardPoorRating,
    moodyRating: api.moodyRating,
    fitchRating: api.fitchRating,
    dbrsRating: api.dbrsRating,
    bloombergCompositeRating: api.bloombergCompositeRating,
    series: api.series,
    maturityType: api.maturityType,
    announce: api.announce,
    createdAt: parseDate(api.createdAt),
    updatedAt: parseDate(api.updatedAt),
    evaluatedPrice: api.evaluatedPrice ? mapEvaluatedPrice(api.evaluatedPrice) : null,
  };
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export async function fetchCurveDates(): Promise<Date[]> {
  const result = await fetchJson<{ dates: string[] }>(`/api/views/curves/dates`);
  return (result.dates || []).map((date) => parseDate(date));
}

export async function fetchYieldCurve(asOfDate?: Date): Promise<YieldCurve> {
  const query = new URLSearchParams();
  if (asOfDate) {
    query.set("asOfDate", asOfDate.toISOString().slice(0, 10));
  }
  const result = await fetchJson<ApiCurve>(`/api/views/curves?${query.toString()}`);
  return {
    asOfDate: parseDate(result.asOfDate),
    curvePoints: result.curvePoints || [],
    source: mapCurveSource(result.source),
  };
}

export async function fetchMarketGrid(params: {
  asOfDate?: Date;
  types?: string[];
  buckets?: string[];
  maturityFrom?: string;
  maturityTo?: string;
  couponMin?: number;
  couponMax?: number;
  cusip?: string;
}): Promise<{ asOfDate: Date; instruments: InstrumentWithPricing[]; curveSource?: CurveSource }> {
  const query = new URLSearchParams();
  if (params.asOfDate) query.set("asOfDate", params.asOfDate.toISOString().slice(0, 10));
  if (params.types?.length) query.set("types", params.types.join(","));
  if (params.buckets?.length) query.set("buckets", params.buckets.join(","));
  if (params.maturityFrom) query.set("maturityFrom", params.maturityFrom);
  if (params.maturityTo) query.set("maturityTo", params.maturityTo);
  if (params.couponMin !== undefined) query.set("couponMin", String(params.couponMin));
  if (params.couponMax !== undefined) query.set("couponMax", String(params.couponMax));
  if (params.cusip) query.set("cusip", params.cusip);

  const result = await fetchJson<{
    asOfDate: string;
    instruments: ApiInstrument[];
    curveSource?: ApiCurveSource;
  }>(`/api/views/market-grid?${query.toString()}`);

  return {
    asOfDate: parseDate(result.asOfDate),
    instruments: (result.instruments || []).map(mapInstrument),
    curveSource: result.curveSource ? mapCurveSource(result.curveSource) : undefined,
  };
}

export async function fetchInstruments(params: {
  asOfDate?: Date;
  types?: string[];
  buckets?: string[];
  maturityFrom?: string;
  maturityTo?: string;
  couponMin?: number;
  couponMax?: number;
  cusip?: string;
  limit?: number;
  offset?: number;
}): Promise<{ asOfDate: Date; instruments: InstrumentWithPricing[] }> {
  const query = new URLSearchParams();
  if (params.asOfDate) query.set("asOfDate", params.asOfDate.toISOString().slice(0, 10));
  if (params.types?.length) query.set("types", params.types.join(","));
  if (params.buckets?.length) query.set("buckets", params.buckets.join(","));
  if (params.maturityFrom) query.set("maturityFrom", params.maturityFrom);
  if (params.maturityTo) query.set("maturityTo", params.maturityTo);
  if (params.couponMin !== undefined) query.set("couponMin", String(params.couponMin));
  if (params.couponMax !== undefined) query.set("couponMax", String(params.couponMax));
  if (params.cusip) query.set("cusip", params.cusip);
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.offset !== undefined) query.set("offset", String(params.offset));

  const result = await fetchJson<{ asOfDate: string; instruments: ApiInstrument[] }>(
    `/api/views/instruments?${query.toString()}`
  );
  return {
    asOfDate: parseDate(result.asOfDate),
    instruments: (result.instruments || []).map(mapInstrument),
  };
}

export async function fetchInstrumentDetail(cusip: string, asOfDate?: Date): Promise<InstrumentWithPricing | null> {
  const query = new URLSearchParams();
  if (asOfDate) query.set("asOfDate", asOfDate.toISOString().slice(0, 10));
  const result = await fetchJson<{ instrument: ApiInstrument }>(
    `/api/views/instruments/${cusip}?${query.toString()}`
  );
  if (!result?.instrument) {
    return null;
  }
  return mapInstrument(result.instrument);
}

export async function fetchEvaluatedPricing(cusip: string, asOfDate?: Date): Promise<EvaluatedPrice> {
  const query = new URLSearchParams();
  if (asOfDate) query.set("asOfDate", asOfDate.toISOString().slice(0, 10));
  const result = await fetchJson<ApiEvaluatedPrice>(
    `/api/views/pricing/${cusip}?${query.toString()}`
  );
  return mapEvaluatedPrice(result);
}

export async function fetchPricingHistory(cusip: string, limit = 10): Promise<EvaluatedPrice[]> {
  const query = new URLSearchParams({ limit: String(limit) });
  const result = await fetchJson<{ history: ApiEvaluatedPrice[] }>(
    `/api/views/pricing/${cusip}/history?${query.toString()}`
  );
  return (result.history || []).map(mapEvaluatedPrice);
}

export async function fetchMarketDataSummary(): Promise<MarketDataSummary> {
  const summary = await fetchJson<{
    totalInstruments: number;
    billCount: number;
    noteCount: number;
    bondCount: number;
    tipsCount: number;
    bucketCounts: Record<string, number>;
    latestCurveDate: string;
  }>(`/api/views/marketdata/summary`);

  const dates = await fetchCurveDates();

  return {
    totalInstruments: Number(summary.totalInstruments ?? 0),
    billCount: Number(summary.billCount ?? 0),
    noteCount: Number(summary.noteCount ?? 0),
    bondCount: Number(summary.bondCount ?? 0),
    tipsCount: Number(summary.tipsCount ?? 0),
    bucketCounts: summary.bucketCounts || {},
    availableCurveDates: dates,
    latestCurveDate: summary.latestCurveDate ? parseDate(summary.latestCurveDate) : null,
  };
}
