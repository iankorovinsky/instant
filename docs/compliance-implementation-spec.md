# Compliance Implementation Specification

> **Compliance System** for rule authoring, evaluation at pre-trade / pre-execution / post-trade gates, and violation tracking in Instant.

---

## 1. Overview

The Compliance system enables advisors to:
- Author and manage compliance rules (typed DSL)
- Configure rule scope (Global, Household, Account) and severity (BLOCK, WARN)
- Evaluate rules at pre-trade, pre-execution, and post-trade gates
- Track violations and warnings with full explainability
- Understand rule inheritance and hierarchy
- Audit compliance decisions with metric snapshots

**Core Principle**: Rules are stored as data (not code) and evaluated deterministically. Every compliance decision must be explainable with rule version, computed metrics, and human-readable explanation.

**Evaluation Points**: Rules are evaluated at three distinct gates:
- **Pre-trade**: On order creation/amendment (before approval)
- **Pre-execution**: On order approval/execution request (hard gate)
- **Post-trade**: On fill/settlement (audit trail)

---

## 2. Core Features

### 2.1 Rule Management (`/app/compliance/rules`)

**Purpose**: Author, edit, version, and manage compliance rules.

#### Rule List View
- **Table Columns**:
  - Rule ID
  - Rule Name
  - Severity (BLOCK/WARN badge)
  - Scope Level (Global/Household/Account)
  - Scope Target (specific household/account if scoped)
  - Status (Active/Inactive)
  - Version
  - Last Updated
  - Evaluation Count (optional: how many times evaluated)
- **Actions**:
  - Create new rule
  - Edit rule (creates new version)
  - View rule detail
  - Enable/Disable rule
  - Delete rule (only if never evaluated)

#### Rule Editor Form
- **Rule Information**:
  - Rule ID (unique identifier, immutable after creation)
  - Rule Name (human-readable name)
  - Description (optional)
- **Severity**:
  - **BLOCK**: Hard violation, prevents order/execution from proceeding
  - **WARN**: Soft violation, allows proceeding with warning
- **Scope Configuration**:
  - **Scope Level**: Global / Household / Account
  - **Scope Target** (conditional):
    - Global: No target (applies to all)
    - Household: Household selector dropdown
    - Account: Account selector dropdown (with household context)
- **Predicate Builder**:
  - **Metric**: Select metric to evaluate
    - Portfolio metrics: `portfolio.duration`, `portfolio.dv01`, `portfolio.marketValue`, `portfolio.cash`, `portfolio.cashPercentage`
    - Position metrics: `position.quantity`, `position.marketValue`, `position.percentage` (requires instrument filter)
    - Order metrics: `order.quantity`, `order.value`, `order.side` (for pre-trade/pre-exec evaluation)
    - Custom metrics (future extensibility)
  - **Operator**: Comparison operator
    - `<=` (less than or equal)
    - `>=` (greater than or equal)
    - `<` (less than)
    - `>` (greater than)
    - `==` (equals)
    - `!=` (not equals)
    - `in` (value in list, for enums)
  - **Value**: Threshold value (decimal, integer, or string depending on metric)
  - **Instrument Filter** (optional): For position-level metrics, filter by specific CUSIP or instrument type
- **Explanation Template**:
  - Human-readable template explaining what the rule does
  - Can include placeholders: `{metric}`, `{value}`, `{threshold}`
  - Example: "Blocks trades that would increase portfolio duration above {threshold} years"
- **Effective Dates**:
  - Effective From (timestamp)
  - Effective To (nullable, optional expiration)

#### Rule Versioning
- Each rule edit creates a new version
- Previous versions are retained for audit
- Active version is the latest version with `effectiveTo` null or in future
- Version history viewable in rule detail
- Evaluation uses active version only

#### Rule Publishing
- Rules can be saved as draft or published
- Published rules are active and can be evaluated
- Draft rules cannot be evaluated
- Publishing creates a version and sets `effectiveFrom` timestamp

