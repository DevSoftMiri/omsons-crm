import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ReminderQueueModule } from "./queues/reminder-queue.module";
import { AuditLogsModule } from "./audit-logs/audit-logs.module";
import { UsersModule } from "./users/users.module";
import { buildCrudModule } from "./common/crud.module";
import { RolesGuard } from "./common/guards/roles.guard";
import { AuditLogInterceptor } from "./common/interceptors/audit-log.interceptor";
import { IdempotencyInterceptor } from "./common/interceptors/idempotency.interceptor";
import { DealsModule } from "./deals/deals.module";
import { CompaniesModule } from "./companies/companies.module";
import { HealthController } from "./health.controller";
import { DashboardModule } from "./dashboard/dashboard.module";
import { SegmentsModule } from "./segments/segments.module";
import { SegmentsController } from "./segments/segments.controller";
import { SegmentsService } from "./segments/segments.service";
import { ContactsModule } from "./contacts/contacts.module";
import { ProductsModule } from "./products/products.module";
import { PipelinesModule } from "./pipelines/pipelines.module";
import { MeetingsModule } from "./meetings/meetings.module";

const crmCrudModules = [
  ["RolesModule", "roles"],
  ["PermissionsModule", "permissions"],
  ["LeadsModule", "leads"],
  ["ContactsModule", "contacts"],
  ["DealersModule", "dealers"],
  ["ActivitiesModule", "activities"],
  ["NotesModule", "notes"],
  ["TasksModule", "tasks"],
  ["FollowUpsModule", "follow-ups"],
  ["VisitsModule", "visits"],
  ["ReportsModule", "reports"],
  ["NotificationsModule", "notifications"],
  ["IntegrationsModule", "integrations"],
  ["FilesModule", "files"],
  ["SettingsModule", "settings"]
].map(([name, route]) => buildCrudModule(name, route));

const redisHost = process.env.REDIS_HOST?.trim();
const queueEnabled = Boolean(redisHost && redisHost !== "localhost" && redisHost !== "127.0.0.1");
const queueModules = queueEnabled ? [
  BullModule.forRootAsync({
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
      connection: {
        host: config.get("REDIS_HOST", "localhost"),
        port: config.get("REDIS_PORT", 6379)
      }
    })
  }),
  ReminderQueueModule
] : [];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    DealsModule,
    CompaniesModule,
    ContactsModule,
    ProductsModule,
    PipelinesModule,
    MeetingsModule,
    DashboardModule,
    SegmentsModule,
    AuditLogsModule,
    ...queueModules,
    ...crmCrudModules
  ],
  controllers: [HealthController, SegmentsController],
  providers: [
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
    SegmentsService
  ]
})
export class AppModule {}
