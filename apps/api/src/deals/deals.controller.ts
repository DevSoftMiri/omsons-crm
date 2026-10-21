import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { DealsService } from "./deals.service";

@Controller("deals")
export class DealsController {
  constructor(private readonly deals: DealsService) {}

  @Get()
  list(@Query() query: Record<string, string>) { return this.deals.list(query); }
  @Post()
  create(@Body() body: Record<string, unknown>) { return this.deals.create(body); }
  @Patch(":id")
  update(@Param("id") id: string, @Body() body: Record<string, unknown>) { return this.deals.update(id, body); }
  @Delete(":id")
  remove(@Param("id") id: string) { return this.deals.remove(id); }
}
