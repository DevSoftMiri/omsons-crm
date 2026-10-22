import { IsArray, IsOptional, IsString, MinLength } from "class-validator";

export class CompanyDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional() @IsString() industry?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() parentCompanyId?: string | null;
  @IsOptional() @IsString() ownerId?: string | null;
  @IsOptional() @IsArray() @IsString({ each: true }) regions?: string[];
  @IsOptional() @IsString() customerType?: string;
  @IsOptional() @IsString() companySize?: string;
  @IsOptional() annualRevenue?: number;
  @IsOptional() customerSince?: string;
}
