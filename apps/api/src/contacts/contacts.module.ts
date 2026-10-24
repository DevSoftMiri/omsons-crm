import { Body, Controller, Get, Module, Post, Query } from "@nestjs/common";
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

  @Post()
  async create(@Body() body: Record<string, unknown>) {
    const firstName = String(body.firstName ?? "").trim();
    if (!firstName)
      return { statusCode: 400, message: "First name is required" };
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
        ownerId:
          typeof body.ownerId === "string" && body.ownerId
            ? body.ownerId
            : null,
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
