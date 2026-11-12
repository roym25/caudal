-- AlterTable
ALTER TABLE "Payroll" ADD COLUMN     "savingsPaidAt" TIMESTAMP(3);

-- Mark existing payroll records as paid out in the previous savings cycle
UPDATE "Payroll" SET "savingsPaidAt" = CURRENT_TIMESTAMP WHERE "savingsPaidAt" IS NULL;
