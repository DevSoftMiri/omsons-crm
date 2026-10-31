ALTER TABLE "Note" ADD COLUMN "title" TEXT;
ALTER TABLE "Note" ADD COLUMN "companyId" TEXT;
ALTER TABLE "FollowUp" ADD COLUMN "companyId" TEXT;
ALTER TABLE "FollowUp" ADD COLUMN "noteId" TEXT;
ALTER TABLE "FollowUp" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'TASK';

CREATE TABLE "NoteActivity" (
  "id" TEXT NOT NULL,
  "noteId" TEXT NOT NULL,
  "activityId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NoteActivity_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NoteActivity_noteId_activityId_kind_key" ON "NoteActivity"("noteId", "activityId", "kind");
CREATE INDEX "NoteActivity_activityId_kind_idx" ON "NoteActivity"("activityId", "kind");
ALTER TABLE "Note" ADD CONSTRAINT "Note_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NoteActivity" ADD CONSTRAINT "NoteActivity_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;
