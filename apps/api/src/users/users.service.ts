import { Injectable } from "@nestjs/common";
import { QueryDto } from "../common/dto/query.dto";
import { PrismaService } from "../prisma/prisma.service";

type UserRecord = { id: string; email: string; name: string; roles: string[] };

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly users: UserRecord[] = [];

  async list(query: QueryDto) {
    const users = await this.prisma.user.findMany({ where: { isActive: true }, select: { id: true, email: true, name: true, roles: { select: { role: { select: { name: true } } } } }, orderBy: { name: "asc" }, take: query.limit, skip: ((query.page || 1) - 1) * (query.limit || 50) });
    const total = await this.prisma.user.count({ where: { isActive: true } });
    return { data: users.map((user) => ({ id: user.id, email: user.email, name: user.name === "CRM Admin" ? "Omsons Admin" : user.name, roles: user.roles.map((item) => item.role.name) })), page: query.page, limit: query.limit, total };
  }

  create(dto: { email: string; name: string }) {
    const user = { id: crypto.randomUUID(), email: dto.email, name: dto.name, roles: ["sales"] };
    this.users.push(user);
    return user;
  }

  findOne(id: string) {
    return this.users.find((user) => user.id === id) ?? null;
  }

  findByEmail(email: string) {
    return Promise.resolve(this.users.find((user) => user.email === email) ?? null);
  }
}
