import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DealsService {
  private readonly cache = new Map<string, { expiresAt: number; value: unknown }>();
  private readonly inFlight = new Map<string, Promise<unknown>>();
  private readonly cacheTtlMs = 10_000;

  constructor(private readonly prisma: PrismaService) {}

  list(query: Record<string, string>) {
    const cacheKey = JSON.stringify({
      pipeline: query.pipeline ?? "",
      stage: query.stage ?? "",
      ownerId: query.ownerId ?? "",
      search: query.search?.trim() ?? "",
      sortBy: query.sortBy ?? "createdAt",
      sortOrder: query.sortOrder ?? "desc",
    });
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.value);
    const existing = this.inFlight.get(cacheKey);
    if (existing) return existing;
    const request = this.queryDeals(query)
      .then((value) => {
        this.cache.set(cacheKey, { expiresAt: Date.now() + this.cacheTtlMs, value });
        return value;
      })
      .finally(() => this.inFlight.delete(cacheKey));
    this.inFlight.set(cacheKey, request);
    return request;
  }

  private async queryDeals(query: Record<string, string>) {
    const search = query.search?.trim();
    const allowedSorts = ["name", "amount", "stage", "pipeline", "closeDate", "createdAt", "updatedAt", "priority", "probability", "expectedCloseDate", "productCategory", "lastActivityAt"];
    const sortBy = allowedSorts.includes(query.sortBy) ? query.sortBy : "createdAt";
    const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";
    return this.prisma.deal.findMany({
      where: {
        pipeline: query.pipeline || undefined,
        stage: query.stage || undefined,
        ownerId: query.ownerId || undefined,
        OR: search ? [{ name: { contains: search, mode: "insensitive" } }, { company: { name: { contains: search, mode: "insensitive" } } }] : undefined
      },
      select: {
        id: true, name: true, pipeline: true, stage: true, amount: true,
        closeDate: true, dealType: true, priority: true, ownerId: true, probability: true,
        expectedCloseDate: true, productCategory: true, stageChangedAt: true, lastActivityAt: true,
        contactId: true, companyId: true, createdAt: true, updatedAt: true,
        owner: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, name: true } }
      },
      orderBy: [{ [sortBy]: sortOrder }, { id: "asc" }]
    });
  }

  private invalidateCache() {
    this.cache.clear();
  }

  async create(body: Record<string, unknown>) {
    if (typeof body.name !== "string" || !body.name.trim()) throw new BadRequestException("Deal name is required");
    const result = await this.prisma.deal.create({ data: await this.data(body) as any, include: { owner: true, contact: true, company: true } });
    this.invalidateCache();
    return result;
  }

  async update(id: string, body: Record<string, unknown>) {
    if (!(await this.prisma.deal.findUnique({ where: { id } }))) throw new NotFoundException("Deal not found");
    const result = await this.prisma.deal.update({ where: { id }, data: await this.data(body, true) as any, include: { owner: true, contact: true, company: true } });
    this.invalidateCache();
    return result;
  }

  async remove(id: string) {
    const result = await this.prisma.deal.delete({ where: { id } });
    this.invalidateCache();
    return result;
  }

  private async data(body: Record<string, unknown>, partial = false) {
    const data: Record<string, unknown> = {};
    for (const key of ["name", "pipeline", "stage", "dealType", "priority", "ownerId", "contactId", "companyId", "productCategory"]) if (body[key] !== undefined) data[key] = body[key];
    if (body.probability !== undefined) data.probability = body.probability === null || body.probability === "" ? null : Number(body.probability);
    if (body.expectedCloseDate !== undefined) data.expectedCloseDate = body.expectedCloseDate ? new Date(String(body.expectedCloseDate)) : null;
    if (body.lastActivityAt !== undefined) data.lastActivityAt = body.lastActivityAt ? new Date(String(body.lastActivityAt)) : null;
    if (body.stage !== undefined && partial) data.stageChangedAt = new Date();
    if (body.amount !== undefined) data.amount = body.amount === "" || body.amount === null ? null : Number(body.amount);
    if (body.closeDate !== undefined) data.closeDate = body.closeDate ? new Date(String(body.closeDate)) : null;
    if (body.lineItems !== undefined) data.lineItems = body.lineItems;
    if (!partial && !data.pipeline) data.pipeline = "Sales Pipeline";
    const pipelineName = typeof data.pipeline === "string" ? data.pipeline : undefined;
    const pipelineId = typeof body.pipelineId === "string" && body.pipelineId ? body.pipelineId : undefined;
    const stageId = typeof body.stageId === "string" && body.stageId ? body.stageId : undefined;
    const pipeline = pipelineId
      ? await this.prisma.pipeline.findUnique({ where: { id: pipelineId }, include: { stages: { orderBy: { order: "asc" } } } })
      : pipelineName
        ? await this.prisma.pipeline.findUnique({ where: { name: pipelineName }, include: { stages: { orderBy: { order: "asc" } } } })
        : null;
    if (pipeline) {
      data.pipelineId = pipeline.id;
      data.pipeline = pipeline.name;
      const selectedStage = stageId
        ? pipeline.stages.find((item) => item.id === stageId)
        : pipeline.stages.find((item) => item.name === data.stage) || pipeline.stages[0];
      if (!selectedStage) throw new BadRequestException("Pipeline must have at least one stage");
      data.stageId = selectedStage.id;
      data.stage = selectedStage.name;
    }
    return data;
  }
}
