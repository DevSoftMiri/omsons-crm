ALTER TABLE "Company" ADD COLUMN "createdById" TEXT;

CREATE INDEX "Company_createdById_idx" ON "Company"("createdById");

ALTER TABLE "Company" ADD CONSTRAINT "Company_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
