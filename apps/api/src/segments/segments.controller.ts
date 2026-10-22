import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { SegmentsService } from "./segments.service";

@Controller("segments")
export class SegmentsController {
  constructor(private readonly service: SegmentsService) {}
  @Get() list(@Query() query: { search?: string; objectType?: string; includeDeleted?: string }) { return this.service.list(query); }
  @Post() create(@Body() body: { name: string; description?: string; objectType: "COMPANY" | "CONTACT" | "DEAL"; filters?: unknown }) { return this.service.create(body); }
  @Get(":id") get(@Param("id") id: string) { return this.service.get(id); }
  @Patch(":id") update(@Param("id") id: string, @Body() body: Partial<{ name: string; description: string; objectType: "COMPANY" | "CONTACT" | "DEAL"; filters: unknown }>) { return this.service.update(id, body); }
  @Delete(":id") remove(@Param("id") id: string) { return this.service.remove(id); }
  @Get(":id/members") members(@Param("id") id: string, @Query("limit") limit?: string) { return this.service.members(id, Number(limit) || 100); }
  @Get(":id/count") count(@Param("id") id: string) { return this.service.count(id); }
}
