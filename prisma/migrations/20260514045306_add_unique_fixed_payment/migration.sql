/*
  Warnings:

  - A unique constraint covering the columns `[fixedExpenseId,date]` on the table `FixedPayment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "FixedPayment_fixedExpenseId_date_key" ON "FixedPayment"("fixedExpenseId", "date");
