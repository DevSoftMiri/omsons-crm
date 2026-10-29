-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "activityAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT,
    "type" TEXT,
    "outcome" TEXT,
    "location" TEXT,
    "contactId" TEXT,
    "dealId" TEXT,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Meeting_activityAt_idx" ON "Meeting"("activityAt");
CREATE INDEX "Meeting_ownerId_idx" ON "Meeting"("ownerId");
CREATE INDEX "Meeting_type_idx" ON "Meeting"("type");
CREATE INDEX "Meeting_outcome_idx" ON "Meeting"("outcome");
CREATE INDEX "Meeting_contactId_idx" ON "Meeting"("contactId");
CREATE INDEX "Meeting_dealId_idx" ON "Meeting"("dealId");
CREATE INDEX "Meeting_companyId_idx" ON "Meeting"("companyId");

ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
