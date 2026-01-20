# Market Data + Evaluated Pricing Implementation Specification

> **Market Data & Evaluated Pricing System** for instrument master data, yield curve ingestion, evaluated pricing, and risk metrics computation in Instant.

---

## 1. Overview

The Market Data + Evaluated Pricing system enables advisors to:

- Manage instrument master data (UST securities: bills, notes, bonds, TIPS)
- Ingest and manage yield curve data (EOD par yields by tenor)
- Compute evaluated prices and yields for instruments
- Calculate risk metrics (duration, DV01) for instruments
- View market grid with pricing and analytics
- Visualize yield curves by date
- Access instrument details and pricing history

**Core Principle**: All pricing is "evaluated" (not market quotes). Pricing is derived from yield curves and instrument cashflows, computed deterministically. All UI must label prices/yields as "Evaluated" and show as-of date and curve source.

**Scope**: US Treasuries only (bills, notes, bonds, TIPS). End-of-day (EOD) data. No real-time market quotes.

---

## 2. Core Features

### 2.1 Instrument Master Data (`/app/marketdata/instruments`)

**Purpose**: View UST instrument master data (ingested via `data/` scripts).

#### Instrument List View

- **Table Columns**:
  - CUSIP (unique identifier, link to detail)
  - Name/Description
  - Type (bill/note/bond/tips badge)
  - Maturity Date
  - Coupon Rate
  - Maturity Bucket (0-2y, 2-5y, 5-10y, 10-20y, 20y+)
  - Evaluated Price (as-of selected date)
  - Evaluated Yield (as-of selected date)
- **Filters**:
  - Instrument Type (bill, note, bond, tips)
  - Maturity Bucket (0-2y, 2-5y, 5-10y, 10-20y, 20y+)
  - Maturity Date Range (from/to dates)
  - CUSIP (search)
- **Actions**:
  - View Instrument Detail
  - Export instrument list (CSV)
  - As-of Date Selector (global, affects all prices/yields)

#### Instrument Detail View (`/app/marketdata/instruments/:cusip`)

- **Instrument Information**:
  - CUSIP (unique identifier)
  - Name/Description
  - Type (bill, note, bond, tips)
  - Issue Date
  - Maturity Date
  - Coupon Rate
  - Coupon Frequency (payments per year)
  - Day Count Convention
  - Maturity Bucket (computed from maturity date)
- **Pricing Information** (as-of selected date):
  - Evaluated Clean Price
  - Evaluated Dirty Price
  - Accrued Interest
  - Evaluated Yield to Maturity
  - Evaluated Yield Source (curve source, as-of date)
- **Risk Metrics** (as-of selected date):
  - Modified Duration
  - DV01 (dollar duration)
  - Convexity (optional, future enhancement)
- **Rating Information** (if available):
  - S&P Rating
  - Moody's Rating
  - Fitch Rating
  - DBRS Rating
  - Bloomberg Composite Rating
- **Issue Information**:
  - Issued Amount
  - Outstanding Amount
  - Currency
  - Series
- **Pricing History** (optional):
  - Historical evaluated prices by date
  - Price chart (time series)
- **Actions**:
  - Change as-of date (time-travel pricing)
  - View yield curve (for as-of date)
  - View positions (link to PMS account positions)

#### Instrument Ingestion

- **Data ingestion**: Handled by scripts in `data/` directory (`ingest_security_data.py`)
- **No UI ingestion needed**: Instruments are loaded directly into database via scripts

---

### 2.2 Yield Curve Management (`/app/marketdata/curves`)

**Purpose**: Manage yield curve data and view curve visualizations.

#### Curve Viewer

- **Yield Curve Chart**:
  - X-axis: Tenor (time to maturity)
  - Y-axis: Par Yield (percentage)
  - Line chart showing yield curve
  - Tooltips showing exact tenor/yield values
- **As-of Date Selector**:
  - Date picker with quick options (Today, Yesterday, Last Week, Custom)
  - Dropdown showing available curve dates
  - Visual indicator: "Viewing curve as-of: [date]"
- **Curve Information**:
  - As-of Date
  - Source metadata (file name, URL, hash)
  - Ingestion timestamp
  - Number of curve points
  - Curve point list (table): Tenor, Par Yield
- **Actions**:
  - Select different as-of date
  - Export curve data (CSV)
  - View curve history (multiple dates on same chart, optional)

#### Curve Ingestion

- **Data ingestion**: Handled by scripts in `data/` directory (`ingest_yield_curves_fred.py`)
- **No UI ingestion needed**: Yield curves are loaded directly into database via scripts

#### Curve History (optional)

