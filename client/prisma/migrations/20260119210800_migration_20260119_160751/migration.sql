-- CreateEnum
CREATE TYPE "rule_set_status" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "rule_severity" AS ENUM ('BLOCK', 'WARN');

-- CreateEnum
CREATE TYPE "rule_scope" AS ENUM ('GLOBAL', 'HOUSEHOLD', 'ACCOUNT');

-- CreateEnum
CREATE TYPE "rule_status" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED', 'DRAFT');

-- CreateEnum
CREATE TYPE "evaluation_point" AS ENUM ('PRE_TRADE', 'PRE_EXECUTION', 'POST_TRADE');

-- CreateEnum
CREATE TYPE "evaluation_result" AS ENUM ('PASS', 'WARN', 'BLOCK');

-- CreateEnum
CREATE TYPE "violation_status" AS ENUM ('ACTIVE', 'RESOLVED');

-- CreateTable
CREATE TABLE "compliance_rule_sets" (
    "ruleSetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL,
    "status" "rule_set_status" NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "compliance_rule_sets_pkey" PRIMARY KEY ("ruleSetId")
);

-- CreateTable
CREATE TABLE "compliance_rules" (
    "ruleId" TEXT NOT NULL,
    "ruleSetId" TEXT,
    "ruleKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL,
    "severity" "rule_severity" NOT NULL,
    "scope" "rule_scope" NOT NULL,
    "scopeId" TEXT,
    "predicate" JSONB NOT NULL,
    "explanationTemplate" TEXT NOT NULL,
    "evaluationPoints" JSONB NOT NULL,
    "status" "rule_status" NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "evaluationCount" INTEGER NOT NULL DEFAULT 0,
    "violationCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "lastEvaluatedAt" TIMESTAMP(3),
    "lastViolatedAt" TIMESTAMP(3),

    CONSTRAINT "compliance_rules_pkey" PRIMARY KEY ("ruleId")
);

-- CreateTable
CREATE TABLE "compliance_evaluations" (
    "evaluationId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "ruleVersion" INTEGER NOT NULL,
    "orderId" TEXT,
    "accountId" TEXT,
    "evaluationPoint" "evaluation_point" NOT NULL,
    "result" "evaluation_result" NOT NULL,
    "metricValue" DECIMAL(18,6),
    "threshold" DECIMAL(18,6),
    "metricSnapshot" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_evaluations_pkey" PRIMARY KEY ("evaluationId")
);

-- CreateTable
CREATE TABLE "compliance_violations" (
    "violationId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "ruleName" TEXT NOT NULL,
    "ruleVersion" INTEGER NOT NULL,
    "severity" "rule_severity" NOT NULL,
    "scope" "rule_scope" NOT NULL,
    "scopeId" TEXT,
    "orderId" TEXT,
    "accountId" TEXT,
    "evaluationPoint" "evaluation_point" NOT NULL,
    "metricValue" DECIMAL(18,6),
    "threshold" DECIMAL(18,6),
    "status" "violation_status" NOT NULL,
    "explanation" TEXT NOT NULL,
    "metricSnapshot" JSONB NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "compliance_violations_pkey" PRIMARY KEY ("violationId")
);

-- CreateIndex
CREATE INDEX "compliance_rule_sets_status_idx" ON "compliance_rule_sets"("status");

-- CreateIndex
CREATE INDEX "compliance_rule_sets_effectiveFrom_effectiveTo_idx" ON "compliance_rule_sets"("effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE UNIQUE INDEX "compliance_rules_ruleKey_key" ON "compliance_rules"("ruleKey");

-- CreateIndex
CREATE INDEX "compliance_rules_ruleSetId_idx" ON "compliance_rules"("ruleSetId");

-- CreateIndex
CREATE INDEX "compliance_rules_ruleKey_idx" ON "compliance_rules"("ruleKey");

-- CreateIndex
CREATE INDEX "compliance_rules_scope_scopeId_idx" ON "compliance_rules"("scope", "scopeId");

-- CreateIndex
CREATE INDEX "compliance_rules_status_idx" ON "compliance_rules"("status");

-- CreateIndex
CREATE INDEX "compliance_rules_effectiveFrom_effectiveTo_idx" ON "compliance_rules"("effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE INDEX "compliance_evaluations_ruleId_idx" ON "compliance_evaluations"("ruleId");

-- CreateIndex
CREATE INDEX "compliance_evaluations_orderId_idx" ON "compliance_evaluations"("orderId");

-- CreateIndex
CREATE INDEX "compliance_evaluations_accountId_idx" ON "compliance_evaluations"("accountId");

-- CreateIndex
CREATE INDEX "compliance_evaluations_evaluationPoint_idx" ON "compliance_evaluations"("evaluationPoint");

-- CreateIndex
CREATE INDEX "compliance_evaluations_evaluatedAt_idx" ON "compliance_evaluations"("evaluatedAt");

-- CreateIndex
CREATE INDEX "compliance_violations_ruleId_idx" ON "compliance_violations"("ruleId");

-- CreateIndex
CREATE INDEX "compliance_violations_orderId_idx" ON "compliance_violations"("orderId");

-- CreateIndex
CREATE INDEX "compliance_violations_accountId_idx" ON "compliance_violations"("accountId");

-- CreateIndex
CREATE INDEX "compliance_violations_evaluationPoint_idx" ON "compliance_violations"("evaluationPoint");

-- CreateIndex
CREATE INDEX "compliance_violations_status_idx" ON "compliance_violations"("status");

-- CreateIndex
CREATE INDEX "compliance_violations_evaluatedAt_idx" ON "compliance_violations"("evaluatedAt");

-- AddForeignKey
ALTER TABLE "compliance_rules" ADD CONSTRAINT "compliance_rules_ruleSetId_fkey" FOREIGN KEY ("ruleSetId") REFERENCES "compliance_rule_sets"("ruleSetId") ON DELETE SET NULL ON UPDATE CASCADE;
