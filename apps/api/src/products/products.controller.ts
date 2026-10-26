import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ProductsService } from "./products.service";

@Controller("products")
export class ProductsController {
  constructor(private readonly products: ProductsService) {}
  @Get() list(@Query("archived") archived?: string) { return this.products.list(archived === "true"); }
  @Get(":id") findOne(@Param("id") id: string) { return this.products.findOne(id); }
  @Post() create(@Body() body: Record<string, unknown>) { return this.products.create(body); }
  @Patch(":id") update(@Param("id") id: string, @Body() body: Record<string, unknown>) { return this.products.update(id, body); }
  @Post(":id/duplicate") duplicate(@Param("id") id: string) { return this.products.duplicate(id); }
  @Post(":id/archive") archive(@Param("id") id: string) { return this.products.archive(id); }
  @Post(":id/restore") restore(@Param("id") id: string) { return this.products.restore(id); }
  @Post(":id/stock") stock(@Param("id") id: string, @Body() body: { variantId?: string }) { return this.products.toggleStock(id, body.variantId); }
}
