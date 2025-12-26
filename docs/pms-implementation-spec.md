# PMS Implementation Specification

> **Portfolio Management System** for managing holdings, targets, optimization, and trade proposals in Instant.

---

## 1. Overview

The PMS enables advisors to:
- View and manage client portfolios (households and accounts)
- Create reusable portfolio models/strategies
- Assign accounts to models for consistent management
- Configure portfolio targets (duration, bucket weights)
- Monitor portfolio drift from targets
- Run optimization to generate trade proposals (single or bulk)
- Automate rebalancing based on drift thresholds or schedules
- Review and approve proposals before sending to OMS

**Core Principle**: All portfolio state is derived from events. Holdings are computed from executions, proposals are time-stamped and versioned.

---

## 2. Core Features

### 2.1 Household & Account Management

#### Household List (`/app/pms/households`)
- **Table Columns**:
  - Household Name
  - Account Count
  - Total Market Value (as-of date)
  - Last Activity (date of last order/execution)
- **Actions**:
  - Search/filter by name
  - Click row → navigate to household detail
  - Create new household

#### Household Detail (`/app/pms/households/:id`)
- **Household Information**:
  - Client name
  - Created date
  - Account count
- **Accounts List**:
  - Account name, account type, market value
  - Click to navigate to account detail
- **Aggregated Positions**:
  - All positions across household accounts
  - Columns: CUSIP, Total Quantity, Avg Cost, Market Value, Duration, DV01
- **Aggregated Analytics**:
  - Total Duration (portfolio-weighted)
  - Total DV01
  - Total Market Value
  - Cash Balance
- **Controls**:
  - As-of date selector (time-travel)
  - "Add Account" button
  - "Run Optimization" button (scope: household)

#### Account List (`/app/pms/accounts`)
- **Table Columns**:
  - Account Name
  - Household
  - Market Value (as-of date)
  - Duration
  - Last Activity
- **Actions**:
  - Filter by household
  - Search by account name
  - Click row → navigate to account detail

#### Account Detail (`/app/pms/accounts/:id`)
- **Account Information**:
  - Account name, account type
  - Parent household
  - Created date
- **Cash Balance**:
  - Current cash (as-of date)
  - Cash history (optional chart)
- **Positions Table**:
  - Columns: CUSIP, Instrument Description, Quantity, Avg Cost, Market Value, Duration, DV01
  - Sortable by any column
  - Click CUSIP → navigate to instrument detail (market data)
- **Portfolio Analytics**:
  - Total Duration (portfolio-weighted)
  - Total DV01
  - Total Market Value
  - Cash as % of portfolio
- **Controls**:
  - As-of date selector (time-travel)
  - "Run Optimization" button (scope: account)

---

### 2.2 Portfolio Models (`/app/pms/models`)

**Purpose**: Reusable portfolio model definitions that can be assigned to accounts.

**Sub-routes**:
- `/app/pms/models` - Model library (list of all models)
- `/app/pms/models/:id` - Model detail (edit, view assigned accounts)

**Key Components**: See section 2.5 below.

---

### 2.3 Target Configuration (`/app/pms/targets`)

#### Target Scope
- Targets can be set at:
  - **Account level**: Applies to single account
  - **Household level**: Applies to all accounts in household (override account-level)

#### Target Parameters
- **Duration Target**:
  - Target duration (years, decimal)
  - Tolerance range (optional)
- **Bucket Weights**:
  - Maturity buckets: 0-2y, 2-5y, 5-10y, 10-20y, 20y+
  - Target weight for each bucket (must sum to 100%)
  - Tolerance per bucket (optional)
- **Constraints**:
  - Min/max position sizes (per CUSIP or total)
  - Max turnover (optional)
  - Restricted instruments (blacklist)

#### UI Components
- Scope selector (Account / Household dropdown)
- Account/Household selector
- Target form with validation
- Save/Cancel actions
- View existing targets (table/list)

---

### 2.4 Optimization (`/app/pms/optimization`)

#### Optimization Inputs
- **Scope Selection**:
  - Account or Household
  - Specific account/household ID
- **Target Configuration**:
  - Duration target
  - Bucket weight targets
  - Can use existing saved targets or enter ad-hoc
