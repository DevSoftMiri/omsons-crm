import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PrismaModule } from "../prisma/prisma.module";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CompaniesController } from "./companies.controller";
import { CompaniesService } from "./companies.service";

@Module({ imports: [PrismaModule, JwtModule.register({})], controllers: [CompaniesController], providers: [CompaniesService, JwtAuthGuard] })
export class CompaniesModule {}
