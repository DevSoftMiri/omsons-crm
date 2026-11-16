ALTER TABLE "Company"
  ADD COLUMN "accountSource" TEXT,
  ADD COLUMN "gstNumber" TEXT,
  ADD COLUMN "billingStreet" TEXT,
  ADD COLUMN "billingCity" TEXT,
  ADD COLUMN "billingState" TEXT,
  ADD COLUMN "billingPostalCode" TEXT,
  ADD COLUMN "billingCountry" TEXT,
  ADD COLUMN "shippingStreet" TEXT,
  ADD COLUMN "shippingCity" TEXT,
  ADD COLUMN "shippingState" TEXT,
  ADD COLUMN "shippingPostalCode" TEXT,
  ADD COLUMN "shippingCountry" TEXT,
  ADD COLUMN "shippingSameAsBilling" BOOLEAN NOT NULL DEFAULT false;