- **Constraints**:
  - Min/max trade sizes
  - Liquidity constraints (optional)
  - Max number of trades (optional)

#### Optimization Execution
- **Run Optimization** button:
  - Triggers optimization algorithm
  - Shows progress indicator
  - Returns proposal with:
    - List of proposed trades (buy/sell, CUSIP, quantity)
    - Predicted analytics delta (duration change, DV01 change)
    - Assumptions/explanations

#### Proposal Preview
- **Proposed Trades Table**:
  - Side (Buy/Sell), CUSIP, Quantity, Estimated Price, Estimated Value
  - Grouped by instrument
- **Predicted Analytics**:
  - Current vs. Target Duration
  - Current vs. Target Bucket Weights
  - Delta (change) for each metric
- **Actions**:
  - Approve → creates proposal, navigates to proposal detail
  - Reject → discards proposal
  - Adjust Targets → returns to inputs

---

### 2.5 Proposal Management (`/app/pms/proposals/:id`)

**Sub-routes**:
- `/app/pms/proposals/:id` - Proposal detail view
- `/app/pms/proposals` - Proposal list view (optional)

#### Proposal Detail View
- **Proposal Metadata**:
  - Proposal ID, created date, created by
  - Scope (Account/Household), target account/household ID
  - Status (DRAFT, APPROVED, REJECTED, SENT_TO_OMS)
- **Proposed Trades**:
  - Complete list with instrument details
  - Estimated prices (evaluated pricing as-of date)
  - Estimated total value
- **Analytics Comparison**:
  - Side-by-side: Current vs. Proposed
  - Metrics: Duration, DV01, Bucket Weights, Market Value
  - Delta visualization (bar chart or diff view)
- **Assumptions & Explanations**:
  - Optimization algorithm parameters
  - Pricing assumptions (yield curve date)
  - Constraints applied
  - Why specific trades were chosen
- **Actions** (by status):
  - **DRAFT**: Approve, Reject, Edit (returns to optimization)
  - **APPROVED**: Send to OMS, Reject
  - **SENT_TO_OMS**: View in OMS (link), Cannot modify

#### Proposal List View

- Table of all proposals
- Filter by status, account, household, date range
- Quick actions (approve/reject from list)

---

**Note**: Portfolio Models are covered in section 2.2 above. Detailed feature description:

#### Portfolio Models / Strategies

**Purpose**: Reusable portfolio model definitions that can be assigned to accounts for consistent management.

#### Model Library
- **Model List**:
  - Table: Model Name, Description, Target Duration, Target Buckets, Assigned Accounts Count, Last Updated
  - Search/filter by name
  - Click to view/edit model
  - Create new model

#### Model Definition
- **Model Information**:
  - Model name, description
  - Created date, last updated
- **Target Configuration**:
  - Duration target
  - Bucket weight targets
  - Constraints (same as Portfolio Target)
- **Assigned Accounts**:
  - List of accounts using this model
  - Quick actions: Unassign account, Bulk assign
