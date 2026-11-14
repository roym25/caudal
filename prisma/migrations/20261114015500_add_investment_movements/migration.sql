-- CreateTable
CREATE TABLE "InvestmentMovement" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "pocketId" INTEGER,
    "pocketName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestmentMovement_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "InvestmentMovement" ADD CONSTRAINT "InvestmentMovement_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "InvestmentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentMovement" ADD CONSTRAINT "InvestmentMovement_pocketId_fkey" FOREIGN KEY ("pocketId") REFERENCES "InvestmentPocket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