#### Scope Hierarchy Visualization
- Visual breadcrumb showing rule hierarchy
- For scoped rules, show inheritance path (Global → Household → Account)
- Indicate which rules apply at each level
- Show rule precedence (more specific overrides less specific)

---

### 2.2 Rule Detail (`/app/compliance/rules/:id`)

**Purpose**: View detailed information about a single rule.

#### Rule Information
- Full rule definition (scope, predicate, severity, explanation)
- Current version and status
- Version history (list of all versions)
- Effective dates

#### Rule Statistics
- Evaluation count (total times evaluated)
- Violation count (times rule triggered)
- Last evaluated timestamp
- Last violated timestamp

#### Rule Testing
- Test rule against sample account/order
- Show evaluation result (PASS/WARN/BLOCK)
- Show computed metrics
- Show explanation

#### Actions
- Edit rule (creates new version)
- Enable/Disable rule
- Delete rule (if never evaluated)
- View evaluation history (link to violations)

---

### 2.3 Violations View (`/app/compliance/violations`)

**Purpose**: View active violations and warnings, filter and analyze compliance issues.

#### Violations Table
- **Columns**:
  - Rule ID (link to rule detail)
  - Rule Name
  - Severity (BLOCK/WARN badge)
  - Scope Level (Global/Household/Account)
  - Scope Target (household/account name if scoped)
  - Order/Account (link to order detail or account detail)
  - Metric Value (actual computed value)
  - Threshold (rule threshold value)
  - Status (Active/Resolved)
  - Evaluated At (timestamp)
  - Evaluation Point (Pre-trade/Pre-execution/Post-trade)

#### Filters
- **Severity**: Filter by BLOCK or WARN
- **Scope Level**: Filter by Global/Household/Account
- **Household**: Filter by specific household
- **Account**: Filter by specific account
- **Rule ID**: Filter by specific rule
- **Status**: Filter by Active/Resolved
- **Evaluation Point**: Filter by Pre-trade/Pre-execution/Post-trade
- **Date Range**: Filter by evaluation timestamp

#### Grouping Options
- Group by Scope Level (optional)
- Group by Rule (optional)
- Group by Severity (optional)

#### Violation Detail
- Click violation → view violation detail modal or navigate to detail page
- Show:
  - Rule information (full rule definition)
  - Order/Account context (link to order/account detail)
  - Metric snapshot (computed values at evaluation time)
  - Threshold comparison (actual vs. threshold)
  - Explanation (human-readable explanation)
  - Rule inheritance (which rule level triggered the violation)
  - Related violations (same rule, different accounts/orders)

#### Actions
- View Rule Detail
- View Order Detail (if order-related)
- View Account Detail (if account-related)
- Resolve Violation (mark as resolved, if applicable)
- Export violations (CSV)

---

### 2.4 Rule Evaluation

**Purpose**: Evaluate rules at designated gates and emit compliance events.

#### Evaluation Points

##### Pre-trade Evaluation
- **Trigger**: `OrderCreated`, `OrderAmended` events
- **Context**: Order information, account context
- **Purpose**: Check if order would violate rules before approval
- **Output**: 
  - Emit `RuleEvaluated` events for each applicable rule
  - If violated: Emit `RuleViolationDetected` and either `OrderBlockedByCompliance` (BLOCK) or `OrderWarnedByCompliance` (WARN)
- **Impact**: 
  - BLOCK: Order cannot proceed to approval
  - WARN: Order can proceed with warning flag

##### Pre-execution Evaluation
- **Trigger**: `OrderApproved`, `ExecutionRequested` events
- **Context**: Order information, account context (projected positions after order)
- **Purpose**: Hard gate before execution (final check)
- **Output**:
  - Emit `RuleEvaluated` events
  - If violated: Emit `RuleViolationDetected` and `ExecutionBlockedByCompliance` (BLOCK only at this gate)
- **Impact**: Execution cannot proceed if BLOCK

##### Post-trade Evaluation
- **Trigger**: `FillGenerated`, `SettlementBooked` events
- **Context**: Actual positions after fill/settlement
- **Purpose**: Audit trail, detect violations after execution
- **Output**:
  - Emit `RuleEvaluated` events
  - If violated: Emit `RuleViolationDetected` (for audit)
