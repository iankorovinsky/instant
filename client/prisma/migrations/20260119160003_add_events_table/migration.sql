-- CreateEnum
CREATE TYPE "account_type" AS ENUM ('individual', 'joint', 'trust', 'ira', 'k401', 'corporate');

-- CreateEnum
CREATE TYPE "target_scope" AS ENUM ('account', 'household');

-- CreateEnum
CREATE TYPE "proposal_status" AS ENUM ('DRAFT', 'APPROVED', 'REJECTED', 'SENT_TO_OMS');

-- CreateEnum
CREATE TYPE "rebalancing_rule_type" AS ENUM ('DRIFT_BASED', 'TIME_BASED', 'EVENT_BASED');

-- CreateEnum
CREATE TYPE "rebalancing_scope" AS ENUM ('account', 'household', 'all');

-- CreateTable
CREATE TABLE "events" (
    "eventId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "causationId" TEXT,
    "actorId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "explanation" TEXT,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "events_pkey" PRIMARY KEY ("eventId")
);

-- CreateTable
CREATE TABLE "households" (
    "householdId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "households_pkey" PRIMARY KEY ("householdId")
);

-- CreateTable
CREATE TABLE "accounts" (
    "accountId" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accountType" "account_type" NOT NULL,
    "modelId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("accountId")
);

-- CreateTable
CREATE TABLE "portfolio_models" (
    "modelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "durationTarget" DECIMAL(10,4) NOT NULL,
    "bucketWeights" JSONB NOT NULL,
    "constraints" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "portfolio_models_pkey" PRIMARY KEY ("modelId")
);

-- CreateTable
CREATE TABLE "portfolio_targets" (
    "targetId" TEXT NOT NULL,
    "scope" "target_scope" NOT NULL,
    "scopeId" TEXT NOT NULL,
    "modelId" TEXT,
    "durationTarget" DECIMAL(10,4) NOT NULL,
    "bucketWeights" JSONB NOT NULL,
    "constraints" JSONB,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "accountId" TEXT,

    CONSTRAINT "portfolio_targets_pkey" PRIMARY KEY ("targetId")
);

-- CreateTable
CREATE TABLE "proposals" (
    "proposalId" TEXT NOT NULL,
    "accountId" TEXT,
    "householdId" TEXT,
    "asOfDate" TIMESTAMP(3) NOT NULL,
    "targetId" TEXT,
    "trades" JSONB NOT NULL,
    "currentAnalytics" JSONB NOT NULL,
    "predictedAnalytics" JSONB NOT NULL,
    "assumptions" TEXT NOT NULL,
    "status" "proposal_status" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "sentToOmsAt" TIMESTAMP(3),

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("proposalId")
);

-- CreateTable
CREATE TABLE "rebalancing_rules" (
    "ruleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "rebalancing_rule_type" NOT NULL,
    "scope" "rebalancing_scope" NOT NULL,
    "scopeId" TEXT,
    "modelId" TEXT,
    "driftThreshold" DECIMAL(5,2),
    "schedule" TEXT,
    "autoApprove" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "lastTriggeredAt" TIMESTAMP(3),

    CONSTRAINT "rebalancing_rules_pkey" PRIMARY KEY ("ruleId")
);

-- CreateIndex
CREATE INDEX "events_occurredAt_idx" ON "events"("occurredAt");

-- CreateIndex
CREATE INDEX "events_eventType_idx" ON "events"("eventType");

-- CreateIndex
CREATE INDEX "events_aggregateType_idx" ON "events"("aggregateType");

-- CreateIndex
CREATE INDEX "events_aggregateId_idx" ON "events"("aggregateId");

-- CreateIndex
CREATE INDEX "events_correlationId_idx" ON "events"("correlationId");

-- CreateIndex
CREATE INDEX "events_aggregateType_aggregateId_idx" ON "events"("aggregateType", "aggregateId");

-- CreateIndex
CREATE INDEX "households_createdAt_idx" ON "households"("createdAt");

-- CreateIndex
CREATE INDEX "accounts_householdId_idx" ON "accounts"("householdId");

-- CreateIndex
CREATE INDEX "accounts_modelId_idx" ON "accounts"("modelId");

-- CreateIndex
CREATE INDEX "accounts_createdAt_idx" ON "accounts"("createdAt");

-- CreateIndex
CREATE INDEX "portfolio_models_createdAt_idx" ON "portfolio_models"("createdAt");

-- CreateIndex
CREATE INDEX "portfolio_targets_scope_scopeId_idx" ON "portfolio_targets"("scope", "scopeId");

-- CreateIndex
CREATE INDEX "portfolio_targets_modelId_idx" ON "portfolio_targets"("modelId");

-- CreateIndex
CREATE INDEX "portfolio_targets_accountId_idx" ON "portfolio_targets"("accountId");

-- CreateIndex
CREATE INDEX "portfolio_targets_effectiveFrom_effectiveTo_idx" ON "portfolio_targets"("effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE INDEX "proposals_accountId_idx" ON "proposals"("accountId");

-- CreateIndex
CREATE INDEX "proposals_householdId_idx" ON "proposals"("householdId");

-- CreateIndex
CREATE INDEX "proposals_status_idx" ON "proposals"("status");

-- CreateIndex
CREATE INDEX "proposals_createdAt_idx" ON "proposals"("createdAt");

-- CreateIndex
CREATE INDEX "rebalancing_rules_enabled_idx" ON "rebalancing_rules"("enabled");

-- CreateIndex
CREATE INDEX "rebalancing_rules_type_idx" ON "rebalancing_rules"("type");

-- CreateIndex
CREATE INDEX "rebalancing_rules_scope_scopeId_idx" ON "rebalancing_rules"("scope", "scopeId");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("householdId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "portfolio_models"("modelId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_targets" ADD CONSTRAINT "portfolio_targets_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "portfolio_models"("modelId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_targets" ADD CONSTRAINT "portfolio_targets_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("accountId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("accountId") ON DELETE SET NULL ON UPDATE CASCADE;
