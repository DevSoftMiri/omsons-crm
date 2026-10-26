const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("ChangeMe123!", 10);
  const user = await prisma.user.upsert({ where: { email: "admin@omsons.local" }, update: {}, create: { email: "admin@omsons.local", name: "CRM Admin", passwordHash } });
  const main = await prisma.company.upsert({ where: { id: "seed-main-company" }, update: {}, create: { id: "seed-main-company", name: "Acme Industries", industry: "Technology", country: "India", regions: ["North", "West"], ownerId: user.id } });
  const sub = await prisma.company.upsert({ where: { id: "seed-sub-company" }, update: { parentCompanyId: main.id }, create: { id: "seed-sub-company", name: "Acme Manufacturing", industry: "Manufacturing", country: "India", regions: ["South"], parentCompanyId: main.id, ownerId: user.id } });
  await prisma.deal.upsert({ where: { id: "seed-deal" }, update: { companyId: main.id, contactId: null }, create: { id: "seed-deal", name: "Acme Expansion", companyId: main.id, contactId: null, amount: 250000 } });
  console.log(`Seeded ${main.name}, ${sub.name}, and admin user ${user.email}`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
