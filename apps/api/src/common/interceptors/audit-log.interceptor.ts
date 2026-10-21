import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { AuditLogsService } from "../../audit-logs/audit-logs.service";

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly auditLogs: AuditLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = request.method as string;

    return next.handle().pipe(
      tap(() => {
        if (["POST", "PATCH", "PUT", "DELETE"].includes(method)) {
          void this.auditLogs.record({
            actorId: request.user?.sub,
            action: method,
            entity: context.getClass().name,
            entityId: request.params?.id,
            metadata: { path: request.url }
          });
        }
      })
    );
  }
}
