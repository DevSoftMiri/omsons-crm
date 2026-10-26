import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { PipelinesService } from "./pipelines.service";

@Controller("pipelines")
export class PipelinesController {
  constructor(private readonly pipelines: PipelinesService) {}
  @Get() list() { return this.pipelines.list(); }
  @Get(":id") findOne(@Param("id") id: string) { return this.pipelines.findOne(id); }
  @Post() create(@Body() body: Record<string, unknown>) { return this.pipelines.create(body); }
  @Patch(":id") update(@Param("id") id: string, @Body() body: Record<string, unknown>) { return this.pipelines.update(id, body); }
  @Post(":id/stages") createStage(@Param("id") id: string, @Body() body: Record<string, unknown>) { return this.pipelines.createStage(id, body); }
  @Patch(":id/stages/:stageId") updateStage(@Param("id") id: string, @Param("stageId") stageId: string, @Body() body: Record<string, unknown>) { return this.pipelines.updateStage(id, stageId, body); }
  @Delete(":id/stages/:stageId") removeStage(@Param("id") id: string, @Param("stageId") stageId: string) { return this.pipelines.removeStage(id, stageId); }
}
