import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly include = {
    assignee: { select: { id: true, name: true } },
    company: { select: { id: true, name: true } },
  };

  async list(companyId?: string) {
    return this.prisma.task.findMany({
      where: { companyId: companyId || undefined },
      include: this.include,
      orderBy: [{ doneAt: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    });
  }

  async create(body: Record<string, unknown>) {
    const data = await this.data(body);
    return this.prisma.task.create({ data: data as any, include: this.include });
  }

  async update(id: string, body: Record<string, unknown>) {
    const existing = await this.prisma.task.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Task not found");
    const data = await this.data(body, true);
    return this.prisma.task.update({ where: { id }, data: data as any, include: this.include });
  }

  async remove(id: string) {
    await this.prisma.task.findUniqueOrThrow({ where: { id } });
    return this.prisma.task.delete({ where: { id } });
  }

  private async data(body: Record<string, unknown>, partial = false) {
    if (!partial && (typeof body.title !== "string" || !body.title.trim())) {
      throw new BadRequestException("Task title is required");
    }
    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = String(body.title).trim();
    if (body.companyId !== undefined) {
      if (typeof body.companyId !== "string" || !body.companyId.trim()) throw new BadRequestException("Company is required");
      const company = await this.prisma.company.findFirst({ where: { id: body.companyId.trim(), isArchived: false }, select: { id: true } });
      if (!company) throw new BadRequestException("Selected company was not found or is archived");
      data.companyId = company.id;
    }
    if (!partial && !data.companyId) throw new BadRequestException("Company is required");
    for (const key of ["taskType", "queue", "notes", "assigneeId"] as const) if (body[key] !== undefined) data[key] = body[key] || null;
    if (body.priority !== undefined) data.priority = body.priority === null || body.priority === "" || body.priority === "NONE" ? null : body.priority;
    if (body.dueAt !== undefined) data.dueAt = body.dueAt ? new Date(String(body.dueAt)) : null;
    if (body.reminderAt !== undefined) {
      if (!body.reminderAt) data.reminderAt = null;
      else if (/^\d+$/.test(String(body.reminderAt)) && data.dueAt instanceof Date) data.reminderAt = new Date(data.dueAt.getTime() - Number(body.reminderAt) * 60_000);
      else data.reminderAt = new Date(String(body.reminderAt));
    }
    if (body.doneAt !== undefined) data.doneAt = body.doneAt ? new Date(String(body.doneAt)) : null;
    return data;
  }
}
