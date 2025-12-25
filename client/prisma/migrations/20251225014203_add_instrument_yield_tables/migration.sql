-- CreateEnum
CREATE TYPE "instrument_type" AS ENUM ('bill', 'note', 'bond', 'tips');

-- CreateTable
CREATE TABLE "instruments" (
    "id" TEXT NOT NULL,
    "cusip" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "type" "instrument_type" NOT NULL,
    "coupon" DECIMAL(10,4) NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "maturityDate" TIMESTAMP(3) NOT NULL,
    "couponFrequency" INTEGER NOT NULL,
    "askModifiedDuration" DECIMAL(12,9) NOT NULL,
    "bidModifiedDuration" DECIMAL(12,9) NOT NULL,
    "askYieldToMaturity" DECIMAL(10,8) NOT NULL,
    "askPrice" DECIMAL(10,4) NOT NULL,
    "maturityType" TEXT NOT NULL,
    "issuedAmount" BIGINT NOT NULL,
    "outstandingAmount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "standardPoorRating" TEXT,
    "moodyRating" TEXT,
    "fitchRating" TEXT,
    "dbrsRating" TEXT,
    "series" TEXT,
    "bloombergCompositeRating" TEXT,
    "announce" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instruments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yield_curves" (
    "id" TEXT NOT NULL,
    "asOfDate" TIMESTAMP(3) NOT NULL,
    "tenor" TEXT NOT NULL,
    "parYield" DECIMAL(10,8) NOT NULL,
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "yield_curves_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "instruments_cusip_key" ON "instruments"("cusip");

-- CreateIndex
CREATE INDEX "yield_curves_asOfDate_idx" ON "yield_curves"("asOfDate");

-- CreateIndex
CREATE UNIQUE INDEX "yield_curves_asOfDate_tenor_key" ON "yield_curves"("asOfDate", "tenor");
