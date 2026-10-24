import { IsArray, IsOptional, IsString, MinLength } from "class-validator";

export class CompanyDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional() @IsString() industry?: string;
  @IsOptional() @IsString() domainName?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() postalCode?: string;
  @IsOptional() numberOfEmployees?: number;
  @IsOptional() @IsString() timeZone?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() linkedinCompanyPage?: string;
  @IsOptional() customFields?: Record<string, unknown>;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() parentCompanyId?: string | null;
  @IsOptional() @IsString() ownerId?: string | null;
  @IsOptional() @IsArray() @IsString({ each: true }) regions?: string[];
  @IsOptional() @IsString() customerType?: string;
  @IsOptional() @IsString() companySize?: string;
  @IsOptional() annualRevenue?: number;
  @IsOptional() customerSince?: string;
  @IsOptional() targetAccount?: boolean;
  @IsOptional() @IsString() idealCustomerProfileTier?: string;
  @IsOptional() numberOfBlockers?: number;
  @IsOptional() numberOfBuyingRoleContacts?: number;
  @IsOptional() numberOfDecisionMakers?: number;
}
