-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "annualRevenue" DECIMAL(14,2),
ADD COLUMN     "companySize" TEXT,
ADD COLUMN     "customerSince" TIMESTAMP(3),
ADD COLUMN     "customerType" TEXT;

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "contactSource" TEXT,
ADD COLUMN     "lastContactedAt" TIMESTAMP(3),
ADD COLUMN     "nextFollowUpAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "expectedCloseDate" TIMESTAMP(3),
ADD COLUMN     "lastActivityAt" TIMESTAMP(3),
ADD COLUMN     "probability" INTEGER,
ADD COLUMN     "productCategory" TEXT,
ADD COLUMN     "stageChangedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Company_customerType_idx" ON "Company"("customerType");

-- CreateIndex
CREATE INDEX "Company_companySize_idx" ON "Company"("companySize");

-- CreateIndex
CREATE INDEX "Company_customerSince_idx" ON "Company"("customerSince");

-- CreateIndex
CREATE INDEX "Contact_lastContactedAt_idx" ON "Contact"("lastContactedAt");

-- CreateIndex
CREATE INDEX "Contact_nextFollowUpAt_idx" ON "Contact"("nextFollowUpAt");

-- CreateIndex
CREATE INDEX "Contact_contactSource_idx" ON "Contact"("contactSource");

-- CreateIndex
CREATE INDEX "Deal_probability_idx" ON "Deal"("probability");

-- CreateIndex
CREATE INDEX "Deal_expectedCloseDate_idx" ON "Deal"("expectedCloseDate");

-- CreateIndex
CREATE INDEX "Deal_productCategory_idx" ON "Deal"("productCategory");

-- CreateIndex
CREATE INDEX "Deal_stageChangedAt_idx" ON "Deal"("stageChangedAt");

-- CreateIndex
CREATE INDEX "Deal_lastActivityAt_idx" ON "Deal"("lastActivityAt");
