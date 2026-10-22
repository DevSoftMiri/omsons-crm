ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "targetAccount" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "idealCustomerProfileTier" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "numberOfBlockers" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "numberOfBuyingRoleContacts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "numberOfDecisionMakers" INTEGER NOT NULL DEFAULT 0;

DO $$ BEGIN
  CREATE TYPE "SegmentObject" AS ENUM ('COMPANY', 'CONTACT', 'DEAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Segment" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "objectType" "SegmentObject" NOT NULL,
  "filters" JSONB NOT NULL DEFAULT '{}',
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Segment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Segment_objectType_idx" ON "Segment"("objectType");
CREATE INDEX IF NOT EXISTS "Segment_isDeleted_idx" ON "Segment"("isDeleted");
CREATE INDEX IF NOT EXISTS "Segment_createdById_idx" ON "Segment"("createdById");
CREATE INDEX IF NOT EXISTS "Segment_updatedAt_idx" ON "Segment"("updatedAt");
DO $$ BEGIN
  ALTER TABLE "Segment" ADD CONSTRAINT "Segment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
