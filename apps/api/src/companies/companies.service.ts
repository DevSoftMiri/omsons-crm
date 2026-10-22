import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CompanyDto } from "./companies.dto";

@Injectable()
export class CompaniesService {
  // Keep the dependency typed for NestJS metadata; the cast isolates generated-client typing differences.
  constructor(private readonly prisma: PrismaService) {}
  private get db(): any { return this.prisma; }

  private normalize(dto: CompanyDto) {
    const regions = [...new Set((dto.regions ?? []).map((region) => region.trim()).filter(Boolean))];
    return { ...dto, name: dto.name.trim(), regions, parentCompanyId: dto.parentCompanyId || null, annualRevenue: dto.annualRevenue == null ? null : Number(dto.annualRevenue), customerSince: dto.customerSince ? new Date(dto.customerSince) : null };
  }

  private async validateParent(id: string | undefined, parentCompanyId: string | null) {
    if (!parentCompanyId) return;
    if (id === parentCompanyId) throw new BadRequestException("A company cannot be its own parent");
    const parent = await this.prisma.company.findUnique({ where: { id: parentCompanyId }, select: { parentCompanyId: true } });
    if (!parent) throw new NotFoundException("Parent company not found");
    if (parent.parentCompanyId) throw new BadRequestException("Sub-companies cannot have their own sub-companies");
  }

  private include = { owner: { select: { id: true, name: true } }, parentCompany: { select: { id: true, name: true } }, contacts: { include: { owner: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" as const } }, deals: { select: { id: true, name: true, amount: true, stage: true, closeDate: true, contactId: true }, orderBy: { createdAt: "desc" as const } }, subCompanies: { where: { isArchived: false }, select: { id: true, name: true, regions: true, parentCompanyId: true }, orderBy: { name: "asc" as const } } };

  async list(query: Record<string, string | undefined>) {
    const page = Math.max(1, Number(query.page) || 1); const limit = Math.min(100, Math.max(1, Number(query.limit) || 25));
    const search = query.search?.trim(); const archived = query.archived === "true";
    const allowedSorts = ["name", "createdAt", "updatedAt", "industry", "city", "state", "country", "customerType", "companySize", "annualRevenue", "customerSince"];
    const sortBy = allowedSorts.includes(query.sortBy ?? "") ? query.sortBy! : "name";
    const sortOrder = query.sortOrder === "desc" ? "desc" : "asc";
    const where = { isArchived: archived, ...(query.industry ? { industry: query.industry } : {}), ...(query.country ? { country: query.country } : {}), ...(query.parentCompanyId ? { parentCompanyId: query.parentCompanyId } : {}), ...(query.region ? { regions: { has: query.region } } : {}), ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { website: { contains: search, mode: "insensitive" as const } }, { city: { contains: search, mode: "insensitive" as const } }, { state: { contains: search, mode: "insensitive" as const } }] } : {}) };
    const [data, total] = await this.prisma.$transaction([this.prisma.company.findMany({
      where,
      select: {
        id: true, name: true, industry: true, website: true, phone: true,
        city: true, state: true, country: true, regions: true,
        customerType: true, companySize: true, annualRevenue: true, customerSince: true,
        parentCompanyId: true, ownerId: true, isArchived: true,
        createdAt: true, updatedAt: true,
        owner: { select: { id: true, name: true } }
        , contacts: { select: { leadStatus: true } }
      },
      orderBy: { [sortBy]: sortOrder }, skip: (page - 1) * limit, take: limit
    }), this.prisma.company.count({ where })]);
    return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({ where: { id }, include: this.include });
    if (!company) throw new NotFoundException("Company not found");
    return company;
  }

  async create(dto: CompanyDto) {
    const data = this.normalize(dto);
    await this.validateParent(undefined, data.parentCompanyId);
    return this.prisma.company.create({ data, include: this.include });
  }

  async update(id: string, dto: CompanyDto) {
    const data = this.normalize(dto);
    await this.findOne(id);
    await this.validateParent(id, data.parentCompanyId);
    return this.prisma.company.update({ where: { id }, data, include: this.include });
  }

