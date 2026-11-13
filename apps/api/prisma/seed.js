const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const prisma = new PrismaClient();

async function main() {
  const source = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../../staff.json"), "utf8"));
  const roleCache = new Map();
  const roleFor = async (designation) => {
    const name = String(designation || "Staff").trim().replace(/\s+/g, " ") || "Staff";
    if (!roleCache.has(name)) roleCache.set(name, await prisma.role.upsert({ where: { name }, update: {}, create: { name, description: `Imported from staff designation: ${name}` } }));
    return roleCache.get(name);
  };
  let user;
  for (const staff of source.Staff || []) {
    const email = String(staff.staff_email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) continue;
    const role = await roleFor(staff.staff_designation);
    const passwordHash = await bcrypt.hash(email, 12);
    const created = await prisma.user.upsert({ where: { email }, update: { name: String(staff.staff_name || email).trim(), passwordHash, isActive: true }, create: { email, name: String(staff.staff_name || email).trim(), passwordHash } });
    await prisma.userRole.upsert({ where: { userId_roleId: { userId: created.id, roleId: role.id } }, update: {}, create: { userId: created.id, roleId: role.id } });
  }
  const adminRole = await prisma.role.upsert({ where: { name: "admin" }, update: {}, create: { name: "admin", description: "Full CRM access" } });
  const adminPasswordHash = await bcrypt.hash("admin@omsons.com", 12);
  user = await prisma.user.upsert({ where: { email: "admin@omsons.com" }, update: { name: "Omsons Admin", passwordHash: adminPasswordHash, isActive: true }, create: { email: "admin@omsons.com", name: "Omsons Admin", passwordHash: adminPasswordHash } });
  await prisma.userRole.upsert({ where: { userId_roleId: { userId: user.id, roleId: adminRole.id } }, update: {}, create: { userId: user.id, roleId: adminRole.id } });
  const main = await prisma.company.upsert({ where: { id: "seed-main-company" }, update: {}, create: { id: "seed-main-company", name: "Acme Industries", industry: "Technology", country: "India", regions: ["North", "West"], ownerId: user.id } });
  const sub = await prisma.company.upsert({ where: { id: "seed-sub-company" }, update: { parentCompanyId: main.id }, create: { id: "seed-sub-company", name: "Acme Manufacturing", industry: "Manufacturing", country: "India", regions: ["South"], parentCompanyId: main.id, ownerId: user.id } });
  await prisma.deal.upsert({ where: { id: "seed-deal" }, update: { companyId: main.id, contactId: null }, create: { id: "seed-deal", name: "Acme Expansion", companyId: main.id, contactId: null, amount: 250000 } });
  console.log(`Seeded ${main.name}, ${sub.name}, and admin user ${user.email}`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
