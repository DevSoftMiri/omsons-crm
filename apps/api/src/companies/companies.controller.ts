import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CompanyDto } from "./companies.dto";
import { CompaniesService } from "./companies.service";

@Controller("companies")
export class CompaniesController {
  constructor(private readonly service: CompaniesService) {}
  @Get() list(@Query() query: Record<string, string | undefined>) { return this.service.list(query); }
  @Post() create(@Body() dto: CompanyDto) { return this.service.create(dto); }
  @Get(":id") findOne(@Param("id") id: string) { return this.service.findOne(id); }
  @Patch(":id") update(@Param("id") id: string, @Body() dto: CompanyDto) { return this.service.update(id, dto); }
  @Get(":id/metrics") metrics(@Param("id") id: string) { return this.service.metrics(id); }
  @Get(":id/related") related(@Param("id") id: string, @Query() query: Record<string, string | undefined>) { return this.service.related(id, query); }
  @Post(":id/contacts") addContact(@Param("id") id: string, @Body() body: Record<string, unknown>) { return this.service.addContact(id, body); }
  @Get(":id/contacts") listContacts(@Param("id") id: string) { return this.service.listContacts(id); }
  @Post(":id/contacts/:contactId") linkContact(@Param("id") id: string, @Param("contactId") contactId: string) { return this.service.linkContact(id, contactId); }
  @Post(":id/archive") archive(@Param("id") id: string) { return this.service.archive(id); }
  @Post(":id/restore") restore(@Param("id") id: string) { return this.service.restore(id); }
  @Post(":id/sub-companies/:subCompanyId") addSubCompany(@Param("id") id: string, @Param("subCompanyId") subCompanyId: string) { return this.service.addSubCompany(id, subCompanyId); }
  @Delete(":id/sub-companies/:subCompanyId") unlinkSubCompany(@Param("id") id: string, @Param("subCompanyId") subCompanyId: string) { return this.service.unlinkSubCompany(id, subCompanyId); }
}
