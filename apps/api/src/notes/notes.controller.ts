import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { NotesService } from "./notes.service";

@Controller("notes")
export class NotesController {
  constructor(private readonly notes: NotesService) {}
  @Get() list(@Query() query: Record<string, string>) { return this.notes.list(query); }
  @Post() create(@Body() body: Record<string, unknown>) { return this.notes.create(body); }
  @Get(":id") find(@Param("id") id: string) { return this.notes.find(id); }
}
