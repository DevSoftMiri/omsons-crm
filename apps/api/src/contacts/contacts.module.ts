import { Body, ConflictException, Controller, Delete, Get, Module, NotFoundException, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { PrismaModule } from "../prisma/prisma.module";
import { PrismaService } from "../prisma/prisma.service";

@Controller("contacts")
class ContactsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query("search") search = "", @Query("companyId") companyId = "") {
    const value = search.trim();
    return this.prisma.contact.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        ...(value
        ? {
            OR: [
              { firstName: { contains: value, mode: "insensitive" } },
              { lastName: { contains: value, mode: "insensitive" } },
              { email: { contains: value, mode: "insensitive" } },
            ],
          }
        : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        leadStatus: true,
        contactSource: true,
        lifecycleStage: true,
        createdAt: true,
        title: true,
        department: true,
        roleInPurchase: true,
        owner: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
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
        title: true, department: true, roleInPurchase: true, lifecycleStage: true, salutation: true, mobile: true, reportsTo: true, authorityLevel: true, description: true, sameAsCompanyAddress: true, mailingCountry: true, mailingStreet: true, mailingAddress2: true, mailingCity: true, mailingState: true, mailingPostalCode: true,
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
    const safeQuery = async <T>(query: Promise<T>, fallback: T) => query.catch(() => fallback);
    const [notes, meetings, tasks] = await Promise.all([
      safeQuery(this.prisma.note.findMany({ where: { contactId: id }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, title: true, body: true, createdAt: true, updatedAt: true, author: { select: { id: true, name: true } } } }), []),
      safeQuery(this.prisma.meeting.findMany({ where: { contactId: id }, orderBy: { activityAt: "desc" }, take: 50, select: { id: true, name: true, activityAt: true, type: true, outcome: true, location: true, createdAt: true, owner: { select: { id: true, name: true } } } }), []),
      safeQuery(this.prisma.task.findMany({ where: { contactId: id }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, title: true, dueAt: true, status: true, priority: true, doneAt: true, createdAt: true, updatedAt: true, assignee: { select: { id: true, name: true } } } }), []),
    ]);
    return { ...contact, notes, meetings, tasks };
  }

  @Post(":id/activities")
  @UseGuards(JwtAuthGuard)
  async createActivity(@Param("id") id: string, @Body() body: Record<string, unknown>, @CurrentUser() user?: { sub: string }) {
    await this.prisma.contact.findUniqueOrThrow({ where: { id }, select: { id: true } });
    const type = String(body.type ?? "").toUpperCase();
    if (!["NOTE", "CALL", "EMAIL"].includes(type)) throw new ConflictException("Activity type must be NOTE, CALL, or EMAIL");
    const subject = String(body.subject ?? "").trim();
    if (!subject) throw new ConflictException("Activity subject is required");
    return this.prisma.activity.create({
      data: { type: type as "NOTE" | "CALL" | "EMAIL", subject, body: String(body.body ?? "").trim() || null, contactId: id, userId: user?.sub ?? null },
      include: { user: { select: { id: true, name: true } } },
    });
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.prisma.contact.findUniqueOrThrow({ where: { id }, select: { id: true } });
    return this.prisma.contact.delete({ where: { id } });
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    await this.prisma.contact.findUniqueOrThrow({ where: { id }, select: { id: true } });
    if (body.firstName !== undefined && !String(body.firstName ?? "").trim())
      return { statusCode: 400, message: "First name is required" };
    const data: Record<string, unknown> = {};
    const stringFields = ["firstName", "lastName", "email", "phone", "title", "department", "roleInPurchase", "salutation", "mobile", "reportsTo", "authorityLevel", "description", "mailingCountry", "mailingStreet", "mailingAddress2", "mailingCity", "mailingState", "mailingPostalCode", "lifecycleStage", "leadStatus"];
    for (const field of stringFields) if (body[field] !== undefined) data[field] = String(body[field] ?? "").trim() || null;
    if (body.sameAsCompanyAddress !== undefined) data.sameAsCompanyAddress = Boolean(body.sameAsCompanyAddress);
    if (!Object.keys(data).length) return this.prisma.contact.findUniqueOrThrow({ where: { id }, include: { company: { select: { id: true, name: true } }, owner: { select: { id: true, name: true } } } });
    return this.prisma.contact.update({
      where: { id },
      data: data as any,
      include: {
        company: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
      },
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() body: Record<string, unknown>, @CurrentUser() user?: { sub: string }) {
    const firstName = String(body.firstName ?? "").trim();
    if (!firstName)
      return { statusCode: 400, message: "First name is required" };
    const companyId = typeof body.companyId === "string" && body.companyId ? body.companyId : null;
    if (companyId && typeof body.email === "string" && body.email.trim()) {
      const duplicate = await this.prisma.contact.findFirst({ where: { companyId, email: { equals: body.email.trim(), mode: "insensitive" } }, select: { id: true } });
      if (duplicate) throw new ConflictException("A contact with this email already exists for this company");
    }
    return this.prisma.contact.create({
      data: {
        firstName,
        lastName: String(body.lastName ?? "").trim() || null,
        email: String(body.email ?? "").trim() || null,
        phone: String(body.phone ?? "").trim() || null,
        title: String(body.title ?? "").trim() || null,
        department: String(body.department ?? "").trim() || null,
        roleInPurchase: String(body.roleInPurchase ?? "").trim() || null,
        salutation: String(body.salutation ?? "").trim() || null,
        mobile: String(body.mobile ?? "").trim() || null,
        reportsTo: String(body.reportsTo ?? "").trim() || null,
        authorityLevel: String(body.authorityLevel ?? "").trim() || null,
        description: String(body.description ?? "").trim() || null,
        sameAsCompanyAddress: Boolean(body.sameAsCompanyAddress),
        mailingCountry: String(body.mailingCountry ?? "").trim() || null,
        mailingStreet: String(body.mailingStreet ?? "").trim() || null,
        mailingAddress2: String(body.mailingAddress2 ?? "").trim() || null,
        mailingCity: String(body.mailingCity ?? "").trim() || null,
        mailingState: String(body.mailingState ?? "").trim() || null,
        mailingPostalCode: String(body.mailingPostalCode ?? "").trim() || null,
        lifecycleStage: String(body.lifecycleStage ?? "").trim() || null,
        leadStatus: String(body.leadStatus ?? "").trim() || null,
        contactSource: String(body.contactSource ?? "").trim() || null,
        ownerId: user?.sub ?? null,
        companyId,
      },
    });
  }
}

@Module({ imports: [PrismaModule, JwtModule.register({})], controllers: [ContactsController], providers: [JwtAuthGuard] })
export class ContactsModule {}
