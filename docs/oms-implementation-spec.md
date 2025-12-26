# OMS Implementation Specification

> **Order Management System** for managing order lifecycle, approvals, compliance gates, and batching in Instant.

---

## 1. Overview

The OMS enables advisors to:
- Create and capture orders (single or bulk upload)
- Manage order lifecycle (draft → approval → execution → settlement)
- Handle order amendments and cancellations
- Trigger compliance checks at pre-trade gates
- Approve or reject orders
- Batch orders for processing
- Send approved orders to EMS for execution
- Track order status and execution history

**Core Principle**: Orders express trading intent. OMS manages the order lifecycle and approvals, but does NOT handle execution logic (fills, routing, slippage decomposition - that's EMS).

---

## 2. Core Features

### 2.1 Order Blotter (`/app/oms/orders`)

**Purpose**: Main view for viewing and managing orders.

#### Table Columns
- **CUSIP**: Instrument identifier
- **Side**: BUY or SELL
- **Quantity**: Order quantity (par value)
- **Order Type**: MARKET, LIMIT, or CURVE_RELATIVE
- **Price/Limit**: Limit price or curve spread (depending on order type)
- **State**: Order lifecycle state
- **Account**: Account name (with household context)
- **Household**: Household name
- **Compliance Status**: Pass/Warn/Block indicators
- **Last Fill**: Most recent fill information (if any)
- **PnL**: Estimated profit/loss (for filled orders)

#### Filters
- **State**: Filter by order state (DRAFT, APPROVAL_PENDING, APPROVED, FILLED, etc.)
- **Account**: Filter by account
- **Household**: Filter by household
- **Date Range**: Filter by creation/update date
- **Compliance Status**: Filter by compliance result (pass/warn/block)
- **Order Type**: Filter by MARKET/LIMIT/CURVE_RELATIVE

#### Grouping Options
- Group by Household (optional)
- Group by Account (optional)
- Group by State (optional)

#### Actions
- **Create Order**: Navigate to order creation page
- **Upload Orders**: Navigate to bulk upload page
- **Approve**: Approve selected orders (batch approve)
- **Cancel**: Cancel selected orders
- **View Detail**: Navigate to order detail page

#### Status Indicators
- **Blue**: Pending states (DRAFT, APPROVAL_PENDING, APPROVED)
- **Green**: Success states (FILLED, SETTLED)
- **Red**: Error/rejected states (REJECTED, CANCELLED)

---

### 2.2 Order Detail (`/app/oms/orders/:id`)

**Purpose**: Detailed view of a single order with full lifecycle information.

#### Order Information Card
- **Order ID**: Unique order identifier
- **Account**: Account name with link to account detail
- **Household**: Household name with link to household detail
- **Instrument**: CUSIP, description, link to instrument detail
- **Side**: BUY or SELL
- **Quantity**: Order quantity
- **Order Type**: MARKET, LIMIT, or CURVE_RELATIVE
- **Price/Limit Details**: 
  - For LIMIT: Limit price
  - For CURVE_RELATIVE: Curve spread (basis points)
- **Time in Force**: DAY or IOC
- **Current State**: Order lifecycle state
- **Created**: Timestamp, created by
- **Last Updated**: Timestamp

#### Compliance Evaluation Results
- **Pre-trade Compliance Check**: Results from compliance service
- **Scope-level Rules**: Which rules evaluated (Global/Household/Account level)
- **Warnings**: Soft compliance violations (can proceed with warning)
- **Blocks**: Hard compliance violations (order cannot proceed)
- **Explanation**: Human-readable explanation of compliance decision
- **Rule Details**: Links to specific rules that triggered warnings/blocks

#### Execution History
- **Fills Table**: List of fills (if any)
  - Fill ID, timestamp, quantity, price
  - Links to execution detail (EMS)
- **Fill Summary**: 
  - Total filled quantity
  - Average fill price
  - Remaining quantity

#### Event Timeline
- Chronological list of all order events
- Events: Created, Amended, Approval Requested, Approved, Rejected, Sent to EMS, Partially Filled, Fully Filled, Cancelled, Settled
- Each event shows: timestamp, actor, details
- Expandable event details

#### Actions (Context-dependent)
- **DRAFT**: Submit for Approval, Cancel, Amend, Delete
- **APPROVAL_PENDING**: Approve, Reject, Cancel, Amend
- **APPROVED**: Cancel, Amend, Send to EMS (if not sent)
- **SENT**: Cancel (if not filled), View in EMS
- **PARTIALLY_FILLED**: Cancel remaining, View in EMS
- **FILLED**: View Execution Detail, View Settlement
- **CANCELLED/REJECTED**: No actions (terminal state)

---

### 2.3 Order Creation (`/app/oms/create`)

**Purpose**: Create a new single order.

#### Order Form
- **Account Selector**: 
  - Dropdown to select account
  - Shows household context
  - Filter/search accounts
- **Instrument Selector**:
  - Search by CUSIP or description
  - Shows instrument details (type, maturity, coupon)
  - Link to instrument detail
- **Side**: BUY or SELL toggle/radio
- **Quantity**: Numeric input (par value)
- **Order Type**: 
  - MARKET (default)
  - LIMIT (requires limit price)
  - CURVE_RELATIVE (requires curve spread in basis points)
- **Price Fields** (conditional on order type):
  - LIMIT: Limit price input
  - CURVE_RELATIVE: Curve spread (basis points) input
- **Time in Force**: DAY (default) or IOC dropdown
- **Notes/Comments**: Optional text area

#### Validation
- Account must be selected
- Instrument must be selected
- Quantity must be positive
- Limit price required if order type is LIMIT
- Curve spread required if order type is CURVE_RELATIVE
- Real-time validation feedback

#### Actions
- **Save as Draft**: Creates order in DRAFT state
- **Submit for Approval**: Creates order, triggers compliance check, moves to APPROVAL_PENDING
- **Cancel**: Discards form

#### Post-Creation
- On submit: Navigate to order detail page
- Show compliance results (if immediate)
- If blocked: Show block reasons, allow edit and resubmit

---

### 2.4 Bulk Order Upload (`/app/oms/upload`)

**Purpose**: Upload multiple orders from CSV or other format.

#### Upload Interface
- **File Upload**: Drag-and-drop or file picker
- **Format Selection**: CSV format specification
- **Template Download**: Download CSV template with example data
- **Format Requirements**: Display expected columns/format

#### CSV Format
Required columns:
- `accountId` or `accountName`
- `cusip`
- `side` (BUY/SELL)
- `quantity`
- `orderType` (MARKET/LIMIT/CURVE_RELATIVE)
- `limitPrice` (if LIMIT order)
- `curveSpreadBp` (if CURVE_RELATIVE order)
- `timeInForce` (optional, defaults to DAY)

#### Upload Process
1. **File Validation**:
   - Validate file format
   - Check required columns
   - Validate data types
   - Show validation errors
2. **Data Preview**:
   - Show parsed orders in table
   - Highlight any validation errors
   - Allow edit before submission
3. **Batch Creation**:
   - All orders in batch get same `batchId`
   - Orders created in DRAFT or APPROVAL_PENDING state (user choice)
   - Show progress indicator
   - Display results (success count, error count)

#### Batch Management
- **Batch ID**: Unique identifier for upload batch
- **Batch Status**: Processing, Completed, Partial Success
- **Batch View**: View all orders in a batch
- **Batch Actions**: Approve all, Cancel all (filtered by state)

---

### 2.5 Order States & Lifecycle

#### State Machine
```
DRAFT → APPROVAL_PENDING → APPROVED → SENT → PARTIALLY_FILLED → FILLED → SETTLED
  ↓           ↓               ↓          ↓            ↓
CANCELLED  REJECTED      CANCELLED  CANCELLED    CANCELLED
```

#### State Descriptions
- **DRAFT**: Order created but not submitted for approval
  - Can be edited, deleted, or submitted for approval
- **APPROVAL_PENDING**: Order submitted, awaiting approval
  - Compliance check has run (or is running)
  - Can be approved, rejected, cancelled, or amended
- **APPROVED**: Order approved and ready for execution
  - Can be sent to EMS, cancelled, or amended
- **SENT**: Order sent to EMS for execution
  - Cannot be edited (execution constraints can be updated via EMS events)
  - Can be cancelled (if not filled)
- **PARTIALLY_FILLED**: Order partially executed
  - Remaining quantity can be cancelled
  - Can transition to FILLED
- **FILLED**: Order fully executed
  - Terminal execution state (waits for settlement)
- **SETTLED**: Order settled (all fills settled)
  - Terminal state
- **CANCELLED**: Order cancelled by user
  - Terminal state
- **REJECTED**: Order rejected during approval
  - Terminal state

#### State Transitions
- Transitions are controlled and validated
- Each transition emits events (e.g., `OrderApproved`, `OrderCancelled`)
- Certain transitions trigger side effects:
  - APPROVAL_PENDING → triggers compliance check
  - APPROVED → can send to EMS
  - SENT → EMS handles execution

---

### 2.6 Order Amendments

**Purpose**: Modify orders before they are sent to EMS (or after if allowed).

#### Amendment Rules
- **DRAFT**: Can amend any field
- **APPROVAL_PENDING**: Can amend (resubmits for approval)
- **APPROVED**: Can amend (may require re-approval depending on changes)
- **SENT**: Cannot amend economic terms (execution constraints handled by EMS)
- **FILLED/SETTLED**: Cannot amend (terminal states)

#### Amendment Process
1. Click "Amend" on order detail
2. Form pre-filled with current values
3. Modify fields (validation applies)
4. Save amendment
5. Order state may change (e.g., back to APPROVAL_PENDING if significant change)
6. Amendment history tracked in event timeline

#### Amendment History
- Track all amendments
- Show what changed (before/after comparison)
- Timestamp and actor for each amendment

---

## 3. Data Models

### 3.1 Order (Prisma model)
- `orderId` (UUID, PK)
- `accountId` (UUID, FK to Account)
- `instrumentId` (UUID, FK to Instrument, or CUSIP string)
- `side` (enum: BUY, SELL)
- `quantity` (decimal, par value)
- `orderType` (enum: MARKET, LIMIT, CURVE_RELATIVE)
- `limitPrice` (decimal, nullable - required if LIMIT)
- `curveSpreadBp` (decimal, nullable - required if CURVE_RELATIVE)
- `timeInForce` (enum: DAY, IOC)
- `state` (enum: DRAFT, STAGED, APPROVAL_PENDING, APPROVED, SENT, PARTIALLY_FILLED, FILLED, CANCELLED, REJECTED, SETTLED)
- `batchId` (UUID, nullable - groups orders from bulk upload)
- `complianceResult` (JSON, nullable - stores compliance evaluation result)
- `createdAt` (timestamp)
- `createdBy` (actor)
- `updatedAt` (timestamp)
- `lastStateChangeAt` (timestamp)
- `sentToEmsAt` (timestamp, nullable)
- `fullyFilledAt` (timestamp, nullable)
- `settledAt` (timestamp, nullable)

**Relations**:
- Account (many-to-one)
- Instrument (many-to-one, via CUSIP or instrumentId)

### 3.2 Order Event (computed from event store)
Orders have associated events in the event timeline:
- `OrderCreated`
- `OrderAmended`
- `OrderCancelled`
- `OrderApprovalRequested`
- `OrderApproved`
- `OrderRejected`
- `OrderSentToEMS`
- `OrderPartiallyFilled` (from EMS)
- `OrderFullyFilled` (from EMS)
- `OrderSettled`

### 3.3 Compliance Result (JSON structure)
Stored in `Order.complianceResult`:
- `status` (enum: PASS, WARN, BLOCK)
- `evaluatedAt` (timestamp)
- `rulesEvaluated` (array of rule IDs)
- `warnings` (array of warning objects)
- `blocks` (array of block objects)
- `explanation` (string)

Each warning/block object:
- `ruleId` (string)
- `ruleName` (string)
- `scope` (Global/Household/Account)
- `message` (string)
- `metrics` (JSON, snapshot of metrics used in evaluation)

---

## 4. User Flows

### 4.1 Create and Submit Single Order
1. Navigate to `/app/oms/create`
2. Select account from dropdown
3. Search/select instrument (CUSIP)
4. Select side (BUY/SELL)
5. Enter quantity
6. Select order type (MARKET/LIMIT/CURVE_RELATIVE)
7. If LIMIT: Enter limit price
8. If CURVE_RELATIVE: Enter curve spread (bp)
9. Select time in force (DAY/IOC)
10. Optionally add notes
11. Click "Submit for Approval"
12. System creates order, triggers compliance check
13. Navigate to order detail page
14. Review compliance results:
    - If PASS: Order moves to APPROVAL_PENDING
    - If WARN: Order moves to APPROVAL_PENDING with warnings
    - If BLOCK: Order stays in DRAFT, shows block reasons

### 4.2 Approve Order
1. Navigate to order detail (or select from blotter)
2. Review order details and compliance results
3. If warnings exist, review warning details
4. Click "Approve" button
5. Order state changes to APPROVED
6. Order available to send to EMS

### 4.3 Bulk Upload Orders
1. Navigate to `/app/oms/upload`
2. Download CSV template (optional)
3. Prepare CSV file with order data
4. Upload CSV file
5. Review parsed orders in preview table
6. Fix any validation errors
7. Choose submission option:
   - "Save as Draft" (all orders in DRAFT state)
   - "Submit for Approval" (all orders go to APPROVAL_PENDING)
8. System processes batch
9. View batch results (success/error counts)
10. Navigate to batch view or individual orders

### 4.4 Amend Order
1. Navigate to order detail
2. Click "Amend" button (if available for current state)
3. Modify fields in amendment form
4. Click "Save Amendment"
5. System validates changes
6. Order state may change (e.g., back to APPROVAL_PENDING)
7. Amendment appears in event timeline

### 4.5 Send Order to EMS
1. Navigate to order detail (order must be APPROVED)
2. Review order details
3. Click "Send to EMS"
4. Order state changes to SENT
5. Order sent to EMS for execution
6. Order detail shows execution status
7. Navigate to EMS to view execution details

### 4.6 Cancel Order
1. Navigate to order detail (or select from blotter)
2. Click "Cancel" button
3. Confirm cancellation
4. Order state changes to CANCELLED
5. If order was SENT, cancellation sent to EMS
6. Cancellation appears in event timeline

---

## 5. Technical Requirements

### 5.1 Event Sourcing
- All order state changes emit events
- Events are source of truth for order lifecycle
- Order projection built from events
- Event timeline reconstructable from event store

### 5.2 Compliance Integration
- **Pre-trade Compliance**: Triggered on order creation/amendment before approval
- Compliance service evaluates rules at appropriate scope (Global/Household/Account)
- Results stored on order (complianceResult JSON field)
- Hard blocks prevent approval/sending to EMS
- Soft warnings allow proceeding with acknowledgment

### 5.3 EMS Integration
- **Order Sending**: Approved orders can be sent to EMS
- Each order sent individually (or batched if EMS supports it)
- Order state changes to SENT
- EMS emits execution events (fills) that update order state
- Order state updates: PARTIALLY_FILLED, FILLED, SETTLED

### 5.4 Order Validation
- **Business Rules**:
  - Quantity must be positive
  - Limit price must be positive (for LIMIT orders)
  - Curve spread must be valid (for CURVE_RELATIVE orders)
  - Account must exist and be active
  - Instrument must exist
- **State Transitions**:
  - Validate state machine transitions
  - Prevent invalid transitions (e.g., FILLED → DRAFT)
- **Amendment Rules**:
  - Validate amendment is allowed for current state
  - Significant changes may require re-approval

### 5.5 Bulk Operations
- **CSV Parsing**: Robust CSV parsing with error handling
- **Batch Processing**: Efficient batch order creation
- **Error Handling**: Continue processing on individual order errors
- **Progress Tracking**: Show progress for large batches
- **Batch Queries**: Efficient queries for batch views

### 5.6 Performance
- Order blotter must load < 2s (with filters)
- Order detail must load < 1s
- Bulk upload processing: < 5s for 100 orders
- Compliance checks: < 1s per order (can be async)
- Efficient filtering and sorting on large order sets

### 5.7 Data Integrity
- Order quantities, prices stored as decimals (precise)
- Immutable order history (via events)
- Amendment tracking preserves order history
- Batch relationships preserved for audit

---

## 6. Integration Points

### 6.1 PMS Integration
- Orders reference accounts (PMS-owned)
- Order creation validates account exists
- Order views show household context (from account)

### 6.2 Compliance Service Integration
- Trigger compliance check on order creation/amendment
- Receive compliance results (PASS/WARN/BLOCK)
- Display compliance results in UI
- Block order progression if hard block exists

### 6.3 EMS Integration
- Send approved orders to EMS
- Receive execution events from EMS (fills)
- Update order state based on execution events
- Link to EMS execution detail views

### 6.4 Market Data Integration
- Instrument lookup (CUSIP → instrument details)
- Price validation (for LIMIT orders, can show current market price)
- Curve data (for CURVE_RELATIVE orders)

---

## 7. Mock Data Requirements

For initial development, provide:
- 20-30 sample orders in various states
- Distribution across states:
  - 3-5 DRAFT
  - 5-8 APPROVAL_PENDING
  - 4-6 APPROVED
  - 3-5 SENT
  - 2-4 PARTIALLY_FILLED
  - 3-5 FILLED
  - 2-3 SETTLED
  - 1-2 CANCELLED
  - 1-2 REJECTED
- Orders distributed across multiple accounts/households
- Mix of order types (MARKET, LIMIT, CURVE_RELATIVE)
- Sample compliance results (some PASS, some WARN, some BLOCK)
- Sample batch (5-10 orders with same batchId)
- Order events timeline for sample orders

---

## 8. UI/UX Considerations

### 8.1 Order Blotter
- Virtual scrolling for large order sets
- Sortable columns
- Persistent filter state (URL params or local storage)
- Export functionality (CSV export of filtered view)

### 8.2 Order Detail
- Clear visual state indicator (badge/icon)
- Compliance status prominently displayed
- Execution history visually separated
- Event timeline with expandable details
- Quick actions contextual to state

### 8.3 Bulk Upload
- Clear error messaging
- Inline validation feedback
- Preview before submission
- Batch status tracking
- Link to batch view from individual orders

### 8.4 State Management
- Optimistic updates for state changes
- Error handling and rollback
- Loading states for async operations (compliance, EMS sending)

---

## 9. Edge Cases & Error Handling

### 9.1 Compliance Service Unavailable
- Queue compliance check for retry
- Allow order to proceed to APPROVAL_PENDING with "Compliance check pending"
- Show indicator that compliance is pending

### 9.2 EMS Unavailable
- Prevent sending to EMS
- Show error message
- Queue order for retry

### 9.3 Order Amendment After Sent
- Economic terms cannot be amended after SENT
- Execution constraints handled by EMS (via events)
- Display clear message that amendment not available

### 9.4 Bulk Upload Errors
- Continue processing valid orders even if some fail
- Provide detailed error report
- Allow fixing errors and resubmitting failed orders

---

## 10. Future Enhancements (Out of Scope)

- Order templates (save common order configurations)
- Order allocation (split order across multiple accounts)
- Order routing rules (automatic routing based on criteria)
- Order approval workflows (multi-level approvals)
- Order expiration/auto-cancellation
- Real-time order updates (WebSocket integration)