- View multiple curves on same chart (compare curves across dates)
- Curve evolution over time (animation, optional)
- Curve point changes (diff view)

---

### 2.3 Market Grid (`/app/marketdata/pricing`)

**Purpose**: Comprehensive view of all instruments with evaluated pricing and risk metrics.

#### Market Grid Table

- **Columns**:
  - CUSIP (link to instrument detail)
  - Name/Description
  - Type (bill/note/bond/tips)
  - Maturity Date
  - Coupon Rate (%)
  - **Evaluated Price** (clean price, as-of date)
  - **Evaluated Yield** (YTM %, as-of date)
  - Modified Duration (years)
  - DV01 (dollars per $100 par)
  - Maturity Bucket
- **Filters**:
  - Instrument Type
  - Maturity Bucket
  - Maturity Date Range
  - Coupon Range (min/max)
  - CUSIP Search
- **Sorting**:
  - Sortable by any column
  - Default sort: Maturity Date
- **Grouping Options** (optional):
  - Group by Type
  - Group by Maturity Bucket
- **As-of Date Selector**:
  - Global selector affects all prices/yields
  - Shows "All prices/yields evaluated as-of: [date]"
  - Shows curve source metadata

#### Grid Information Header

- **Selected As-of Date**: Prominently displayed
- **Curve Source**: Source metadata (file, URL, hash)
- **Last Updated**: When curve was ingested
- **Instrument Count**: Total instruments shown

#### Actions

- **Export**: Export grid to CSV (with current filters/sorting)
- **View Instrument Detail**: Click CUSIP → navigate to instrument detail
- **View Curve**: Link to curve viewer for selected as-of date
- **Change As-of Date**: Update all prices/yields

---

### 2.4 Evaluated Pricing Service

**Purpose**: Compute evaluated prices, yields, and risk metrics for instruments.

#### Pricing Inputs

- **Yield Curve**: Par yields by tenor (from MarketDataDay)
- **Instrument Cashflows**:
  - Coupon payments (dates and amounts)
  - Principal repayment (maturity date)
  - Day count convention
- **As-of Date**: Market date for pricing

#### Pricing Algorithm

1. **Yield Curve Interpolation**:

   - Interpolate yield for instrument's maturity from curve points
   - Use linear interpolation or spline (deterministic method)
   - Handle edge cases (beyond curve range)
2. **Cashflow Discounting**:

   - Generate all future cashflows (coupons + principal)
   - Discount each cashflow to present value using interpolated yield
   - Sum discounted cashflows
3. **Price Calculation**:

   - **Clean Price**: Discounted cashflows / 100 (per $100 par)
   - **Dirty Price**: Clean price + accrued interest
   - **Accrued Interest**: Calculate based on day count convention and last coupon date
4. **Yield Calculation**:

   - **Yield to Maturity**: Solve for YTM that equates dirty price to discounted cashflows
   - Iterative solver (Newton-Raphson or similar, deterministic)
5. **Risk Metrics**:

   - **Modified Duration**: Weighted average time to cashflows, modified by (1 + yield)
   - **DV01**: Price sensitivity to 1bp yield change = Modified Duration × Price × 0.0001

#### Pricing Outputs

- **Clean Price** (decimal, per $100 par)
- **Dirty Price** (decimal, per $100 par)
- **Accrued Interest** (decimal)
- **Yield to Maturity** (decimal, percentage)
- **Modified Duration** (decimal, years)
- **DV01** (decimal, dollars per $100 par)

#### Determinism Requirements

- Pricing must be deterministic (same inputs → same outputs)
- Use fixed interpolation method
- Use fixed solver parameters (tolerance, max iterations)
- Store pricing model version

#### Pricing Computation

- Pricing computed on-demand (no events needed)
- Results can be cached by (instrumentId, asOfDate) for performance

---

### 2.5 As-of Date Management

**Purpose**: Manage market date selection for time-travel pricing.

#### As-of Date Selector (Global Component)

- **Location**: Header/toolbar (available on all market data pages)
- **UI**: Date picker with quick options:
  - Today
  - Yesterday
  - Last Week
  - Last Month
  - Custom date picker
- **Behavior**:
  - Changing as-of date updates all prices/yields on current page
  - Selected date persisted (localStorage or URL param)
  - Available dates limited to dates with ingested curves
- **Visual Indicator**:
  - Prominently displayed: "Pricing as-of: [date]"
  - Shows curve source metadata

#### As-of Date Selection

- **Available Dates**: List of dates with ingested yield curves
- **Default**: Most recent date (or current date if available)
- **Time-Travel**: Users can select historical dates to see historical pricing

