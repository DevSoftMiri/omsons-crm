import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { TasksService } from "./tasks.service";

@Controller("tasks")
export class TasksController {
  constructor(private readonly service: TasksService) {}
  @Get() list(@Query("companyId") companyId?: string) { return this.service.list(companyId); }
  @Post() create(@Body() body: Record<string, unknown>) { return this.service.create(body); }
  @Patch(":id") update(@Param("id") id: string, @Body() body: Record<string, unknown>) { return this.service.update(id, body); }
  @Delete(":id") remove(@Param("id") id: string) { return this.service.remove(id); }
}
