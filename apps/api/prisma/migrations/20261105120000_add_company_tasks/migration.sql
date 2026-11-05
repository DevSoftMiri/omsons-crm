ALTER TABLE "Task" ADD COLUMN "companyId" TEXT;
ALTER TABLE "Task" ADD COLUMN "reminderAt" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN "taskType" TEXT NOT NULL DEFAULT 'TODO';
ALTER TABLE "Task" ADD COLUMN "queue" TEXT;
ALTER TABLE "Task" ADD COLUMN "notes" TEXT;
ALTER TABLE "Task" ALTER COLUMN "priority" DROP NOT NULL;
ALTER TABLE "Task" ADD CONSTRAINT "Task_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Task_companyId_doneAt_dueAt_idx" ON "Task"("companyId", "doneAt", "dueAt");