#### As-of Date Selection

- As-of date is UI state only (no events needed)
- Selected date stored in localStorage or URL params

---

## 3. Data Models

### 3.1 Instrument (Prisma model)

- `cusip` (string, PK, unique)
- `name` (string, instrument description)
- `ticker` (string, nullable)
- `type` (enum: bill, note, bond, tips)
- `coupon` (decimal, annual coupon rate, 0 for bills)
- `issueDate` (date)
- `maturityDate` (date)
- `couponFrequency` (integer, payments per year: 0 for bills, 2 for notes/bonds)
- `dayCount` (string, day count convention, e.g., "ACT/ACT", "30/360")
- `askModifiedDuration` (decimal, nullable - may be pre-computed)
- `bidModifiedDuration` (decimal, nullable)
- `askYieldToMaturity` (decimal, nullable - market data, not evaluated)
- `askPrice` (decimal, nullable - market data, not evaluated)
- `maturityType` (string, e.g., "NORMAL")
- `issuedAmount` (bigint, total issued)
- `outstandingAmount` (bigint, outstanding)
- `currency` (string, default "USD")
- `standardPoorRating` (string, nullable)
- `moodyRating` (string, nullable)
- `fitchRating` (string, nullable)
- `dbrsRating` (string, nullable)
- `series` (string, nullable)
- `bloombergCompositeRating` (string, nullable)
- `announce` (string, nullable, announcement date)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

**Computed Fields** (not stored, computed on demand):

- `maturityBucket` (string: "0-2y", "2-5y", "5-10y", "10-20y", "20y+")
- Computed from maturity date and current date

### 3.2 YieldCurve (Prisma model)

- `id` (UUID, PK)
- `asOfDate` (date, market date)
- `tenor` (string, e.g., "1M", "3M", "6M", "1Y", "2Y", "3Y", "5Y", "7Y", "10Y", "20Y", "30Y")
- `parYield` (decimal, par yield percentage)
- `ingestedAt` (timestamp, when curve was ingested)

**Unique Constraint**: `(asOfDate, tenor)` - one yield per tenor per date

**Indexes**:

- `asOfDate` (for efficient date queries)

### 3.3 Yield Curve Query (computed on-demand)

- Query `YieldCurve` table grouped by `asOfDate` to get curve points
- No projection needed - just query the table directly
- Returns array of `{tenor, parYield}` for a given `asOfDate`

### 3.4 EvaluatedPrice (computed, not persisted)

- `instrumentId` (UUID, or CUSIP)
- `asOfDate` (date)
- `cleanPrice` (decimal, per $100 par)
- `dirtyPrice` (decimal, per $100 par)
- `accruedInterest` (decimal)
- `yieldToMaturity` (decimal, percentage)
- `modifiedDuration` (decimal, years)
- `dv01` (decimal, dollars per $100 par)
- `pricingModelVersion` (string)
- `curveSource` (JSON, metadata about curve used)
- `computedAt` (timestamp)

**Note**: Evaluated prices are computed on-demand or cached, but not persisted as primary data (derived from curves + instruments).

### 3.5 Market Data (No Events)

Market data is ingested via scripts and stored directly in database tables. No event sourcing needed - this is a read-only viewer system.

---

## 4. User Flows

### 4.1 Ingest Yield Curve

1. Navigate to `/app/marketdata/curves`
2. Click "Import Curve" or "Upload Curve"
3. Select as-of date (market date for curve)
4. Upload CSV/JSON file with curve points (tenor, parYield)
5. Preview parsed curve data
6. Validate curve (check for required tenors, valid yields)
7. Click "Import"
8. System ingests curve, emits `MarketDataCurveIngested` event
9. Curve available for pricing as-of selected date

### 4.2 View Market Grid

1. Navigate to `/app/marketdata/pricing`
2. View market grid with all instruments
3. Apply filters (type, maturity bucket, date range)
4. Change as-of date selector → all prices/yields update
5. Sort by column (e.g., maturity date, yield)
6. Click CUSIP → navigate to instrument detail

### 4.3 View Instrument Detail

1. Navigate to instrument detail (from grid, search, or direct link)
2. View instrument information (CUSIP, type, maturity, coupon)
3. View evaluated pricing (clean/dirty price, yield, as-of date)
4. View risk metrics (duration, DV01)
5. Change as-of date → pricing updates for historical date
6. View pricing history (optional chart)
7. Click "View Curve" → navigate to curve viewer for as-of date

### 4.4 View Yield Curve

