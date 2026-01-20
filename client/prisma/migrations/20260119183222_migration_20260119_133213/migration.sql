-- CreateTable
CREATE TABLE "positions" (
    "accountId" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "avgCost" DECIMAL(18,6) NOT NULL,
    "marketValue" DECIMAL(18,6) NOT NULL,
    "duration" DECIMAL(12,6) NOT NULL,
    "dv01" DECIMAL(18,6) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("accountId","instrumentId")
);

-- CreateIndex
CREATE INDEX "positions_accountId_idx" ON "positions"("accountId");

-- CreateIndex
CREATE INDEX "positions_instrumentId_idx" ON "positions"("instrumentId");

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("accountId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "instruments"("cusip") ON DELETE RESTRICT ON UPDATE CASCADE;
