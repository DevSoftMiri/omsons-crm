import { Controller, Get, Query } from "@nestjs/common";
import { IsIn, IsOptional, IsString } from "class-validator";
import { DashboardService } from "./dashboard.service";

class DashboardQuery {
  @IsOptional() @IsIn(["current-month", "current-quarter", "current-year"]) period = "current-quarter";
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsString() region?: string;
  @IsOptional() @IsString() pipeline?: string;
}

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get("summary")
  summary(@Query() query: DashboardQuery) {
    return this.dashboard.summary(query);
  }
}