1. Navigate to `/app/marketdata/curves`
2. Select as-of date (default: most recent)
3. View yield curve chart (tenor vs. par yield)
4. Hover over curve points to see exact values
5. View curve point table (tenor, par yield)
6. Change as-of date → view different curve
7. Export curve data (CSV)

### 4.5 Search Instrument

1. Navigate to `/app/marketdata/instruments` or use global search
2. Enter CUSIP or instrument name
3. View filtered results
4. Click instrument → navigate to detail

---

## 5. Technical Requirements

### 5.1 Data Ingestion

- Instruments and yield curves are ingested via scripts in `data/` directory
- No event sourcing needed for market data (read-only viewer)
- Data is loaded directly into database tables via Python scripts

### 5.2 Deterministic Pricing

- Pricing must be deterministic (same inputs → same outputs)
- Use fixed interpolation method (linear or spline)
- Use fixed solver parameters (tolerance, max iterations)
- Store pricing model version in computed prices
- No randomness in calculations

### 5.3 Yield Curve Interpolation

- Interpolate yield for instrument maturity from curve points
- Handle edge cases:
  - Maturity before shortest tenor: extrapolate or use shortest tenor
  - Maturity after longest tenor: extrapolate or use longest tenor
- Method must be deterministic and documented

### 5.4 Cashflow Generation

- Generate all future cashflows for instrument:
  - Coupon payments (based on coupon frequency, issue date, maturity)
  - Principal repayment (at maturity)
- Handle day count conventions (ACT/ACT, 30/360, etc.)
- Handle bills (zero coupon): only principal cashflow

### 5.5 Price Calculation

- **Clean Price**: Present value of cashflows (discounted by yield) / 100
- **Dirty Price**: Clean price + accrued interest
- **Accrued Interest**: Calculate based on day count and last coupon date
- **Yield to Maturity**: Solve iteratively (Newton-Raphson or similar)

### 5.6 Risk Metrics Calculation

- **Modified Duration**:
  - Macaulay duration / (1 + yield)
  - Macaulay duration = weighted average time to cashflows
- **DV01**: Modified Duration × Price × 0.0001 (dollars per $100 par)

### 5.7 Maturity Bucket Assignment

- Compute maturity bucket from maturity date and current date:
  - 0-2y: maturity within 2 years
  - 2-5y: maturity between 2 and 5 years
  - 5-10y: maturity between 5 and 10 years
  - 10-20y: maturity between 10 and 20 years
  - 20y+: maturity 20+ years
- Use as-of date for bucket calculation (time-travel support)

### 5.8 Performance

- Market grid must load < 2s (with all instruments)
- Instrument detail must load < 1s
- Curve viewer must load < 1s
- Pricing computation must complete < 100ms per instrument
- Efficient caching of evaluated prices (cache by instrument + as-of date)

### 5.9 Data Validation

- CUSIP uniqueness validation
- Maturity date must be after issue date
- Coupon rate must be >= 0
- Par yields must be positive
- Required curve points validation
- Required instrument fields validation

---

## 6. Integration Points

### 6.1 PMS Integration

- Instrument lookup for positions (CUSIP → instrument details)
- Pricing for portfolio valuation (evaluated prices for positions)
- Risk metrics for portfolio analytics (duration, DV01 aggregation)
- Maturity buckets for portfolio targets (bucket weights)

### 6.2 OMS Integration

- Instrument lookup for order creation (CUSIP → instrument details)
- Pricing for order valuation (estimated order value)
- Pricing display in order detail

### 6.3 EMS Integration

- Pricing for execution simulation (baseline mid price)
- Curve data for CURVE_RELATIVE orders
- Maturity buckets for liquidity profiles

### 6.4 Compliance Integration

- Instrument data for position-level compliance rules
- Pricing for market value calculations in compliance rules

---

## 7. Mock Data Requirements

For initial development, provide:

- 50-100 sample instruments:
  - Mix of types (bills, notes, bonds, TIPS)
  - Mix of maturities (distributed across buckets)
  - Mix of coupons (0% for bills, various for notes/bonds)
- 5-10 sample yield curves (different as-of dates):
  - Standard tenors (1M, 3M, 6M, 1Y, 2Y, 3Y, 5Y, 7Y, 10Y, 20Y, 30Y)
  - Realistic yield curves (upward sloping, inverted, flat)
- Sample evaluated prices for instruments (for most recent as-of date)
- Sample risk metrics (duration, DV01) for instruments

---

## 8. UI/UX Considerations

### 8.1 Pricing Labeling

- **All prices must be labeled**: "Evaluated Price" (not just "Price")
- **All yields must be labeled**: "Evaluated Yield" (not just "Yield")
- **As-of date must be prominent**: Show "Pricing as-of: [date]" clearly
- **Curve source must be visible**: Show curve source metadata (file, date ingested)

