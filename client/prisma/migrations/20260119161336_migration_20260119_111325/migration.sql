-- CreateEnum
CREATE TYPE "order_side" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "order_type" AS ENUM ('MARKET', 'LIMIT', 'CURVE_RELATIVE');

-- CreateEnum
CREATE TYPE "time_in_force" AS ENUM ('DAY', 'IOC');

-- CreateEnum
CREATE TYPE "order_state" AS ENUM ('DRAFT', 'APPROVAL_PENDING', 'APPROVED', 'SENT', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'REJECTED', 'SETTLED');

-- CreateTable
CREATE TABLE "orders" (
    "orderId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "side" "order_side" NOT NULL,
    "quantity" DECIMAL(18,2) NOT NULL,
    "orderType" "order_type" NOT NULL,
    "limitPrice" DECIMAL(10,4),
    "curveSpreadBp" DECIMAL(10,4),
    "timeInForce" "time_in_force" NOT NULL,
    "state" "order_state" NOT NULL DEFAULT 'DRAFT',
    "batchId" TEXT,
    "complianceResult" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastStateChangeAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentToEmsAt" TIMESTAMP(3),
    "fullyFilledAt" TIMESTAMP(3),
    "settledAt" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("orderId")
);

-- CreateIndex
CREATE INDEX "orders_accountId_idx" ON "orders"("accountId");

-- CreateIndex
CREATE INDEX "orders_instrumentId_idx" ON "orders"("instrumentId");

-- CreateIndex
CREATE INDEX "orders_state_idx" ON "orders"("state");

-- CreateIndex
CREATE INDEX "orders_batchId_idx" ON "orders"("batchId");

-- CreateIndex
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");

-- CreateIndex
CREATE INDEX "orders_lastStateChangeAt_idx" ON "orders"("lastStateChangeAt");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("accountId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "instruments"("cusip") ON DELETE RESTRICT ON UPDATE CASCADE;
