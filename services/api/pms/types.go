package pms

import "time"

type TargetScope string

const (
	TargetScopeAccount   TargetScope = "account"
	TargetScopeHousehold TargetScope = "household"
)

type ProposalStatus string

const (
	ProposalStatusDraft     ProposalStatus = "DRAFT"
	ProposalStatusApproved  ProposalStatus = "APPROVED"
	ProposalStatusRejected  ProposalStatus = "REJECTED"
	ProposalStatusSentToOMS ProposalStatus = "SENT_TO_OMS"
)

type BucketWeights map[string]float64

type TargetConstraints struct {
	MinPositionSize *float64 `json:"minPositionSize,omitempty"`
	MaxPositionSize *float64 `json:"maxPositionSize,omitempty"`
	MaxTurnover     *float64 `json:"maxTurnover,omitempty"`
	Blacklist       []string `json:"blacklist,omitempty"`
}

type PortfolioAnalytics struct {
	TotalMarketValue float64       `json:"totalMarketValue"`
	TotalDuration    float64       `json:"totalDuration"`
	TotalDv01        float64       `json:"totalDv01"`
	CashBalance      float64       `json:"cashBalance"`
	CashPercentage   float64       `json:"cashPercentage"`
	BucketWeights    BucketWeights `json:"bucketWeights"`
}

type ProposalTrade struct {
	Side           string  `json:"side"`
	InstrumentID   string  `json:"instrumentId"`
	Cusip          string  `json:"cusip,omitempty"`
	Description    string  `json:"description,omitempty"`
	Quantity       float64 `json:"quantity"`
	EstimatedPrice float64 `json:"estimatedPrice"`
	EstimatedValue float64 `json:"estimatedValue"`
}

type SetTargetRequest struct {
	TargetID       string            `json:"targetId,omitempty"`
	Scope          TargetScope       `json:"scope"`
	ScopeID        string            `json:"scopeId"`
	ModelID        *string           `json:"modelId,omitempty"`
	DurationTarget float64           `json:"durationTarget"`
	BucketWeights  BucketWeights     `json:"bucketWeights"`
	Constraints    *TargetConstraints `json:"constraints,omitempty"`
	EffectiveFrom  time.Time         `json:"effectiveFrom"`
	EffectiveTo    *time.Time        `json:"effectiveTo,omitempty"`
	CreatedBy      string            `json:"createdBy"`
}

type RunOptimizationRequest struct {
	Scope          TargetScope       `json:"scope"`
	ScopeID        string            `json:"scopeId"`
	TargetID       *string           `json:"targetId,omitempty"`
	ModelID        *string           `json:"modelId,omitempty"`
	DurationTarget float64           `json:"durationTarget"`
	BucketWeights  BucketWeights     `json:"bucketWeights"`
	Constraints    *TargetConstraints `json:"constraints,omitempty"`
	Assumptions    string            `json:"assumptions"`
	AsOfDate       *time.Time        `json:"asOfDate,omitempty"`
	RequestedBy    string            `json:"requestedBy"`
}

type ApproveProposalRequest struct {
	ProposalID string `json:"proposalId"`
	ApprovedBy string `json:"approvedBy"`
}

type SendProposalToOMSRequest struct {
	ProposalID string `json:"proposalId"`
	SentBy     string `json:"sentBy"`
}
