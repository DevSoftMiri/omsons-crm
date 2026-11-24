CREATE SEQUENCE "Company_accountNumber_seq";

ALTER TABLE "Company" ADD COLUMN "accountNumber" INTEGER;

UPDATE "Company"
SET "accountNumber" = nextval('"Company_accountNumber_seq"')
WHERE "accountNumber" IS NULL;

ALTER SEQUENCE "Company_accountNumber_seq" OWNED BY "Company"."accountNumber";
ALTER TABLE "Company" ALTER COLUMN "accountNumber" SET DEFAULT nextval('"Company_accountNumber_seq"');
ALTER TABLE "Company" ALTER COLUMN "accountNumber" SET NOT NULL;
CREATE UNIQUE INDEX "Company_accountNumber_key" ON "Company"("accountNumber");
