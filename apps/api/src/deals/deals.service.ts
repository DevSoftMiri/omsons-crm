import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DealsService {
  constructor(private readonly prisma: PrismaService) {}

  list(query: Record<string, string>) {
    const search = query.search?.trim();
    return this.prisma.deal.findMany({
      where: {
        pipeline: query.pipeline || undefined,
        stage: query.stage || undefined,
        ownerId: query.ownerId || undefined,
        OR: search ? [{ name: { contains: search, mode: "insensitive" } }, { company: { name: { contains: search, mode: "insensitive" } } }] : undefined
      },
      include: { owner: true, contact: true, company: true },
      orderBy: { createdAt: "desc" }
    });
  }

  async create(body: Record<string, unknown>) {
    if (typeof body.name !== "string" || !body.name.trim()) throw new BadRequestException("Deal name is required");
    return this.prisma.deal.create({ data: this.data(body) as any, include: { owner: true, contact: true, company: true } });
  }

  async update(id: string, body: Record<string, unknown>) {
    if (!(await this.prisma.deal.findUnique({ where: { id } }))) throw new NotFoundException("Deal not found");
    return this.prisma.deal.update({ where: { id }, data: this.data(body, true) as any, include: { owner: true, contact: true, company: true } });
  }

  remove(id: string) { return this.prisma.deal.delete({ where: { id } }); }

  private data(body: Record<string, unknown>, partial = false) {
    const data: Record<string, unknown> = {};
    for (const key of ["name", "pipeline", "stage", "dealType", "priority", "ownerId", "contactId", "companyId"]) if (body[key] !== undefined) data[key] = body[key];
    if (body.amount !== undefined) data.amount = body.amount === "" || body.amount === null ? null : Number(body.amount);
    if (body.closeDate !== undefined) data.closeDate = body.closeDate ? new Date(String(body.closeDate)) : null;
    if (body.lineItems !== undefined) data.lineItems = body.lineItems;
    if (!partial && !data.pipeline) data.pipeline = "Sales Pipeline";
    return data;
  }
}
