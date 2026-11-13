import { Injectable } from "@nestjs/common";
import { QueryDto } from "../common/dto/query.dto";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcrypt";

export type UserRecord = { id: string; email: string; name: string; roles: string[]; designation?: string };

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  async list(query: QueryDto) {
    const users = await this.prisma.user.findMany({ where: { isActive: true }, select: { id: true, email: true, name: true, roles: { select: { role: { select: { name: true } } } } }, orderBy: { name: "asc" }, take: query.limit, skip: ((query.page || 1) - 1) * (query.limit || 50) });
    const total = await this.prisma.user.count({ where: { isActive: true } });
    return { data: users.map((user) => ({ id: user.id, email: user.email, name: user.name === "CRM Admin" ? "Omsons Admin" : user.name, roles: user.roles.map((item) => item.role.name) })), page: query.page, limit: query.limit, total };
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id }, include: { roles: { include: { role: true } } } });
  }

  async create(dto: { email: string; name: string }) {
    const email = dto.email.trim().toLowerCase();
    return this.prisma.user.create({ data: { email, name: dto.name.trim(), passwordHash: await bcrypt.hash(email, 12) } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() }, include: { roles: { include: { role: true } } } });
  }
}
