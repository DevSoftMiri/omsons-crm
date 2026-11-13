import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly config: ConfigService, private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext) {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])) return true;
    const request = context.switchToHttp().getRequest<{ headers: { authorization?: string }; cookies?: Record<string, string>; user?: { sub: string; email: string; roles: string[] } }>();
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, "") || request.cookies?.omsons_access_token;
    if (!token) throw new UnauthorizedException("Authentication required");
    try {
      request.user = await this.jwt.verifyAsync<{ sub: string; email: string; roles: string[] }>(token, { secret: this.config.get("JWT_ACCESS_SECRET") });
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired access token");
    }
  }
}
