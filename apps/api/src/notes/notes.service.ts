import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly include = {
    author: { select: { id: true, name: true } },
    company: { select: { id: true, name: true, parentCompanyId: true } },
    links: true,
    followUps: { include: { owner: { select: { id: true, name: true } } } }
  };

  async list(query: Record<string, string>) {
    const companyId = query.companyId;
    const data = await this.prisma.note.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, include: this.include });
    return { data, page: 1, limit: data.length, total: data.length };
  }

  async find(id: string) {
    const note = await this.prisma.note.findUnique({ where: { id }, include: this.include });
    if (!note) throw new NotFoundException("Note not found");
    return note;
  }

  async create(body: Record<string, unknown>) {
    const companyId = String(body.companyId ?? "");
    const content = String(body.body ?? "").trim();
    if (!companyId) throw new BadRequestException("Company is required");
    if (!content || !/<[a-z][\s\S]*>/i.test(content) && !content.replace(/<[^>]*>/g, "").trim()) throw new BadRequestException("Note content is required");
    const company = await this.prisma.company.findUnique({ where: { id: companyId }, select: { id: true } });
    if (!company) throw new BadRequestException("Invalid company");
    const links = Array.isArray(body.links) ? body.links as Array<{ id?: unknown; kind?: unknown }> : [];
    const followUp = body.followUp as { enabled?: boolean; title?: string; type?: string; dueAt?: string; ownerId?: string } | undefined;
    return this.prisma.$transaction(async (tx) => {
      const note = await tx.note.create({ data: { title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 80), body: content, companyId }, include: this.include });
      for (const link of links) {
        if (!link.id || !link.kind) continue;
        await tx.noteActivity.create({ data: { noteId: note.id, activityId: String(link.id), kind: String(link.kind) } });
      }
      if (followUp?.enabled) {
        if (!followUp.dueAt || Number.isNaN(new Date(followUp.dueAt).getTime())) throw new BadRequestException("A valid follow-up date is required");
        await tx.followUp.create({ data: { title: String(followUp.title || note.title), type: String(followUp.type || "TASK"), dueAt: new Date(followUp.dueAt), ownerId: followUp.ownerId || null, companyId, noteId: note.id } });
      }
      return tx.note.findUnique({ where: { id: note.id }, include: this.include });
    });
  }
}
