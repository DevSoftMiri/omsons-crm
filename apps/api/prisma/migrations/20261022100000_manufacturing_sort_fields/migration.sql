ALTER TABLE "Company"
  ADD COLUMN IF NOT EXISTS "customerType" TEXT,
  ADD COLUMN IF NOT EXISTS "companySize" TEXT,
  ADD COLUMN IF NOT EXISTS "annualRevenue" DECIMAL(14,2),
  ADD COLUMN IF NOT EXISTS "customerSince" TIMESTAMP(3);

ALTER TABLE "Contact"
  ADD COLUMN IF NOT EXISTS "lastContactedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "nextFollowUpAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "contactSource" TEXT;

ALTER TABLE "Deal"
  ADD COLUMN IF NOT EXISTS "probability" INTEGER,
  ADD COLUMN IF NOT EXISTS "expectedCloseDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "productCategory" TEXT,
  ADD COLUMN IF NOT EXISTS "stageChangedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "lastActivityAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Company_customerType_idx" ON "Company"("customerType");
CREATE INDEX IF NOT EXISTS "Company_companySize_idx" ON "Company"("companySize");
CREATE INDEX IF NOT EXISTS "Company_customerSince_idx" ON "Company"("customerSince");
CREATE INDEX IF NOT EXISTS "Contact_lastContactedAt_idx" ON "Contact"("lastContactedAt");
CREATE INDEX IF NOT EXISTS "Contact_nextFollowUpAt_idx" ON "Contact"("nextFollowUpAt");
CREATE INDEX IF NOT EXISTS "Contact_contactSource_idx" ON "Contact"("contactSource");
CREATE INDEX IF NOT EXISTS "Deal_probability_idx" ON "Deal"("probability");
CREATE INDEX IF NOT EXISTS "Deal_expectedCloseDate_idx" ON "Deal"("expectedCloseDate");
CREATE INDEX IF NOT EXISTS "Deal_productCategory_idx" ON "Deal"("productCategory");
CREATE INDEX IF NOT EXISTS "Deal_stageChangedAt_idx" ON "Deal"("stageChangedAt");
CREATE INDEX IF NOT EXISTS "Deal_lastActivityAt_idx" ON "Deal"("lastActivityAt");

UPDATE "Deal" SET "stageChangedAt" = "updatedAt" WHERE "stageChangedAt" IS NULL;
UPDATE "Deal" SET "lastActivityAt" = "updatedAt" WHERE "lastActivityAt" IS NULL;
