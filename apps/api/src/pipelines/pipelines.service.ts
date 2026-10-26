import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const DEFAULT_STAGES = [
  ["Appointment Scheduled", "bg-blue-50 text-[#1473e6]", 20],
  ["Qualified To Buy", "bg-orange-50 text-[#d94d12]", 40],
  ["Presentation Scheduled", "bg-pink-50 text-[#d6008f]", 60],
  ["Decision Maker Bought-In", "bg-violet-50 text-[#4f37d4]", 80],
  ["Contract Sent", "bg-amber-50 text-[#b56200]", 90],
  ["Closed Won", "bg-emerald-600 text-white", 100],
  ["Closed Lost", "bg-rose-700 text-white", 0],
] as const;

@Injectable()
export class PipelinesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    await this.ensureDefault();
    return this.prisma.pipeline.findMany({
      include: { stages: { orderBy: { order: "asc" } } },
      orderBy: { name: "asc" },
    });
  }

  async findOne(id: string) {
    const pipeline = await this.prisma.pipeline.findUnique({
      where: { id },
      include: { stages: { orderBy: { order: "asc" } } },
    });
    if (!pipeline) throw new NotFoundException("Pipeline not found");
    return pipeline;
  }

  async create(body: Record<string, unknown>) {
    const name = this.requiredName(body.name, "Pipeline name");
    try {
      return await this.prisma.pipeline.create({ data: { name }, include: { stages: true } });
    } catch (error) {
      if (this.isUniqueError(error)) throw new ConflictException("A pipeline with this name already exists");
      throw error;
    }
  }

  async update(id: string, body: Record<string, unknown>) {
    await this.findOne(id);
    const name = this.requiredName(body.name, "Pipeline name");
    try {
      return await this.prisma.pipeline.update({ where: { id }, data: { name }, include: { stages: { orderBy: { order: "asc" } } } });
    } catch (error) {
      if (this.isUniqueError(error)) throw new ConflictException("A pipeline with this name already exists");
      throw error;
    }
  }

  async createStage(pipelineId: string, body: Record<string, unknown>) {
    await this.findOne(pipelineId);
    const name = this.requiredName(body.name, "Stage name");
    const order = this.order(body.order);
    try {
      return await this.prisma.pipelineStage.create({
        data: {
          pipelineId,
          name,
          description: this.optionalString(body.description),
          order,
          color: this.color(body.color),
          probability: this.probability(body.probability),
        },
      });
    } catch (error) {
      if (this.isUniqueError(error)) throw new ConflictException("A stage with this name already exists in this pipeline");
      throw error;
    }
  }

  async updateStage(pipelineId: string, stageId: string, body: Record<string, unknown>) {
    await this.stage(pipelineId, stageId);
    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = this.requiredName(body.name, "Stage name");
    if (body.description !== undefined) data.description = this.optionalString(body.description);
    if (body.order !== undefined) data.order = this.order(body.order);
    if (body.color !== undefined) data.color = this.color(body.color);
    if (body.probability !== undefined) data.probability = this.probability(body.probability);
    try {
      return await this.prisma.pipelineStage.update({ where: { id: stageId }, data });
    } catch (error) {
      if (this.isUniqueError(error)) throw new ConflictException("A stage with this name already exists in this pipeline");
      throw error;
    }
  }

  async removeStage(pipelineId: string, stageId: string) {
    await this.stage(pipelineId, stageId);
    const deals = await this.prisma.deal.count({ where: { stageId } });
    if (deals > 0) throw new ConflictException("Move existing deals to another stage before deleting this stage");
    return this.prisma.pipelineStage.delete({ where: { id: stageId } });
  }

  private async stage(pipelineId: string, stageId: string) {
    const stage = await this.prisma.pipelineStage.findFirst({ where: { id: stageId, pipelineId } });
    if (!stage) throw new NotFoundException("Stage not found");
    return stage;
  }

  private async ensureDefault() {
    const existing = await this.prisma.pipeline.findUnique({ where: { name: "Sales Pipeline" }, include: { stages: true } });
    if (existing) return existing;
    return this.prisma.pipeline.create({
      data: {
        name: "Sales Pipeline",
        stages: { create: DEFAULT_STAGES.map(([name, color, probability], order) => ({ name, color, probability, order })) },
      },
      include: { stages: true },
    });
  }

  private requiredName(value: unknown, label: string) {
    if (typeof value !== "string" || !value.trim()) throw new BadRequestException(`${label} is required`);
    return value.trim();
  }
  private optionalString(value: unknown) { return typeof value === "string" ? value.trim() || null : null; }
  private order(value: unknown) {
    const parsed = value === undefined || value === null || value === "" ? 0 : Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) throw new BadRequestException("Stage order must be a non-negative integer");
    return parsed;
  }
  private probability(value: unknown) {
    if (value === undefined || value === null || value === "") return null;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 100) throw new BadRequestException("Stage probability must be between 0 and 100");
    return parsed;
  }
  private color(value: unknown) { return typeof value === "string" && value.trim() ? value.trim() : "bg-slate-100 text-slate-700"; }
  private isUniqueError(error: unknown) { return typeof error === "object" && error !== null && "code" in error && error.code === "P2002"; }
}
