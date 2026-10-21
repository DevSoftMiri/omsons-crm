ALTER TABLE "Contact" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "Contact" ADD COLUMN "lifecycleStage" TEXT;
ALTER TABLE "Contact" ADD COLUMN "leadStatus" TEXT;
CREATE INDEX "Contact_ownerId_idx" ON "Contact"("ownerId");
CREATE INDEX "Contact_lifecycleStage_idx" ON "Contact"("lifecycleStage");
CREATE INDEX "Contact_leadStatus_idx" ON "Contact"("leadStatus");
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
