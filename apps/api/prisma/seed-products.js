const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const catalogPath = path.resolve(__dirname, "../../web/public/omsons_catalog_2026-27.json");

async function main() {
  const products = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: {
        id: product.id, sku: product.sku, slug: product.slug, name: product.name,
        category: product.category || null, categories: product.categories || [], page: product.page || null,
        features: product.features || [], descriptionHtml: product.descriptionHtml || null, images: product.images || [],
        variants: { create: (product.variants || []).map((variant) => ({
          id: variant.id, sku: variant.sku, name: variant.name, slug: variant.slug || null,
          specs: variant.specs || {}, specsText: variant.specsText || null, pack: variant.pack ?? null,
          price: variant.price ?? null, priceLabel: variant.priceLabel || null, priceBasis: variant.priceBasis || null,
          inStock: Boolean(variant.inStock), images: variant.images || []
        })) }
      }
    });
  }
  console.log(`Imported ${products.length} products`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
