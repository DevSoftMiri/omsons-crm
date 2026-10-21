import { Injectable } from "@nestjs/common";
import { QueryDto } from "../common/dto/query.dto";

type UserRecord = { id: string; email: string; name: string; roles: string[] };

@Injectable()
export class UsersService {
  private readonly users: UserRecord[] = [
    { id: "seed-admin", email: "admin@omsonsglassware.com", name: "Omsons Admin", roles: ["admin"] }
  ];

  list(query: QueryDto) {
    return { data: this.users, page: query.page, limit: query.limit, total: this.users.length };
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