- **Impact**: Audit only, no blocking (execution already occurred)

#### Rule Selection (Applicable Rules)
1. **Scope Resolution**:
   - Collect all rules at Global scope
   - If order/account has household: Collect rules at Household scope for that household
   - If order/account: Collect rules at Account scope for that account
2. **Version Selection**:
   - For each rule, select active version (latest version with `effectiveFrom` <= current time and `effectiveTo` null or > current time)
3. **Precedence**:
   - More specific rules override less specific ones (Account > Household > Global)
   - If multiple rules at same scope level, all are evaluated
4. **Filtering**:
   - Filter by evaluation point (some rules may only apply at specific gates)
   - Filter enabled/disabled rules

#### Metric Computation
- For each rule, compute the metric value:
  - **Portfolio metrics**: Query account positions, compute portfolio-level metrics (duration, DV01, market value, cash)
  - **Position metrics**: Query specific position (if instrument filter specified)
  - **Order metrics**: Use order information (quantity, value, side)
- Metrics computed as-of evaluation time (may use as-of date for pricing)
- Store metric snapshot in evaluation result (for explainability)

#### Predicate Evaluation
- Evaluate predicate: `metric {operator} threshold`
- Result: PASS (predicate satisfied) or FAIL (predicate violated)
- If FAIL and severity is BLOCK: Emit block event
- If FAIL and severity is WARN: Emit warn event

