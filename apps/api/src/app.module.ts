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
import { DealsModule } from "./deals/deals.module";
import { CompaniesModule } from "./companies/companies.module";
import { HealthController } from "./health.controller";

const crmCrudModules = [
  ["RolesModule", "roles"],
  ["PermissionsModule", "permissions"],
  ["LeadsModule", "leads"],
  ["ContactsModule", "contacts"],
  ["DealersModule", "dealers"],
  ["PipelinesModule", "pipelines"],
  ["ActivitiesModule", "activities"],
  ["NotesModule", "notes"],
  ["TasksModule", "tasks"],
  ["FollowUpsModule", "follow-ups"],
  ["VisitsModule", "visits"],
  ["DashboardsModule", "dashboards"],
  ["ReportsModule", "reports"],
  ["NotificationsModule", "notifications"],
  ["IntegrationsModule", "integrations"],
  ["FilesModule", "files"],
  ["SettingsModule", "settings"]
].map(([name, route]) => buildCrudModule(name, route));

const queueModules = process.env.VERCEL === "1" ? [] : [
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
];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    DealsModule,
    CompaniesModule,
    AuditLogsModule,
    ...queueModules,
    ...crmCrudModules
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor }
  ]
})
export class AppModule {}
