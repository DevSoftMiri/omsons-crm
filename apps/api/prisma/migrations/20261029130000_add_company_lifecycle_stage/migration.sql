ALTER TABLE "Company" ADD COLUMN "lifecycleStage" TEXT NOT NULL DEFAULT 'Subscriber';
CREATE INDEX "Company_lifecycleStage_idx" ON "Company"("lifecycleStage");
