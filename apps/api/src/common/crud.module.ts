import { Body, Controller, Delete, Get, Module, Param, Patch, Post, Query } from "@nestjs/common";
import { CreateRecordDto } from "./dto/create-record.dto";
import { QueryDto } from "./dto/query.dto";

class GenericCrudService {
  private readonly records: Array<Record<string, unknown>> = [];

  list(query: QueryDto) {
    return { data: this.records, page: query.page, limit: query.limit, total: this.records.length };
  }

  create(dto: CreateRecordDto) {
    const record = { id: crypto.randomUUID(), ...dto, createdAt: new Date(), updatedAt: new Date() };
    this.records.push(record);
    return record;
  }

  findOne(id: string) {
    return this.records.find((record) => record.id === id) ?? null;
  }

  update(id: string, dto: CreateRecordDto) {
    const record = this.findOne(id);
    return record ? Object.assign(record, dto, { updatedAt: new Date() }) : null;
  }

  remove(id: string) {
    return { deleted: this.records.findIndex((record) => record.id === id) >= 0 };
  }

  exportCsv() {
    return { status: "queued", format: "csv" };
  }

  exportExcel() {
    return { status: "queued", format: "xlsx" };
  }
}

export function buildCrudModule(moduleName: string, route: string) {
  @Controller(route)
  class GenericCrudController {
    constructor(private readonly service: GenericCrudService) {}

    @Get()
    list(@Query() query: QueryDto) {
      return this.service.list(query);
    }

    @Post()
    create(@Body() dto: CreateRecordDto) {
      return this.service.create(dto);
    }

    @Get("export/csv")
    exportCsv() {
      return this.service.exportCsv();
    }

    @Get("export/excel")
    exportExcel() {
      return this.service.exportExcel();
    }

    @Get(":id")
    findOne(@Param("id") id: string) {
      return this.service.findOne(id);
    }

    @Patch(":id")
    update(@Param("id") id: string, @Body() dto: CreateRecordDto) {
      return this.service.update(id, dto);
    }

    @Delete(":id")
    remove(@Param("id") id: string) {
      return this.service.remove(id);
    }
  }

  Object.defineProperty(GenericCrudController, "name", { value: `${moduleName}Controller` });
  Object.defineProperty(GenericCrudService, "name", { value: `${moduleName}Service` });

  @Module({
    controllers: [GenericCrudController],
    providers: [GenericCrudService],
    exports: [GenericCrudService]
  })
  class GenericCrudModule {}

  Object.defineProperty(GenericCrudModule, "name", { value: moduleName });
  return GenericCrudModule;
}
