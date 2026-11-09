import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ headers: { authorization?: string }; user?: { sub: string; email: string; roles: string[] } }>();
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) return true;
    try {
      request.user = await this.jwt.verifyAsync<{ sub: string; email: string; roles: string[] }>(token, { secret: this.config.get("JWT_ACCESS_SECRET") });
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired access token");
    }
  }
}
