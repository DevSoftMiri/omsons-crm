import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { lastValueFrom, Observable } from "rxjs";

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<{ method: string; headers: Record<string, string | string[] | undefined> }>();
    const key = request.headers["idempotency-key"];
    if (request.method !== "POST" || typeof key !== "string" || !key.trim()) return next.handle();

    const normalizedKey = key.trim();
    let ownsRequest = false;
    try {
      await this.prisma.idempotencyRecord.create({ data: { key: normalizedKey, status: 102, response: {} } });
      ownsRequest = true;
    } catch (error) {
      if ((error as { code?: string }).code !== "P2002") throw error;
      for (let attempt = 0; attempt < 100; attempt += 1) {
        const existing = await this.prisma.idempotencyRecord.findUnique({ where: { key: normalizedKey } });
        if (existing && existing.status !== 102) {
          context.switchToHttp().getResponse().status(existing.status);
          return new Observable((subscriber) => { subscriber.next(existing.response); subscriber.complete(); });
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      throw new Error("Idempotent request is still in progress");
    }

    let result: unknown;
    try {
      result = await lastValueFrom(next.handle());
      const response = context.switchToHttp().getResponse<{ statusCode?: number }>();
      const status = response.statusCode ?? 200;
      const cachedResponse = JSON.parse(JSON.stringify(result, (_key, value) => typeof value === "bigint" ? Number(value) : value));
      await this.prisma.idempotencyRecord.update({ where: { key: normalizedKey }, data: { status, response: cachedResponse } });
    } catch (error) {
      if (ownsRequest) await this.prisma.idempotencyRecord.delete({ where: { key: normalizedKey } }).catch(() => undefined);
      throw error;
    }
    return new Observable((subscriber) => { subscriber.next(result); subscriber.complete(); });
  }
}
