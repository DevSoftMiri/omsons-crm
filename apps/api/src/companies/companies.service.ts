import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CompanyDto } from "./companies.dto";

export const COMPANY_LIFECYCLE_STAGES = ["Subscriber", "Lead", "Marketing Qualified Lead", "Sales Qualified Lead", "Opportunity", "Customer", "Evangelist", "Other"] as const;

@Injectable()
export class CompaniesService {
  // Keep the dependency typed for NestJS metadata; the cast isolates generated-client typing differences.
  constructor(private readonly prisma: PrismaService) {}
  private get db(): any { return this.prisma; }

  private readonly filterAssociations = new Set(["Company", "Contact", "Deal", "Lead", "Activity", "Note", "Task", "User", "Call", "Email", "Meeting"]);
  private readonly filterFields: Record<string, Set<string>> = {
    Company: new Set(["name", "industry", "city", "state", "country", "annualRevenue", "numberOfEmployees", "customerType", "companySize", "targetAccount", "createdAt", "updatedAt"]),
    Contact: new Set(["firstName", "lastName", "email", "phone", "lifecycleStage", "leadStatus", "lastContactedAt", "nextFollowUpAt", "createdAt"]),
    Deal: new Set(["name", "stage", "amount", "closeDate", "ownerId", "createdAt", "updatedAt"]),
    Lead: new Set(["title", "status", "priority", "value", "source", "expectedCloseAt", "createdAt"]),
    Activity: new Set(["type", "subject", "createdAt", "updatedAt"]),
    Note: new Set(["body", "createdAt", "updatedAt"]),
    Task: new Set(["title", "priority", "dueAt", "doneAt", "createdAt"]),
    User: new Set(["name", "email", "isActive"]),
    Call: new Set(["subject", "createdAt"]), Email: new Set(["subject", "createdAt"]), Meeting: new Set(["subject", "createdAt"])
  };

  private filterWhere(node: any): any {
    if (!node || typeof node !== "object") return {};
    if (node.type === "group") {
      const children = Array.isArray(node.children) ? node.children.map((child: any) => this.filterWhere(child)).filter((child: any) => Object.keys(child).length) : [];
      return children.length ? { [node.logic === "OR" ? "OR" : "AND"]: children } : {};
    }
    const association = String(node.association ?? ""); const field = String(node.field ?? ""); const operator = String(node.operator ?? "is");
    if (!this.filterAssociations.has(association) || !this.filterFields[association]?.has(field)) throw new BadRequestException(`Unsupported filter: ${association}.${field}`);
    const rawValue = node.value;
    const dateFields = new Set(["createdAt", "updatedAt", "lastContactedAt", "nextFollowUpAt", "closeDate", "expectedCloseAt", "dueAt", "doneAt"]);
    const numberFields = new Set(["annualRevenue", "numberOfEmployees", "amount", "value"]);
    const value = dateFields.has(field) ? (Array.isArray(rawValue) ? rawValue.map((item) => new Date(String(item))) : rawValue ? new Date(String(rawValue)) : rawValue) : numberFields.has(field) ? (Array.isArray(rawValue) ? rawValue.map(Number) : rawValue === "" ? rawValue : Number(rawValue)) : rawValue;
    const scalar = operator === "known" ? { not: null } : operator === "unknown" ? null : operator === "contains" ? { contains: String(value ?? ""), mode: "insensitive" } : operator === "not-contains" ? { not: { contains: String(value ?? ""), mode: "insensitive" } } : operator === "gt" ? { gt: value } : operator === "gte" ? { gte: value } : operator === "lt" ? { lt: value } : operator === "lte" ? { lte: value } : operator === "between" && Array.isArray(value) ? { gte: value[0], lte: value[1] } : operator === "is-not" ? { not: value } : value;
    const relation = association === "Company" ? null : association === "Contact" ? "contacts" : association === "Deal" ? "deals" : association === "Lead" ? "leads" : association === "User" ? "owner" : ["Activity", "Call", "Email", "Meeting"].includes(association) ? { OR: [{ contacts: { some: { activities: { some: { ...(association === "Activity" ? {} : { type: association.toUpperCase() }), [field]: scalar } } } } }, { leads: { some: { activities: { some: { ...(association === "Activity" ? {} : { type: association.toUpperCase() }), [field]: scalar } } } } }] } : association === "Note" ? { OR: [{ contacts: { some: { notes: { some: { [field]: scalar } } } } }, { leads: { some: { notes: { some: { [field]: scalar } } } } }] } : association === "Task" ? { leads: { some: { tasks: { some: { [field]: scalar } } } } } : null;
    if (relation === "owner") return { owner: { [field]: scalar } };
    if (relation && typeof relation === "string") return { [relation]: { some: { [field]: scalar } } };
    if (relation && typeof relation === "object") return relation;
    return { [field]: scalar };
  }

