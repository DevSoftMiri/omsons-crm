import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { MeetingsService } from "./meetings.service";

@Controller("meetings")
export class MeetingsController {
  constructor(private readonly meetings: MeetingsService) {}

  @Get()
  list(@Query() query: Record<string, string>) { return this.meetings.list(query); }

  @Post()
  create(@Body() body: Record<string, unknown>) { return this.meetings.create(body); }

  @Post("import")
  import(@Body() body: { records?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>) { return this.meetings.importRecords(Array.isArray(body) ? body : body.records ?? []); }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: Record<string, unknown>) { return this.meetings.update(id, body); }

  @Delete(":id")
  remove(@Param("id") id: string) { return this.meetings.remove(id); }
}