  async metrics(id: string) {
    await this.findOne(id);
    const [contacts, leads, deals, activities, subCompanies] = await Promise.all([
      this.prisma.contact.count({ where: { companyId: id } }),
      this.prisma.lead.count({ where: { companyId: id, status: { notIn: ["WON", "LOST"] } } }),
      this.prisma.deal.count({ where: { companyId: id, stage: { notIn: ["Closed Won", "Closed Lost"] } } }),
      this.prisma.activity.count({ where: { OR: [{ contact: { companyId: id } }, { lead: { companyId: id } }] } }),
      this.prisma.company.count({ where: { parentCompanyId: id, isArchived: false } })
    ]);
    const pipeline = await this.prisma.deal.aggregate({ where: { companyId: id, stage: { notIn: ["Closed Won", "Closed Lost"] } }, _sum: { amount: true } });
    return { contacts, activeLeads: leads, openDeals: deals, pipelineAmount: pipeline._sum.amount ?? 0, recentActivities: activities, subCompanies };
  }

  async related(id: string, query: Record<string, string | undefined>) {
    await this.findOne(id); const page = Math.max(1, Number(query.page) || 1); const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const [contacts, leads, deals] = await Promise.all([
      this.prisma.contact.findMany({ where: { companyId: id }, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      this.prisma.lead.findMany({ where: { companyId: id }, include: { owner: true, stage: true }, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      this.prisma.deal.findMany({ where: { companyId: id }, include: { owner: true, contact: true }, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit })
    ]);
    return { contacts, leads, deals, page, limit };
  }

  async addContact(companyId: string, body: Record<string, unknown>) {
    await this.findOne(companyId);
    if (typeof body.firstName !== "string" || !body.firstName.trim()) throw new BadRequestException("First name is required");
    return this.prisma.contact.create({ data: { firstName: body.firstName.trim(), lastName: typeof body.lastName === "string" ? body.lastName.trim() || null : null, email: typeof body.email === "string" ? body.email.trim() || null : null, phone: typeof body.phone === "string" ? body.phone.trim() || null : null, title: typeof body.title === "string" ? body.title.trim() || null : null, ownerId: typeof body.ownerId === "string" ? body.ownerId || null : null, lifecycleStage: typeof body.lifecycleStage === "string" ? body.lifecycleStage || null : null, leadStatus: typeof body.leadStatus === "string" ? body.leadStatus || null : null, lastContactedAt: body.lastContactedAt ? new Date(String(body.lastContactedAt)) : null, nextFollowUpAt: body.nextFollowUpAt ? new Date(String(body.nextFollowUpAt)) : null, contactSource: typeof body.contactSource === "string" ? body.contactSource || null : null, companyId } });
  }

  async listContacts(companyId: string) {
    await this.findOne(companyId);
    return this.prisma.contact.findMany({ orderBy: { createdAt: "desc" } });
  }

  async linkContact(companyId: string, contactId: string) {
    await this.findOne(companyId);
    return this.prisma.contact.update({ where: { id: contactId }, data: { companyId } });
  }

  async archive(id: string) { await this.findOne(id); return this.prisma.company.update({ where: { id }, data: { isArchived: true }, include: this.include }); }
  async restore(id: string) { await this.findOne(id); return this.prisma.company.update({ where: { id }, data: { isArchived: false }, include: this.include }); }

  async addSubCompany(id: string, subCompanyId: string) {
    await this.findOne(id);
    await this.validateParent(subCompanyId, id);
    if (id === subCompanyId) throw new BadRequestException("A company cannot be its own sub-company");
    const sub = await this.prisma.company.findUnique({ where: { id: subCompanyId }, select: { isArchived: true, parentCompanyId: true } });
    if (!sub || sub.isArchived) throw new BadRequestException("Archived or missing companies cannot be linked");
    if (sub.parentCompanyId) throw new BadRequestException("Company is already linked to a parent");
    return this.prisma.company.update({ where: { id: subCompanyId }, data: { parentCompanyId: id }, include: this.include });
  }

  async unlinkSubCompany(id: string, subCompanyId: string) {
    const parent = await this.findOne(id);
    if (!parent.subCompanies.some((company: { id: string }) => company.id === subCompanyId)) throw new BadRequestException("Company is not a direct sub-company");
    return this.prisma.company.update({ where: { id: subCompanyId }, data: { parentCompanyId: null }, include: this.include });
  }
}
