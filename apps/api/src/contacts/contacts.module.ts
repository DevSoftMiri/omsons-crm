import { Body, Controller, Delete, Get, Module, NotFoundException, Param, Post, Query } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { PrismaService } from "../prisma/prisma.service";

@Controller("contacts")
class ContactsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query("search") search = "") {
    const value = search.trim();
    return this.prisma.contact.findMany({
      where: value
        ? {
            OR: [
              { firstName: { contains: value, mode: "insensitive" } },
              { lastName: { contains: value, mode: "insensitive" } },
              { email: { contains: value, mode: "insensitive" } },
            ],
          }
        : undefined,
      include: {
        company: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true,
        title: true, department: true, roleInPurchase: true, lifecycleStage: true,
        leadStatus: true, contactSource: true, lastContactedAt: true, nextFollowUpAt: true,
        createdAt: true, updatedAt: true,
        owner: { select: { id: true, name: true } },
        company: {
          select: {
            id: true, name: true, industry: true, phone: true, city: true, state: true,
            country: true, owner: { select: { id: true, name: true } },
          },
        },
        deals: {
          orderBy: { updatedAt: "desc" }, take: 20,
          select: { id: true, name: true, stage: true, amount: true, closeDate: true, pipeline: true },
        },
        activities: {
          orderBy: { createdAt: "desc" }, take: 50,
          select: { id: true, type: true, subject: true, body: true, createdAt: true, user: { select: { id: true, name: true } } },
        },
      },
    });
    if (!contact) throw new NotFoundException("Contact not found");
    return contact;
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.prisma.contact.findUniqueOrThrow({ where: { id }, select: { id: true } });
    return this.prisma.contact.delete({ where: { id } });
  }

  @Post()
  async create(@Body() body: Record<string, unknown>) {
    const firstName = String(body.firstName ?? "").trim();
    if (!firstName)
      return { statusCode: 400, message: "First name is required" };
    const requestedOwner = String(body.ownerId ?? body.owner ?? "").trim();
    const owner = requestedOwner
      ? await this.prisma.user.findFirst({
          where: { OR: [{ id: requestedOwner }, { name: { equals: requestedOwner, mode: "insensitive" } }] },
          select: { id: true },
        })
      : null;
    return this.prisma.contact.create({
      data: {
        firstName,
        lastName: String(body.lastName ?? "").trim() || null,
        email: String(body.email ?? "").trim() || null,
        phone: String(body.phone ?? "").trim() || null,
        title: String(body.title ?? "").trim() || null,
        department: String(body.department ?? "").trim() || null,
        roleInPurchase: String(body.roleInPurchase ?? "").trim() || null,
        lifecycleStage: String(body.lifecycleStage ?? "").trim() || null,
        leadStatus: String(body.leadStatus ?? "").trim() || null,
        contactSource: String(body.contactSource ?? "").trim() || null,
        ownerId: owner?.id ?? null,
        companyId:
          typeof body.companyId === "string" && body.companyId
            ? body.companyId
            : null,
      },
    });
  }
}

@Module({ imports: [PrismaModule], controllers: [ContactsController] })
export class ContactsModule {}
