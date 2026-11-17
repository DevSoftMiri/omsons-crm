ALTER TABLE "Task" ADD COLUMN "contactId" TEXT;
CREATE INDEX "Task_contactId_doneAt_dueAt_idx" ON "Task"("contactId", "doneAt", "dueAt");
ALTER TABLE "Task" ADD CONSTRAINT "Task_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
