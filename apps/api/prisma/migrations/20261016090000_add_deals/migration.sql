CREATE TABLE "Deal" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "pipeline" TEXT NOT NULL DEFAULT 'Sales Pipeline',
  "stage" TEXT NOT NULL DEFAULT 'Appointment Scheduled',
  "amount" DECIMAL(12,2),
  "closeDate" TIMESTAMP(3),
  "dealType" TEXT,
  "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
  "ownerId" TEXT,
  "contactId" TEXT,
  "companyId" TEXT,
  "lineItems" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Deal_pipeline_stage_idx" ON "Deal"("pipeline", "stage");
CREATE INDEX "Deal_ownerId_idx" ON "Deal"("ownerId");
CREATE INDEX "Deal_closeDate_idx" ON "Deal"("closeDate");
CREATE INDEX "Deal_createdAt_idx" ON "Deal"("createdAt");
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
