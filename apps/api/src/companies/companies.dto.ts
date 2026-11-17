import { IsArray, IsObject, IsOptional, IsString, MinLength } from "class-validator";

export class CompanyDto {
  @IsOptional() @IsString()
  @MinLength(1)
  name?: string;

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
  @IsOptional() @IsString() accountSource?: string;
  @IsOptional() @IsString() gstNumber?: string;
  @IsOptional() @IsString() billingStreet?: string;
  @IsOptional() @IsString() billingCity?: string;
  @IsOptional() @IsString() billingState?: string;
  @IsOptional() @IsString() billingPostalCode?: string;
  @IsOptional() @IsString() billingCountry?: string;
  @IsOptional() @IsString() shippingStreet?: string;
  @IsOptional() @IsString() shippingCity?: string;
  @IsOptional() @IsString() shippingState?: string;
  @IsOptional() @IsString() shippingPostalCode?: string;
  @IsOptional() @IsString() shippingCountry?: string;
  @IsOptional() shippingSameAsBilling?: boolean;
  @IsOptional() @IsObject() customFields?: Record<string, unknown>;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() parentCompanyId?: string | null;
  @IsOptional() @IsString() ownerId?: string | null;
  @IsOptional() @IsString() ownerName?: string;
  @IsOptional() @IsString() lifecycleStage?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) regions?: string[];
  @IsOptional() @IsString() customerType?: string;
  @IsOptional() @IsString() marketType?: string;
  @IsOptional() @IsString() companySize?: string;
  @IsOptional() annualRevenue?: number;
  @IsOptional() customerSince?: string;
  @IsOptional() targetAccount?: boolean;
  @IsOptional() @IsString() idealCustomerProfileTier?: string;
  @IsOptional() numberOfBlockers?: number;
  @IsOptional() numberOfBuyingRoleContacts?: number;
  @IsOptional() numberOfDecisionMakers?: number;
}
