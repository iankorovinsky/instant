-- CreateEnum
CREATE TYPE "execution_status" AS ENUM (
  'PENDING',
  'SIMULATING',
  'PARTIALLY_FILLED',
  'FILLED',
  'SETTLED',
  'CANCELLED'
);

-- CreateTable
CREATE TABLE "executions" (
    "executionId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "side" "order_side" NOT NULL,
    "totalQuantity" DECIMAL(18,2) NOT NULL,
    "filledQuantity" DECIMAL(18,2) NOT NULL,
    "avgFillPrice" DECIMAL(10,4),
    "status" "execution_status" NOT NULL DEFAULT 'PENDING',
    "asOfDate" TIMESTAMP(3) NOT NULL,
    "executionStartTime" TIMESTAMP(3),
    "executionEndTime" TIMESTAMP(3),
    "settlementDate" TIMESTAMP(3),
    "settledDate" TIMESTAMP(3),
    "slippageTotal" DECIMAL(12,6),
    "slippageBreakdown" JSONB,
    "deterministicInputs" JSONB,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "executions_pkey" PRIMARY KEY ("executionId")
);

-- CreateTable
CREATE TABLE "fills" (
    "fillId" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "clipIndex" INT NOT NULL,
    "quantity" DECIMAL(18,2) NOT NULL,
    "price" DECIMAL(10,4) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "slippage" DECIMAL(12,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fills_pkey" PRIMARY KEY ("fillId")
);

-- CreateIndex
CREATE INDEX "executions_orderId_idx" ON "executions"("orderId");

-- CreateIndex
CREATE INDEX "executions_accountId_idx" ON "executions"("accountId");

-- CreateIndex
CREATE INDEX "executions_instrumentId_idx" ON "executions"("instrumentId");

-- CreateIndex
CREATE INDEX "executions_status_idx" ON "executions"("status");

-- CreateIndex
CREATE INDEX "executions_asOfDate_idx" ON "executions"("asOfDate");

-- CreateIndex
CREATE INDEX "fills_executionId_idx" ON "fills"("executionId");

-- CreateIndex
CREATE INDEX "fills_timestamp_idx" ON "fills"("timestamp");

-- AddForeignKey
ALTER TABLE "executions" ADD CONSTRAINT "executions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("orderId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executions" ADD CONSTRAINT "executions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("accountId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executions" ADD CONSTRAINT "executions_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "instruments"("cusip") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fills" ADD CONSTRAINT "fills_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "executions"("executionId") ON DELETE CASCADE ON UPDATE CASCADE;
