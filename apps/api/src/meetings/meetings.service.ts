import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const select = {
  id: true, name: true, activityAt: true, ownerId: true, type: true, outcome: true,
  location: true, contactId: true, dealId: true, companyId: true, createdAt: true, updatedAt: true,
  owner: { select: { id: true, name: true } },
  contact: { select: { id: true, firstName: true, lastName: true } },
  deal: { select: { id: true, name: true } }
  ,company: { select: { id: true, name: true, parentCompanyId: true } }
};

@Injectable()
export class MeetingsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: Record<string, string>) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 25));
    const search = query.search?.trim();
    const allowedSorts = ["name", "activityAt", "type", "outcome", "location", "createdAt"];
    const sortBy = allowedSorts.includes(query.sortBy) ? query.sortBy : "activityAt";
    const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";
    const where: any = {
      ownerId: query.ownerId || undefined,
      companyId: query.companyId || undefined,
      type: query.type || undefined,
      outcome: query.outcome || undefined,
      activityAt: query.from || query.to ? { gte: query.from ? new Date(query.from) : undefined, lte: query.to ? new Date(query.to) : undefined } : undefined,
      OR: search ? [
        { name: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { contact: { OR: [{ firstName: { contains: search, mode: "insensitive" } }, { lastName: { contains: search, mode: "insensitive" } }] } },
        { deal: { name: { contains: search, mode: "insensitive" } } }
        ,{ company: { name: { contains: search, mode: "insensitive" } } }
      ] : undefined
    };
    const [data, total] = await Promise.all([
      this.prisma.meeting.findMany({ where, orderBy: [{ [sortBy]: sortOrder }, { id: "asc" }], skip: (page - 1) * limit, take: limit, select }),
      this.prisma.meeting.count({ where })
    ]);
    return { data, page, limit, total };
  }

  async create(body: Record<string, unknown>) {
    return this.prisma.meeting.create({ data: await this.data(body) as any, select });
  }

  async update(id: string, body: Record<string, unknown>) {
    if (!(await this.prisma.meeting.findUnique({ where: { id } }))) throw new NotFoundException("Meeting not found");
    return this.prisma.meeting.update({ where: { id }, data: await this.data(body, true) as any, select });
  }

  async remove(id: string) {
    if (!(await this.prisma.meeting.findUnique({ where: { id } }))) throw new NotFoundException("Meeting not found");
    return this.prisma.meeting.delete({ where: { id }, select: { id: true } });
  }

  async importRecords(records: Array<Record<string, unknown>>) {
    const created: unknown[] = [];
    const errors: Array<{ index: number; error: string }> = [];
    for (const [index, record] of records.entries()) {
      try { created.push(await this.create(record)); } catch (error) { errors.push({ index, error: error instanceof Error ? error.message : "Invalid meeting" }); }
    }
    return { imported: created.length, failed: errors.length, errors, data: created };
  }

  private async data(body: Record<string, unknown>, partial = false) {
    if (!partial && (typeof body.name !== "string" || !body.name.trim())) throw new BadRequestException("Meeting name is required");
    if (!partial && !body.activityAt) throw new BadRequestException("Activity date is required");
    const data: Record<string, unknown> = {};
    if (body.name !== undefined) { if (typeof body.name !== "string" || !body.name.trim()) throw new BadRequestException("Meeting name is required"); data.name = body.name.trim(); }
    if (body.activityAt !== undefined) { const date = new Date(String(body.activityAt)); if (Number.isNaN(date.getTime())) throw new BadRequestException("Activity date is invalid"); data.activityAt = date; }
    for (const key of ["type", "outcome", "location"]) if (body[key] !== undefined) data[key] = body[key] === "" ? null : body[key];
    for (const [key, model] of [["ownerId", "user"], ["contactId", "contact"], ["dealId", "deal"], ["companyId", "company"]] as const) {
      if (body[key] !== undefined) {
        const value = body[key] === "" ? null : String(body[key]);
        if (value && !(await (this.prisma as any)[model].findUnique({ where: { id: value }, select: { id: true } }))) throw new BadRequestException(`Invalid ${key}`);
        data[key] = value;
      }
    }
    return data;
  }
}