### 8.2 Market Grid

- Virtual scrolling for large instrument sets (if > 1000 instruments)
- Sortable columns
- Persistent filter state (URL params or local storage)
- Export functionality (CSV)
- Clear visual distinction between evaluated pricing and market data (if both shown)

### 8.3 Curve Viewer

- Interactive chart (zoom, pan, hover tooltips)
- Clear axis labels (Tenor, Par Yield %)
- Tooltips showing exact values
- Responsive chart (works on different screen sizes)

### 8.4 Instrument Detail

- Clear section separation (Information, Pricing, Risk Metrics)
- As-of date selector prominently displayed
- Pricing clearly labeled as "Evaluated"
- Historical pricing chart (if implemented)

### 8.5 As-of Date Selector

- Global component (available on all market data pages)
- Quick options (Today, Yesterday, etc.)
- Date picker for custom dates
- Visual indicator of selected date
- Disabled dates (dates without curves)

### 8.6 State Management

- As-of date state (global, affects all pricing)
- Filter state persistence
- Loading states for pricing computation (if async)
- Error handling (missing curve, invalid instrument)

---

## 9. Edge Cases & Error Handling

### 9.1 Missing Yield Curve

- If no curve exists for selected as-of date:
  - Show error message
  - Disable pricing columns
  - Suggest selecting different as-of date
  - Show available dates

### 9.2 Instrument Beyond Curve Range

- If instrument maturity is beyond curve's longest tenor:
  - Extrapolate yield (use longest tenor) OR
  - Show warning and use longest tenor yield
  - Document extrapolation method

### 9.3 Invalid Instrument Data

- Handle missing required fields gracefully
- Validate CUSIP format
- Validate date ranges (maturity > issue date)
- Show validation errors clearly

### 9.4 Pricing Calculation Errors

- Handle edge cases (bills, zero coupon)
- Handle invalid yields (negative, extreme values)
- Return error if pricing cannot be computed
- Log errors for debugging

### 9.5 Curve Ingestion Errors

- Handled by ingestion scripts in `data/` directory
- No UI validation needed (scripts handle validation)

### 9.6 Missing Instrument Data

- Handle missing optional fields (ratings, etc.)
- Show "N/A" or "-" for missing data
- Don't block pricing calculation for missing optional fields

---

## 10. Future Enhancements (Out of Scope)

- Real-time market quotes integration (out of scope: EOD only)
- Corporate bonds / munis / swaps (out of scope: UST only)
- Multiple currency support (out of scope: USD only)
- Advanced risk metrics (convexity, key rate duration)
- Curve analytics (curve slope, curvature, spread analysis)
- Historical curve comparison (multiple curves on same chart)
- Pricing alerts (notify when prices change significantly)
- Instrument search by characteristics (advanced filters)
- Bulk pricing export (export evaluated prices for date range)
- Pricing API (external API for pricing queries)

---

## 11. Simplified Implementation (No Event Sourcing)

### Overview

Market data is a **read-only viewer** system. Data is ingested via scripts in `data/` directory and stored directly in database tables. No event sourcing patterns needed.

### Schema

- **File**: `client/prisma/schema/data.prisma`
- `Instrument` model - stores instrument master data
- `YieldCurve` model - stores yield curve points by date/tenor

### Query Handlers Only

**Files**: `services/api/handlers/marketdata_queries.go`

- `GET /api/views/instruments` - List all instruments (with filters)
- `GET /api/views/instruments/:cusip` - Get instrument detail
- `GET /api/views/curves` - Get yield curve for as-of date
- `GET /api/views/market-grid` - Get instruments with evaluated pricing
- `GET /api/views/pricing/:cusip` - Get evaluated pricing for instrument (as-of date)

### Pricing Service

**Files**: `services/api/services/pricing/pricing.go`

- **Evaluated Price Calculation**: Compute prices/yields/risk metrics on-demand
- **Caching**: Cache results by (instrumentId, asOfDate) for performance
- **No events**: Pricing is computed synchronously when requested

### Frontend Integration

**Files**: `client/app/app/marketdata/**/*.tsx`

- Replace mock data with API calls to query handlers
- Display instruments, curves, and evaluated pricing
- As-of date selector (UI state only, no backend events)

### Data Ingestion

- **Instruments**: `data/ingest_security_data.py` → Direct database insert
- **Yield Curves**: `data/ingest_yield_curves_fred.py` → Direct database insert
- **No command handlers needed**: Ingestion happens via scripts, not UI

---
