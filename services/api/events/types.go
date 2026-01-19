package events

import (
	"encoding/json"
	"time"
)

// AggregateType constants
const (
	AggregateInstrument       = "Instrument"
	AggregateMarketData       = "MarketData"
	AggregateOrder            = "Order"
	AggregateExecution        = "Execution"
	AggregateAccount          = "Account"
	AggregatePortfolio        = "Portfolio"
	AggregateProposal         = "Proposal"
	AggregateRuleSet          = "RuleSet"
	AggregateRule             = "Rule"
	AggregateRoutingPolicy    = "RoutingPolicy"
	AggregateUploadBatch      = "UploadBatch"
	AggregateAIDraft          = "AIDraft"
)

// EventType constants - Market Data
const (
	EventMarketDataCurveIngested    = "MarketDataCurveIngested"
	EventMarketDataAsOfDateSelected = "MarketDataAsOfDateSelected"
	EventInstrumentIngested         = "InstrumentIngested"
	EventInstrumentUpdated          = "InstrumentUpdated"
)

// EventType constants - Pricing
const (
	EventPricingInputsResolved  = "PricingInputsResolved"
	EventEvaluatedPriceComputed = "EvaluatedPriceComputed"
	EventRiskMetricsComputed    = "RiskMetricsComputed"
)

// EventType constants - OMS
const (
	EventUploadBatchReceived    = "UploadBatchReceived"
	EventUploadBatchValidated   = "UploadBatchValidated"
	EventOrderCreated           = "OrderCreated"
	EventOrderAmended           = "OrderAmended"
	EventOrderCancelled         = "OrderCancelled"
	EventOrderApprovalRequested = "OrderApprovalRequested"
	EventOrderApproved          = "OrderApproved"
	EventOrderRejected          = "OrderRejected"
	EventOrderSentToEMS         = "OrderSentToEMS"
)

// EventType constants - Compliance
const (
	EventRuleSetPublished           = "RuleSetPublished"
	EventRuleCreated                = "RuleCreated"
	EventRuleUpdated                = "RuleUpdated"
	EventRuleDeleted                = "RuleDeleted"
	EventRuleEnabled                = "RuleEnabled"
	EventRuleDisabled               = "RuleDisabled"
	EventRuleEvaluated              = "RuleEvaluated"
	EventRuleViolationDetected      = "RuleViolationDetected"
	EventOrderBlockedByCompliance   = "OrderBlockedByCompliance"
	EventOrderWarnedByCompliance    = "OrderWarnedByCompliance"
	EventExecutionBlockedByCompliance = "ExecutionBlockedByCompliance"
)

// EventType constants - EMS / Execution Simulation
const (
	EventExecutionRequested  = "ExecutionRequested"
	EventExecutionSimulated  = "ExecutionSimulated"
	EventFillGenerated       = "FillGenerated"
	EventOrderPartiallyFilled = "OrderPartiallyFilled"
	EventOrderFullyFilled    = "OrderFullyFilled"
	EventSettlementBooked    = "SettlementBooked"
)

// EventType constants - PMS
const (
	EventAccountCreated       = "AccountCreated"
	EventPositionUpdated      = "PositionUpdated"
	EventTargetSet            = "TargetSet"
	EventOptimizationRequested = "OptimizationRequested"
	EventProposalGenerated    = "ProposalGenerated"
	EventProposalApproved     = "ProposalApproved"
	EventProposalSentToOMS    = "ProposalSentToOMS"
)

// EventType constants - Copilot
const (
	EventAIDraftProposed = "AIDraftProposed"
	EventAIDraftApproved = "AIDraftApproved"
	EventAIDraftRejected = "AIDraftRejected"
)

// Actor represents the entity that triggered the event
type Actor struct {
	ActorID string `json:"actorId"`
	Role    string `json:"role"`
}

// Aggregate represents the domain object the event is about
type Aggregate struct {
	Type string `json:"type"`
	ID   string `json:"id"`
}

// Event represents the complete event envelope
type Event struct {
	EventID       string                 `json:"eventId"`
	EventType     string                 `json:"eventType"`
	OccurredAt    time.Time              `json:"occurredAt"`
	Actor         Actor                  `json:"actor"`
	Aggregate     Aggregate              `json:"aggregate"`
	CorrelationID string                 `json:"correlationId"`
	CausationID   *string                `json:"causationId,omitempty"`
	Payload       map[string]interface{} `json:"payload"`
	Explanation   *string                `json:"explanation,omitempty"`
	SchemaVersion int                    `json:"schemaVersion"`
}

// NewEvent creates a new event with required fields
func NewEvent(
	eventType string,
	aggregateType string,
	aggregateID string,
	actorID string,
	actorRole string,
	correlationID string,
	payload map[string]interface{},
) *Event {
	return &Event{
		EventType:     eventType,
		OccurredAt:    time.Now().UTC(),
		Actor:         Actor{ActorID: actorID, Role: actorRole},
		Aggregate:     Aggregate{Type: aggregateType, ID: aggregateID},
		CorrelationID: correlationID,
		Payload:       payload,
		SchemaVersion: 1,
	}
}

// WithExplanation adds an explanation to the event
func (e *Event) WithExplanation(explanation string) *Event {
	e.Explanation = &explanation
	return e
}

// WithCausation adds a causation ID to the event
func (e *Event) WithCausation(causationID string) *Event {
	e.CausationID = &causationID
	return e
}

// ToJSON serializes the event to JSON
func (e *Event) ToJSON() ([]byte, error) {
	return json.Marshal(e)
}

// FromJSON deserializes an event from JSON
func FromJSON(data []byte) (*Event, error) {
	var event Event
	err := json.Unmarshal(data, &event)
	if err != nil {
		return nil, err
	}
	return &event, nil
}

// PayloadToJSON serializes just the payload to JSON
func (e *Event) PayloadToJSON() ([]byte, error) {
	return json.Marshal(e.Payload)
}