  private normalize(dto: CompanyDto): any {
    const { customFields, ownerName: _ownerName, ...scalarFields } = dto;
    const regions = [...new Set((dto.regions ?? []).map((region) => region.trim()).filter(Boolean))];
    if (dto.lifecycleStage !== undefined && !COMPANY_LIFECYCLE_STAGES.includes(dto.lifecycleStage as typeof COMPANY_LIFECYCLE_STAGES[number])) throw new BadRequestException("Invalid company lifecycle stage");
    const normalizedCustomFields = customFields && typeof customFields === "object" && !Array.isArray(customFields)
      ? Object.fromEntries(Object.entries(customFields).map(([key, value]) => [key.trim(), value == null ? "" : String(value)]).filter(([key]) => key))
      : {};
    return { ...scalarFields, ...(dto.name !== undefined ? { name: dto.name.trim() } : {}), regions, customFields: normalizedCustomFields as Prisma.InputJsonObject, parentCompanyId: dto.parentCompanyId || null, annualRevenue: dto.annualRevenue == null ? null : Number(dto.annualRevenue), customerSince: dto.customerSince ? new Date(dto.customerSince) : null, numberOfBlockers: Number(dto.numberOfBlockers ?? 0), numberOfBuyingRoleContacts: Number(dto.numberOfBuyingRoleContacts ?? 0), numberOfDecisionMakers: Number(dto.numberOfDecisionMakers ?? 0) };
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
    let advancedWhere = {};
    if (query.filters) { try { advancedWhere = this.filterWhere(JSON.parse(query.filters)); } catch (error) { if (error instanceof BadRequestException) throw error; throw new BadRequestException("Invalid filters JSON"); } }
    const where = { isArchived: archived, ...(query.industry ? { industry: query.industry } : {}), ...(query.country ? { country: query.country } : {}), ...(query.parentCompanyId ? { parentCompanyId: query.parentCompanyId } : {}), ...(query.region ? { regions: { has: query.region } } : {}), ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { website: { contains: search, mode: "insensitive" as const } }, { city: { contains: search, mode: "insensitive" as const } }, { state: { contains: search, mode: "insensitive" as const } }] } : {}), ...advancedWhere };
    const [data, total] = await this.prisma.$transaction([this.prisma.company.findMany({
      where,
      select: {
        id: true, name: true, industry: true, website: true, phone: true,
        city: true, state: true, country: true, regions: true,
        customerType: true, companySize: true, annualRevenue: true, customerSince: true,
        parentCompanyId: true, ownerId: true, ownerName: true, lifecycleStage: true, isArchived: true,
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
    if (!dto.name?.trim()) throw new BadRequestException("Company name is required");
    const data = this.normalize(dto);
    if (dto.ownerName !== undefined) {
      data.ownerName = String(dto.ownerName ?? "").trim().replace(/\s+/g, " ") || null;
      data.ownerId = null;
    }
    await this.validateParent(undefined, data.parentCompanyId);
    return this.prisma.company.create({ data, include: this.include });
  }

  async update(id: string, dto: CompanyDto) {
    const data = this.normalize(dto);
    await this.findOne(id);
    await this.validateParent(id, data.parentCompanyId);
    // PATCH requests from the detail header only contain one editable field.
    // Do not let normalize()'s create-time defaults overwrite omitted values.
    const defaultedFields = ["regions", "customFields", "parentCompanyId", "annualRevenue", "customerSince", "numberOfBlockers", "numberOfBuyingRoleContacts", "numberOfDecisionMakers"] as const;
    if (dto.name === undefined) delete data.name;
    for (const field of defaultedFields) {
      if (dto[field] === undefined) delete data[field];
    }

    if (dto.ownerName !== undefined) {
      (data as Record<string, unknown>).ownerName = String(dto.ownerName ?? "").trim().replace(/\s+/g, " ") || null;
      data.ownerId = null;
    }
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
    return this.prisma.contact.create({ data: { firstName: body.firstName.trim(), lastName: typeof body.lastName === "string" ? body.lastName.trim() || null : null, email: typeof body.email === "string" ? body.email.trim() || null : null, phone: typeof body.phone === "string" ? body.phone.trim() || null : null, title: typeof body.title === "string" ? body.title.trim() || null : null, department: typeof body.department === "string" ? body.department.trim() || null : null, roleInPurchase: typeof body.roleInPurchase === "string" ? body.roleInPurchase.trim() || null : null, ownerId: typeof body.ownerId === "string" ? body.ownerId || null : null, lifecycleStage: typeof body.lifecycleStage === "string" ? body.lifecycleStage || null : null, leadStatus: typeof body.leadStatus === "string" ? body.leadStatus || null : null, lastContactedAt: body.lastContactedAt ? new Date(String(body.lastContactedAt)) : null, nextFollowUpAt: body.nextFollowUpAt ? new Date(String(body.nextFollowUpAt)) : null, contactSource: typeof body.contactSource === "string" ? body.contactSource || null : null, companyId } });
  }

  async listContacts(companyId: string) {
    await this.findOne(companyId);
    return this.prisma.contact.findMany({ orderBy: { createdAt: "desc" } });
  }

  async linkContact(companyId: string, contactId: string) {
    await this.findOne(companyId);
    return this.prisma.contact.update({ where: { id: contactId }, data: { companyId } });
  }

  async unlinkContact(companyId: string, contactId: string) {
    await this.findOne(companyId);
    const contact = await this.prisma.contact.findFirst({ where: { id: contactId, companyId }, select: { id: true } });
    if (!contact) throw new NotFoundException("Contact is not associated with this company");
    return this.prisma.contact.update({ where: { id: contactId }, data: { companyId: null } });
  }

  async archive(id: string) { await this.findOne(id); return this.prisma.company.update({ where: { id }, data: { isArchived: true }, include: this.include }); }
  async restore(id: string) { await this.findOne(id); return this.prisma.company.update({ where: { id }, data: { isArchived: false }, include: this.include }); }

  async permanentlyDelete(id: string, reassignChildrenTo?: string) {
    return this.prisma.$transaction(async (tx: any) => {
      const duplicate = await tx.company.findUnique({ where: { id }, select: { id: true, subCompanies: { select: { id: true } }, contacts: { select: { id: true } }, deals: { select: { id: true } }, leads: { select: { id: true } }, meetings: { select: { id: true } }, dealers: { select: { id: true } } } });
      if (!duplicate) throw new NotFoundException("Company not found");
      if (duplicate.contacts.length || duplicate.deals.length || duplicate.leads.length || duplicate.meetings.length || duplicate.dealers.length) throw new BadRequestException("Company has linked records and cannot be permanently deleted");
      const children = duplicate.subCompanies.map((child: { id: string }) => child.id);
      if (children.length && !reassignChildrenTo) throw new BadRequestException("Company has sub-companies; provide a destination company");
      if (reassignChildrenTo) {
        if (reassignChildrenTo === id) throw new BadRequestException("Children cannot be reassigned to the company being deleted");
        const destination = await tx.company.findUnique({ where: { id: reassignChildrenTo }, select: { id: true, parentCompanyId: true, isArchived: true } });
        if (!destination || destination.isArchived || destination.parentCompanyId) throw new BadRequestException("Children can only be reassigned to an active main company");
        await tx.company.updateMany({ where: { parentCompanyId: id }, data: { parentCompanyId: reassignChildrenTo } });
      }
      await tx.company.delete({ where: { id } });
      return { deletedCompanyId: id, reassignedChildIds: children, reassignChildrenTo: reassignChildrenTo ?? null };
    });
  }

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
