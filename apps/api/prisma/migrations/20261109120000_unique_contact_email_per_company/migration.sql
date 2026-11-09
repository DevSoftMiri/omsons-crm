DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Contact"
    WHERE "companyId" IS NOT NULL AND "email" IS NOT NULL
    GROUP BY "companyId", LOWER("email")
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate contact emails exist within a company; clean them before applying this migration';
  END IF;
END $$;

CREATE UNIQUE INDEX "Contact_companyId_email_key" ON "Contact"("companyId", "email");