#### Explainability
- Every evaluation must include:
  - Rule version identifier
  - Computed metric value
  - Threshold value
  - Predicate result (PASS/FAIL)
  - Human-readable explanation (from rule's explanation template)
  - Metric snapshot (all computed values used in evaluation)

---

### 2.5 Rule Hierarchy & Inheritance

**Purpose**: Understand how rules inherit and override at different scope levels.

#### Scope Hierarchy
```
Global (applies to all)
  └── Household (applies to all accounts in household)
      └── Account (applies to specific account)
```

#### Inheritance Rules
- Rules inherit down the hierarchy (Global → Household → Account)
- More specific rules override less specific ones
- Multiple rules at same scope level are all evaluated (AND logic)
- If rule at Account scope conflicts with rule at Global scope, Account scope wins for that account

#### Rule Resolution Example
- Order for Account A (in Household H):
  - Evaluate all Global rules
  - Evaluate all Household H rules
  - Evaluate all Account A rules
  - If Account A rule conflicts with Global rule, Account A rule takes precedence
  - All non-conflicting rules are evaluated

#### UI Display
- Violations view shows which scope level triggered the violation
- Rule detail shows inheritance path
- Violation detail shows rule hierarchy and which rule triggered

---

## 3. Data Models

### 3.1 RuleSet (Prisma model)
- `ruleSetId` (UUID, PK)
- `name` (string, human-readable name)
- `description` (string, nullable)
- `version` (integer, version number)
- `status` (enum: DRAFT, PUBLISHED, ARCHIVED)
- `effectiveFrom` (timestamp)
- `effectiveTo` (timestamp, nullable)
- `createdAt` (timestamp)
- `createdBy` (actor)
- `updatedAt` (timestamp)
- `updatedBy` (actor)

**Relations**:
- Rules (one-to-many: RuleSet has many Rules)

### 3.2 Rule (Prisma model)
- `ruleId` (UUID, PK)
- `ruleSetId` (UUID, FK to RuleSet, nullable - for grouping, optional)
- `ruleKey` (string, unique identifier, immutable)
- `name` (string, human-readable name)
- `description` (string, nullable)
- `version` (integer, version number)
- `severity` (enum: BLOCK, WARN)
- `scope` (enum: GLOBAL, HOUSEHOLD, ACCOUNT)
- `scopeId` (UUID, nullable - householdId or accountId if scoped)
- `predicate` (JSON, metric/operator/value structure)
- `explanationTemplate` (string, human-readable template)
- `evaluationPoints` (JSON array, enum: PRE_TRADE, PRE_EXECUTION, POST_TRADE)
- `status` (enum: ACTIVE, INACTIVE, ARCHIVED)
- `effectiveFrom` (timestamp)
- `effectiveTo` (timestamp, nullable)
- `evaluationCount` (integer, default 0)
- `violationCount` (integer, default 0)
- `createdAt` (timestamp)
- `createdBy` (actor)
- `updatedAt` (timestamp)
- `updatedBy` (actor)
- `lastEvaluatedAt` (timestamp, nullable)
- `lastViolatedAt` (timestamp, nullable)

**Relations**:
- RuleSet (many-to-one, optional)
- Household (many-to-one, optional, if scope is HOUSEHOLD)
- Account (many-to-one, optional, if scope is ACCOUNT)

### 3.3 Predicate (JSON structure)
Stored in `Rule.predicate`:
- `metric` (string, metric identifier: `portfolio.duration`, `portfolio.dv01`, etc.)
- `operator` (enum: `<=`, `>=`, `<`, `>`, `==`, `!=`, `in`)
- `value` (decimal/string, threshold value)
- `instrumentFilter` (JSON, nullable, optional):
  - `cusip` (string, optional)
  - `instrumentType` (enum, optional)

### 3.4 Compliance Evaluation (computed from events)
Evaluations are stored as events, but can be projected for queries:
- `evaluationId` (UUID, from event)
- `ruleId` (UUID)
- `ruleVersion` (integer)
- `orderId` (UUID, nullable, if order-related)
- `accountId` (UUID)
- `evaluationPoint` (enum: PRE_TRADE, PRE_EXECUTION, POST_TRADE)
- `result` (enum: PASS, WARN, BLOCK)
- `metricValue` (decimal, computed metric value)
- `threshold` (decimal, rule threshold)
- `metricSnapshot` (JSON, all computed metrics)
- `explanation` (string, human-readable)
- `evaluatedAt` (timestamp)

### 3.5 Compliance Violation (computed from events)
Violations are derived from evaluation events:
- `violationId` (UUID, from event)
- `ruleId` (UUID)
- `ruleName` (string)
- `ruleVersion` (integer)
- `severity` (enum: BLOCK, WARN)
- `scope` (enum: GLOBAL, HOUSEHOLD, ACCOUNT)
- `scopeId` (UUID, nullable)
- `orderId` (UUID, nullable, if order-related)
- `accountId` (UUID)
- `evaluationPoint` (enum: PRE_TRADE, PRE_EXECUTION, POST_TRADE)
- `metricValue` (decimal)
- `threshold` (decimal)
- `status` (enum: ACTIVE, RESOLVED)
- `explanation` (string)
- `evaluatedAt` (timestamp)
- `resolvedAt` (timestamp, nullable)

### 3.6 Compliance Events
Compliance-related events in the event store:
- `RuleSetPublished`
- `RuleCreated`
- `RuleUpdated` (creates new version)
- `RuleDeleted`
- `RuleEnabled`
- `RuleDisabled`
- `RuleEvaluated`
- `RuleViolationDetected`
- `OrderBlockedByCompliance`
- `OrderWarnedByCompliance`
- `ExecutionBlockedByCompliance`

---

## 4. User Flows

### 4.1 Create and Publish Rule
1. Navigate to `/app/compliance/rules`
2. Click "Create Rule"
3. Fill in rule information (ID, name, description)
4. Select severity (BLOCK or WARN)
5. Select scope level (Global/Household/Account)
6. If scoped: Select scope target (household/account)
7. Build predicate:
   - Select metric (e.g., `portfolio.duration`)
   - Select operator (e.g., `<=`)
   - Enter threshold value (e.g., `6.0`)
8. Enter explanation template
9. Select evaluation points (Pre-trade/Pre-execution/Post-trade)
10. Set effective dates
11. Click "Save as Draft" or "Publish"
12. If published: Rule becomes active and can be evaluated

### 4.2 Edit Rule (Versioning)
1. Navigate to rule detail (`/app/compliance/rules/:id`)
2. Click "Edit Rule"
3. Modify rule fields (predicate, threshold, explanation, etc.)
4. Click "Save"
5. System creates new version
6. Previous version retained for audit
7. New version becomes active (if published)

### 4.3 View Violations
1. Navigate to `/app/compliance/violations`
2. View violations table (active violations)
3. Apply filters (severity, scope, household, account, rule, date range)
4. Group violations (by scope, rule, severity)
5. Click violation → view violation detail:
   - See rule information
   - See metric value vs. threshold
   - See explanation
   - See rule inheritance
   - Link to order/account detail
6. Export violations (CSV)

### 4.4 Test Rule
1. Navigate to rule detail
2. Click "Test Rule"
3. Select test context (account or order)
4. View evaluation result (PASS/WARN/BLOCK)
5. View computed metrics
6. View explanation

### 4.5 Rule Evaluation Flow (Automatic)
1. Order created or amended (`OrderCreated`/`OrderAmended` event)
2. Compliance service receives event
3. Compliance service resolves applicable rules (scope resolution)
4. For each applicable rule:
   - Compute metric value
   - Evaluate predicate
   - Emit `RuleEvaluated` event
   - If violated: Emit `RuleViolationDetected` and block/warn event
5. OMS receives compliance result
6. Order status updated (blocked if BLOCK, warned if WARN)
7. User views compliance result in order detail

---

## 5. Technical Requirements

### 5.1 Event Sourcing
- All rule changes emit events (`RuleCreated`, `RuleUpdated`, `RuleDeleted`, etc.)
- All evaluations emit events (`RuleEvaluated`, `RuleViolationDetected`)
- Events are source of truth for rule history and evaluations
- Rule projections built from events
- Violation projections built from evaluation events

### 5.2 Deterministic Evaluation
- Evaluation must be deterministic (same inputs → same outputs)
- Metric computation must be consistent
- Predicate evaluation must be deterministic
- Store metric snapshots for reproducibility

### 5.3 Metric Computation
- Portfolio metrics: Query account positions, compute aggregate metrics
- Position metrics: Query specific positions (with instrument filter)
- Order metrics: Use order information
- Metrics must be computed as-of evaluation time (respect as-of date)
- Use evaluated pricing for market value calculations

### 5.4 Scope Resolution
- Efficient resolution of applicable rules (Global + Household + Account)
- Rules must be indexed by scope for fast lookup
- Handle rule precedence correctly (Account > Household > Global)

### 5.5 Version Management
- Rule versions must be immutable (cannot edit previous version)
- Active version selection based on `effectiveFrom` and `effectiveTo`
- Version history must be retained for audit
- Evaluation always uses active version

### 5.6 Explainability
- Every evaluation must include:
  - Rule version identifier
  - Computed metric value
  - Threshold value
  - Predicate result
  - Human-readable explanation
  - Metric snapshot (for reproducibility)
- Explanation template must support placeholders

### 5.7 Performance
- Rule evaluation must complete < 1s per order (can be async)
- Violations view must load < 2s (with filters)
- Rule list must load < 1s
- Efficient metric computation (cache if possible)
- Efficient scope resolution (indexed queries)

### 5.8 Integration Points
- **OMS Integration**: Receive order events, emit compliance results
- **EMS Integration**: Receive execution events, evaluate pre-execution rules
- **PMS Integration**: Query account positions for metric computation
- **Pricing Integration**: Use evaluated pricing for market value calculations

---

## 6. Integration Points

### 6.1 OMS Integration
- **Trigger Evaluation**: Receive `OrderCreated`, `OrderAmended` events
- **Pre-trade Evaluation**: Evaluate rules, emit compliance results
- **Compliance Result Storage**: OMS stores compliance result on order
- **Block Handling**: OMS blocks order progression if BLOCK
- **Warn Handling**: OMS flags order with warning if WARN

### 6.2 EMS Integration
- **Trigger Evaluation**: Receive `OrderApproved`, `ExecutionRequested` events
- **Pre-execution Evaluation**: Hard gate before execution
- **Block Handling**: EMS blocks execution if BLOCK
- **Audit Trail**: Post-trade evaluation for audit

### 6.3 PMS Integration
- **Metric Computation**: Query account positions for portfolio metrics
- **Account Context**: Access account/household hierarchy for scope resolution
- **Position Data**: Query positions for position-level metrics

### 6.4 Pricing Integration
- **Evaluated Pricing**: Use evaluated pricing for market value calculations
- **As-of Date**: Respect as-of date for pricing consistency

---

## 7. Mock Data Requirements

For initial development, provide:
- 8-12 sample rules:
  - 3-4 Global rules (e.g., max duration, max DV01, min cash percentage)
  - 2-3 Household-scoped rules (e.g., household-specific limits)
  - 2-3 Account-scoped rules (e.g., account-specific constraints)
- Mix of severities: 6-8 BLOCK rules, 2-4 WARN rules
- Mix of evaluation points: Pre-trade, Pre-execution, Post-trade
- Sample violations:
  - 5-8 active violations (various severities, scopes)
  - 2-3 resolved violations
  - Mix of evaluation points
- Sample evaluation history for test rules
- Sample metric snapshots

---

## 8. UI/UX Considerations

### 8.1 Rule Editor
- Intuitive predicate builder (form-based, not code)
- Metric selector with descriptions
- Operator selector with clear labels
- Validation feedback (metric type vs. value type)
- Preview of explanation template
- Scope hierarchy visualization

### 8.2 Violations View
- Clear severity indicators (BLOCK = red, WARN = yellow)
- Scope level badges
- Metric value vs. threshold comparison (visual)
- Filter persistence (URL params or local storage)
- Export functionality (CSV)
- Grouping options for analysis

### 8.3 Violation Detail
- Clear visual comparison (metric value vs. threshold)
- Rule information prominently displayed
- Explanation easy to read
- Links to related entities (order, account, rule)
- Rule inheritance path shown

### 8.4 Rule List
- Status indicators (Active/Inactive)
- Scope badges
- Severity badges
- Sortable columns
- Search/filter functionality

### 8.5 State Management
- Optimistic updates for rule creation/editing
- Error handling and validation feedback
- Loading states for evaluation (if async)
- Real-time updates (if WebSocket integration)

---

## 9. Edge Cases & Error Handling

### 9.1 Metric Computation Errors
- Handle missing data gracefully (e.g., no positions for account)
- Return default value or skip evaluation
- Log error for debugging
- Show error in evaluation result

### 9.2 Rule Version Conflicts
- Always use active version (latest with valid effective dates)
- If no active version, skip rule evaluation
- Log warning if rule has no active version

### 9.3 Scope Resolution Errors
- Handle missing household/account gracefully
- Default to Global scope if scope resolution fails
- Log error for debugging

### 9.4 Evaluation Timeout
- Set timeout for evaluation (< 5s)
- If timeout: Mark evaluation as pending, retry async
- Allow order to proceed with "Compliance check pending" status

### 9.5 Invalid Predicate
- Validate predicate structure on rule save
- Reject invalid predicates (e.g., metric type mismatch with operator)
- Show validation errors in UI

### 9.6 Rule Deletion
- Prevent deletion if rule has been evaluated (audit requirement)
- Allow archiving instead of deletion
- Show evaluation count before deletion attempt

---

## 10. Future Enhancements (Out of Scope)

- Complex predicates (AND/OR logic, multiple conditions)
- Time-based rules (e.g., rule applies only during trading hours)
- Rule templates (pre-built rule configurations)
- Rule testing framework (automated testing against historical data)
- Compliance reporting (violation trends, rule effectiveness)
- Rule approval workflows (multi-level approval for rule changes)
- Custom metrics (user-defined metric calculations)
- Rule dependencies (rule B only applies if rule A passes)
- Rule groups (logical grouping of rules)
- Real-time rule evaluation (WebSocket-based updates)

---