- **Actions**:
  - Edit model (updates all assigned accounts' targets)
  - Duplicate model
  - Delete model (requires unassigning all accounts first)

#### Model Assignment
- Assign account to model from:
  - Account detail page
  - Model detail page (bulk assign)
  - Account list (bulk assign)
- When assigned, account inherits model's targets
- Account can override model targets (account-level target takes precedence)

---

### 2.6 Portfolio Drift Monitoring (`/app/pms/drift`)

**Sub-routes**:
- `/app/pms/drift` - Drift dashboard
- `/app/pms/drift/:accountId` - Account drift detail (optional)

**Purpose**: Monitor how far portfolios deviate from their targets.

#### Drift Dashboard
- **Drift Summary Cards**:
  - Accounts out of tolerance (count)
  - Average drift % (duration, bucket weights)
  - Accounts requiring rebalancing (drift > threshold)
- **Drift Table**:
  - Columns: Account/Household, Model (if assigned), Current Duration, Target Duration, Drift %, Bucket Drift, Last Rebalanced
  - Sortable by drift amount
  - Filter by: Drift threshold, Model, Household
  - Color coding: Green (in tolerance), Yellow (warning), Red (out of tolerance)
- **Drift Details**:
  - Click account → view detailed drift breakdown
  - Shows per-bucket drift
  - Shows duration drift
  - Historical drift chart (optional)

#### Drift Calculation
- **Duration Drift**: `|currentDuration - targetDuration| / targetDuration`
- **Bucket Drift**: `|currentWeight - targetWeight|` per bucket
- **Overall Drift**: Weighted combination of duration and bucket drifts
- Computed as-of selected date (time-travel support)

---

### 2.7 Automated Rebalancing (`/app/pms/rebalancing`)

**Sub-routes**:
- `/app/pms/rebalancing` - Rebalancing rules and queue
- `/app/pms/rebalancing/rules` - Rule configuration (optional separate route)
- `/app/pms/rebalancing/history` - Rebalancing history (optional)

**Purpose**: Automatically trigger rebalancing based on rules and thresholds.

#### Rebalancing Rules
- **Rule Types**:
  - **Drift-based**: Trigger when drift exceeds threshold (e.g., duration drift > 5%)
  - **Time-based**: Trigger on schedule (e.g., monthly, quarterly)
  - **Event-based**: Trigger after specific events (e.g., after large cash deposit)
- **Rule Configuration**:
  - Scope: Account, Household, or All accounts
  - Model filter: Apply only to accounts assigned to specific model
  - Threshold: Drift percentage that triggers rebalancing
  - Schedule: Cron expression for time-based rules
  - Auto-approve: Automatically approve proposals (or require manual approval)

#### Rebalancing Queue
- **Pending Rebalancing**:
  - List of accounts/households that need rebalancing
  - Shows reason (drift threshold, schedule, etc.)
  - Shows last rebalanced date
  - Actions: Run optimization, Skip, Snooze
- **Rebalancing History**:
  - History of automated rebalancing runs
  - Shows trigger reason, proposal generated, approval status

#### Bulk Rebalancing
- **Bulk Operations**:
  - Select multiple accounts/households
  - Run optimization for all selected
  - Batch approve proposals
  - Send all approved proposals to OMS at once

---

### 2.8 Multi-Sleeve Support

**Purpose**: Support multiple strategies/sleeves within a single account (e.g., UMA structure).

#### Sleeve Management
- **Account Sleeves**:
  - Account can have multiple sleeves (e.g., Core, Satellite, Tax-loss harvesting)
  - Each sleeve has its own:
    - Model/target assignment
    - Positions (subset of account positions)
    - Analytics (computed per-sleeve)
- **Sleeve Views**:
  - View account with sleeve breakdown
  - View individual sleeve positions and analytics
  - Aggregate view (all sleeves combined)
- **Sleeve Optimization**:
  - Optimize individual sleeve
  - Optimize all sleeves together
  - Proposals can target specific sleeve

**Note**: For initial implementation, this may be simplified or deferred. Accounts can be structured to represent sleeves if needed.

---

### 2.9 Time-Travel / As-of Date

All portfolio views support time-travel via as-of date selector:
- **Selector UI**: Date picker with quick options (Today, Yesterday, Last Week, Custom)
- **Impact on Views**:
  - Positions reflect holdings as-of selected date
  - Market values use evaluated prices from that date
  - Analytics computed with historical prices
  - Proposals created before as-of date are visible, after are hidden
  - Drift calculations use historical positions and targets
- **Visual Indicator**: Clear display of "Viewing as-of: [date]" banner

---

## 3. Data Models

### 3.1 Household
**Note**: Household is a first-class aggregate (PMS-owned). Requires `HouseholdCreated` event for creation.

- `householdId` (UUID)
- `name` (string)
- `createdAt` (timestamp)
- `createdBy` (actor)

### 3.2 Account
- `accountId` (UUID)
- `householdId` (UUID, FK)
- `name` (string)
- `accountType` (enum: individual, joint, trust, etc.)
- `createdAt` (timestamp)
- `createdBy` (actor)

### 3.3 Position (computed from events)
- `accountId` (UUID)
- `instrumentId` (UUID, FK to Instrument)
- `quantity` (decimal, can be negative for shorts)
- `avgCost` (decimal, weighted average)
- Computed fields (as-of date):
  - `marketValue` (quantity × evaluated price)
  - `duration` (instrument duration × position weight)
  - `dv01` (instrument DV01 × quantity)

### 3.4 Portfolio Target
- `targetId` (UUID)
- `scope` (enum: account, household)
- `scopeId` (UUID, accountId or householdId)
- `modelId` (UUID, FK to Portfolio Model, nullable - if set, target inherited from model)
- `durationTarget` (decimal, years)
- `bucketWeights` (map: bucket → weight percentage)
- `constraints` (JSON: min/max sizes, blacklist, etc.)
- `effectiveFrom` (timestamp)
- `effectiveTo` (timestamp, nullable)
- `createdAt`, `createdBy`

### 3.6 Portfolio Model
- `modelId` (UUID)
- `name` (string)
- `description` (string, nullable)
- `durationTarget` (decimal, years)
- `bucketWeights` (map: bucket → weight percentage)
- `constraints` (JSON: min/max sizes, blacklist, etc.)
- `assignedAccountIds` (array of UUIDs)
- `createdAt`, `createdBy`
- `updatedAt`, `updatedBy`

### 3.7 Rebalancing Rule
- `ruleId` (UUID)
- `name` (string)
- `type` (enum: DRIFT_BASED, TIME_BASED, EVENT_BASED)
- `scope` (enum: account, household, all)
- `scopeId` (UUID, nullable if scope is "all")
- `modelId` (UUID, FK to Portfolio Model, nullable - filter by model)
- `driftThreshold` (decimal, percentage - for DRIFT_BASED)
- `schedule` (string, cron expression - for TIME_BASED)
- `autoApprove` (boolean)
- `enabled` (boolean)
- `createdAt`, `createdBy`
- `lastTriggeredAt` (timestamp, nullable)

### 3.8 Portfolio Drift (computed)
- `accountId` (UUID)
- `asOfDate` (date)
- `currentDuration` (decimal)
- `targetDuration` (decimal)
- `durationDrift` (decimal, percentage)
- `bucketDrifts` (map: bucket → drift percentage)
- `overallDrift` (decimal, weighted score)
- `lastRebalancedAt` (timestamp, nullable)

### 3.5 Proposal
**Note**: Supports both account-scoped and household-scoped proposals. The technical spec shows `accountId` only; household-scoped proposals extend this model to support frontend requirements for household-level optimization.

- `proposalId` (UUID)
- `accountId` (UUID, nullable if household-scoped)
- `householdId` (UUID, nullable if account-scoped)
- `asOfDate` (date, market date for pricing)
- `targetId` (UUID, FK to Portfolio Target, nullable)
- `trades[]` (array of trade intents: side, instrumentId, quantity)
- `predictedAnalytics` (JSON: duration, dv01, bucket weights)
- `currentAnalytics` (JSON: snapshot at proposal creation)
- `assumptions` (string, explanation)
- `status` (enum: DRAFT, APPROVED, REJECTED, SENT_TO_OMS)
- `createdAt`, `createdBy`
- `approvedAt`, `approvedBy` (nullable)
- `sentToOmsAt` (nullable)

---

## 4. User Flows

### 4.1 View Portfolio Holdings
1. Navigate to Account List or Household List
2. Filter/search as needed
3. Click account/household → view detail
4. Optionally change as-of date → view historical positions
5. Click position CUSIP → view instrument details (market data)

### 4.2 Configure Targets
1. Navigate to `/app/pms/targets`
2. Select scope (Account/Household)
3. Select specific account/household
4. Enter duration target and/or bucket weights
5. Optionally set constraints
6. Save target

### 4.3 Generate and Approve Proposal
1. Navigate to `/app/pms/optimization` OR click "Run Optimization" from account/household detail
2. Select scope (pre-filled if navigated from detail page)
3. Select account/household (pre-filled if navigated from detail page)
4. Choose existing target OR enter ad-hoc targets
5. Optionally adjust constraints
6. Click "Run Optimization"
7. Review proposal preview:
   - Check proposed trades
   - Verify predicted analytics match targets
   - Review assumptions
8. Click "Approve" → navigate to proposal detail
9. On proposal detail, click "Send to OMS"
10. Proposal status changes to SENT_TO_OMS, trades converted to OMS orders

### 4.4 Reject Proposal
1. From optimization preview OR proposal detail
2. Click "Reject"
3. Optionally provide reason (stored in proposal)
4. Proposal status → REJECTED
5. Can create new proposal with different targets

### 4.5 Create and Assign Model
1. Navigate to `/app/pms/models`
2. Click "Create Model"
3. Enter model name and description
4. Configure targets (duration, bucket weights, constraints)
5. Save model
6. Assign to accounts:
   - From model detail page: Select accounts, click "Assign"
   - From account detail page: Select model from dropdown
7. Accounts inherit model targets (can be overridden)

### 4.6 Monitor Drift and Rebalance
1. Navigate to `/app/pms/drift`
2. Review drift dashboard:
   - Identify accounts out of tolerance
   - Check drift details for specific accounts
3. Manual rebalancing:
   - Select accounts requiring rebalancing
   - Click "Run Optimization" for selected accounts
   - Review and approve proposals
4. Automated rebalancing:
   - Configure rebalancing rules (drift threshold, schedule)
   - System automatically generates proposals when triggered
   - Review auto-generated proposals (if auto-approve disabled)

### 4.7 Bulk Optimization
1. Navigate to Account List or Household List
2. Select multiple accounts/households (checkboxes)
3. Click "Bulk Optimize"
4. Select target configuration (use existing targets or enter ad-hoc)
5. Run optimization for all selected
6. Review proposals in batch:
   - Approve/reject individual proposals
   - Bulk approve all proposals
7. Send approved proposals to OMS in batch

---

## 5. Technical Requirements

### 5.1 Event Sourcing
- Positions computed from execution events (settled fills)
- Proposals emit events on state changes (created, approved, rejected, sent)
- Targets emit events on create/update
- Models emit events on create/update/delete
- Model assignments emit events (account assigned/unassigned to model)
- Rebalancing rules emit events on create/update/enable/disable
- Rebalancing triggers emit events (when rule triggers optimization)
- Household creation emits `HouseholdCreated` event (household is first-class aggregate)
- Account creation emits `AccountCreated` event

### 5.2 Pricing Integration
- All market values use evaluated pricing service
- Pricing requires as-of date (yield curve date)
- Proposals lock pricing as-of proposal creation date

### 5.3 Optimization Algorithm
- Inputs: current positions, targets, constraints, as-of date
- Output: list of trades (buy/sell, instrument, quantity)
- Must be deterministic (same inputs → same outputs)
- Explainability: must provide assumptions/explanation

### 5.4 OMS Integration
- Approved proposals → converted to OMS orders
- Each trade in proposal becomes separate order (or grouped by account)
- Orders reference proposal ID for traceability
- Proposal status updated when orders created

### 5.5 Bulk Operations
- Bulk optimization must support 100+ accounts simultaneously
- Batch proposal generation with progress tracking
- Efficient drift calculation across all accounts (can be computed incrementally)
- Bulk operations should complete within reasonable time (< 30s for 100 accounts)

### 5.6 Drift Monitoring
- Drift calculations must be efficient (can be cached, recomputed on position changes)
- Real-time drift updates when positions change (via event projections)
- Historical drift tracking (optional, for drift trend analysis)

### 5.7 Automated Rebalancing
- Rebalancing rules evaluated periodically (background job)
- Drift-based rules: Evaluate on position update events
- Time-based rules: Scheduled evaluation (cron-based)
- Event-based rules: Triggered by specific events (e.g., cash deposit)
- Must be deterministic and explainable (why rebalancing was triggered)

### 5.8 Performance
- Portfolio views must load < 2s
- Optimization must complete < 5s for typical portfolio (< 50 positions)
- Bulk optimization: < 30s for 100 accounts
- Drift calculation: < 1s for all accounts
- Time-travel queries must be efficient (indexed by date)

---

## 6. Mock Data Requirements

For initial development, provide:
- 3-5 sample households
- 5-10 sample accounts (distributed across households)
- Sample positions (3-10 positions per account)
- 2-3 sample portfolio models
- 2-3 sample targets (account and household level)
- 2-3 sample proposals (various statuses)
- Sample drift data (some accounts in/out of tolerance)
- 1-2 sample rebalancing rules

