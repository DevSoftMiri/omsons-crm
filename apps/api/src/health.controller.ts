import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";
import { Public } from "./common/decorators/public.decorator";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}
  @Get()
  @Public()
  async check() { await this.prisma.$queryRaw`SELECT 1`; return { status: "ok", database: "ok", timestamp: new Date().toISOString() }; }
}
