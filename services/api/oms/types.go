package oms

import (
	"time"
)

// OrderSide represents buy or sell
type OrderSide string

const (
	OrderSideBuy  OrderSide = "BUY"
	OrderSideSell OrderSide = "SELL"
)

// OrderType represents the type of order
type OrderType string

const (
	OrderTypeMarket        OrderType = "MARKET"
	OrderTypeLimit         OrderType = "LIMIT"
	OrderTypeCurveRelative OrderType = "CURVE_RELATIVE"
)

// TimeInForce represents how long an order remains active
type TimeInForce string

const (
	TimeInForceDay TimeInForce = "DAY"
	TimeInForceIOC TimeInForce = "IOC"
)

// OrderState represents the current state of an order
type OrderState string

const (
	OrderStateDraft           OrderState = "DRAFT"
	OrderStateApprovalPending OrderState = "APPROVAL_PENDING"
	OrderStateApproved        OrderState = "APPROVED"
	OrderStateSent            OrderState = "SENT"
	OrderStatePartiallyFilled OrderState = "PARTIALLY_FILLED"
	OrderStateFilled          OrderState = "FILLED"
	OrderStateCancelled       OrderState = "CANCELLED"
	OrderStateRejected        OrderState = "REJECTED"
	OrderStateSettled         OrderState = "SETTLED"
)

// ComplianceStatus represents the result of a compliance check
type ComplianceStatus string

const (
	ComplianceStatusPass  ComplianceStatus = "PASS"
	ComplianceStatusWarn  ComplianceStatus = "WARN"
	ComplianceStatusBlock ComplianceStatus = "BLOCK"
)

// ComplianceResult holds the result of a compliance check
type ComplianceResult struct {
	Status      ComplianceStatus       `json:"status"`
	RulesPassed []string               `json:"rulesPassed,omitempty"`
	Warnings    []ComplianceViolation  `json:"warnings,omitempty"`
	Blocks      []ComplianceViolation  `json:"blocks,omitempty"`
	CheckedAt   time.Time              `json:"checkedAt"`
}

// ComplianceViolation represents a single compliance violation
type ComplianceViolation struct {
	RuleID      string                 `json:"ruleId"`
	RuleName    string                 `json:"ruleName"`
	Description string                 `json:"description"`
	Metrics     map[string]interface{} `json:"metrics,omitempty"`
}

// CreateOrderRequest represents a request to create a new order
type CreateOrderRequest struct {
	AccountID      string       `json:"accountId"`
	InstrumentID   string       `json:"instrumentId"` // CUSIP
	Side           OrderSide    `json:"side"`
	Quantity       float64      `json:"quantity"`
	OrderType      OrderType    `json:"orderType"`
	LimitPrice     *float64     `json:"limitPrice,omitempty"`
	CurveSpreadBp  *float64     `json:"curveSpreadBp,omitempty"`
	TimeInForce    TimeInForce  `json:"timeInForce"`
	BatchID        *string      `json:"batchId,omitempty"`
	CreatedBy      string       `json:"createdBy"`
}

// AmendOrderRequest represents a request to amend an existing order
type AmendOrderRequest struct {
	OrderID        string      `json:"orderId"`
	Quantity       *float64    `json:"quantity,omitempty"`
	OrderType      *OrderType  `json:"orderType,omitempty"`
	LimitPrice     *float64    `json:"limitPrice,omitempty"`
	CurveSpreadBp  *float64    `json:"curveSpreadBp,omitempty"`
	UpdatedBy      string      `json:"updatedBy"`
}

// ApproveOrderRequest represents a request to approve an order
type ApproveOrderRequest struct {
	OrderID    string `json:"orderId"`
	ApprovedBy string `json:"approvedBy"`
}

// CancelOrderRequest represents a request to cancel an order
type CancelOrderRequest struct {
	OrderID     string `json:"orderId"`
	CancelledBy string `json:"cancelledBy"`
	Reason      string `json:"reason,omitempty"`
}

// SendToEMSRequest represents a request to send an order to EMS
type SendToEMSRequest struct {
	OrderID string `json:"orderId"`
	SentBy  string `json:"sentBy"`
}

// Order represents an order in the system
type Order struct {
	OrderID           string            `json:"orderId"`
	AccountID         string            `json:"accountId"`
	InstrumentID      string            `json:"instrumentId"`
	Side              OrderSide         `json:"side"`
	Quantity          float64           `json:"quantity"`
	OrderType         OrderType         `json:"orderType"`
	LimitPrice        *float64          `json:"limitPrice,omitempty"`
	CurveSpreadBp     *float64          `json:"curveSpreadBp,omitempty"`
	TimeInForce       TimeInForce       `json:"timeInForce"`
	State             OrderState        `json:"state"`
	BatchID           *string           `json:"batchId,omitempty"`
	ComplianceResult  *ComplianceResult `json:"complianceResult,omitempty"`
	CreatedAt         time.Time         `json:"createdAt"`
	CreatedBy         string            `json:"createdBy"`
	UpdatedAt         time.Time         `json:"updatedAt"`
	LastStateChangeAt time.Time         `json:"lastStateChangeAt"`
	SentToEmsAt       *time.Time        `json:"sentToEmsAt,omitempty"`
	FullyFilledAt     *time.Time        `json:"fullyFilledAt,omitempty"`
	SettledAt         *time.Time        `json:"settledAt,omitempty"`
}
