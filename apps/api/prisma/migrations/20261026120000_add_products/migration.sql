CREATE TABLE IF NOT EXISTS "Product" (
  "id" TEXT NOT NULL, "sku" TEXT NOT NULL, "slug" TEXT NOT NULL, "name" TEXT NOT NULL,
  "category" TEXT, "categories" JSONB NOT NULL DEFAULT '[]', "page" INTEGER,
  "features" JSONB NOT NULL DEFAULT '[]', "descriptionHtml" TEXT, "images" JSONB NOT NULL DEFAULT '[]',
  "isArchived" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Product_sku_key" ON "Product"("sku");
CREATE UNIQUE INDEX IF NOT EXISTS "Product_slug_key" ON "Product"("slug");
CREATE INDEX IF NOT EXISTS "Product_name_idx" ON "Product"("name");
CREATE INDEX IF NOT EXISTS "Product_category_idx" ON "Product"("category");
CREATE INDEX IF NOT EXISTS "Product_isArchived_idx" ON "Product"("isArchived");
CREATE TABLE IF NOT EXISTS "ProductVariant" (
  "id" TEXT NOT NULL, "productId" TEXT NOT NULL, "sku" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT,
  "specs" JSONB NOT NULL DEFAULT '{}', "specsText" TEXT, "pack" INTEGER, "price" DECIMAL(14,2),
  "priceLabel" TEXT, "priceBasis" TEXT, "inStock" BOOLEAN NOT NULL DEFAULT false, "images" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProductVariant_sku_key" ON "ProductVariant"("sku");
CREATE INDEX IF NOT EXISTS "ProductVariant_productId_idx" ON "ProductVariant"("productId");
CREATE INDEX IF NOT EXISTS "ProductVariant_inStock_idx" ON "ProductVariant"("inStock");
