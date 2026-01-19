package ems

import "time"

// ExecutionStatus represents the status of an execution.
type ExecutionStatus string

const (
	ExecutionStatusPending         ExecutionStatus = "PENDING"
	ExecutionStatusSimulating      ExecutionStatus = "SIMULATING"
	ExecutionStatusPartiallyFilled ExecutionStatus = "PARTIALLY_FILLED"
	ExecutionStatusFilled          ExecutionStatus = "FILLED"
	ExecutionStatusSettled         ExecutionStatus = "SETTLED"
	ExecutionStatusCancelled       ExecutionStatus = "CANCELLED"
)

// RequestExecutionRequest represents a manual execution request.
type RequestExecutionRequest struct {
	OrderID     string     `json:"orderId"`
	RequestedBy string     `json:"requestedBy"`
	AsOfDate    *time.Time `json:"asOfDate,omitempty"`
}
