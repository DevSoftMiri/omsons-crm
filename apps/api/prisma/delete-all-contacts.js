const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const before = await prisma.contact.count();
  await prisma.$transaction([
    prisma.deal.updateMany({ where: { contactId: { not: null } }, data: { contactId: null } }),
    prisma.lead.updateMany({ where: { contactId: { not: null } }, data: { contactId: null } }),
    prisma.activity.updateMany({ where: { contactId: { not: null } }, data: { contactId: null } }),
    prisma.note.updateMany({ where: { contactId: { not: null } }, data: { contactId: null } }),
    prisma.contact.deleteMany({})
  ]);
  console.log(`Deleted ${before} contacts.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
