import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

type ObjectType = "COMPANY" | "CONTACT" | "DEAL";
type Rule = { property: string; operator: string; value?: unknown };
type Definition = { groups?: Array<{ rules?: Rule[] }> };

@Injectable()
export class SegmentsService {
  private readonly cache = new Map<string, { expires: number; value: unknown[] }>();
  constructor(private readonly prisma: PrismaService) {}

  async list(query: { search?: string; objectType?: string; includeDeleted?: string }) {
    const where: any = { isDeleted: query.includeDeleted === "true" ? undefined : false, objectType: query.objectType || undefined, ...(query.search ? { name: { contains: query.search, mode: "insensitive" } } : {}) };
    const segments = await (this.prisma as any).segment.findMany({ where, orderBy: { updatedAt: "desc" }, include: { createdBy: { select: { id: true, name: true } } } });
    return { data: await Promise.all(segments.map(async (segment: any) => ({ ...segment, size: (await this.count(segment.id)).count }))), total: segments.length };
  }

  async create(body: { name: string; description?: string; objectType: ObjectType; filters?: unknown }) {
    this.validate(body.name, body.objectType, body.filters);
    return (this.prisma as any).segment.create({ data: { name: body.name.trim(), description: body.description || null, objectType: body.objectType, filters: body.filters || { groups: [] } } });
  }

  async get(id: string) { const segment = await (this.prisma as any).segment.findUnique({ where: { id }, include: { createdBy: { select: { id: true, name: true } } } }); if (!segment) throw new NotFoundException("Segment not found"); return { ...segment, size: (await this.count(id)).count }; }
  async update(id: string, body: Partial<{ name: string; description: string; objectType: ObjectType; filters: unknown }>) { const existing = await this.get(id); this.validate(body.name || existing.name, body.objectType || existing.objectType, body.filters ?? existing.filters); return (this.prisma as any).segment.update({ where: { id }, data: { ...body, filters: body.filters ?? undefined } }); }
  async remove(id: string) { await this.get(id); return (this.prisma as any).segment.update({ where: { id }, data: { isDeleted: true } }); }
  async count(id: string) { const members = await this.evaluate(id); return { count: members.length }; }
  async members(id: string, limit: number) { return { data: (await this.evaluate(id)).slice(0, Math.min(limit, 500)) }; }

  private async evaluate(id: string): Promise<any[]> {
    const segment = await (this.prisma as any).segment.findUnique({ where: { id } }); if (!segment) throw new NotFoundException("Segment not found");
    const cached = this.cache.get(id); if (cached && cached.expires > Date.now()) return cached.value;
    const db = this.prisma as any; const include = segment.objectType === "COMPANY" ? { owner: { select: { id: true, name: true } }, contacts: true, deals: true } : segment.objectType === "CONTACT" ? { owner: { select: { id: true, name: true } }, company: true, activities: true } : { owner: { select: { id: true, name: true } }, company: true, contact: true };
    const rows = await db[segment.objectType.toLowerCase()].findMany({ where: { isArchived: segment.objectType === "COMPANY" ? false : undefined }, include });
    const definition = (segment.filters || {}) as Definition; const result = rows.filter((row: any) => (definition.groups || []).every((group) => { const rules = group.rules || []; return rules.length === 0 || rules.some((rule) => this.matches(row, rule, segment.objectType)); }));
    this.cache.set(id, { expires: Date.now() + 10000, value: result }); return result;
  }

  private matches(row: any, rule: Rule, objectType: ObjectType) { const value = this.property(row, rule.property, objectType); const expected = rule.value; const text = String(value ?? "").toLowerCase(); const target = String(expected ?? "").toLowerCase(); if (rule.operator === "is_known") return value !== null && value !== undefined && value !== ""; if (rule.operator === "is_unknown") return value === null || value === undefined || value === ""; if (rule.operator === "contains") return text.includes(target); if (rule.operator === "not_contains") return !text.includes(target); if (rule.operator === "is_any_of") return Array.isArray(expected) ? expected.map(String).map((item) => item.toLowerCase()).includes(text) : false; if (rule.operator === "greater_than") return Number(value) > Number(expected); if (rule.operator === "less_than") return Number(value) < Number(expected); if (rule.operator === "between") return Number(value) >= Number((expected as any)?.[0]) && Number(value) <= Number((expected as any)?.[1]); if (rule.operator === "after") return new Date(value).getTime() > new Date(String(expected)).getTime(); if (rule.operator === "before") return new Date(value).getTime() < new Date(String(expected)).getTime(); return text === target; }
  private property(row: any, property: string, objectType: ObjectType) { if (property === "owner") return row.owner?.name; if (property === "company") return row.company?.name; if (property === "companyRegion") return row.company?.regions?.[0]; if (property === "numberOfContacts") return row.contacts?.length; if (property === "numberOfOpenDeals") return row.deals?.filter((deal: any) => !["Closed Won", "Closed Lost"].includes(deal.stage)).length; if (property === "weightedValue") return Number(row.amount || 0) * Number(row.probability || 0) / 100; if (property === "daysInStage") return Math.floor((Date.now() - new Date(row.stageChangedAt || row.updatedAt).getTime()) / 86400000); return property.split(".").reduce((value, key) => value?.[key], row); }
  private validate(name: string, objectType: string, filters: unknown) { if (!name?.trim()) throw new BadRequestException("Segment name is required"); if (!["COMPANY", "CONTACT", "DEAL"].includes(objectType)) throw new BadRequestException("Invalid segment object"); if (filters !== undefined && (typeof filters !== "object" || filters === null)) throw new BadRequestException("Invalid segment filters"); }
}
