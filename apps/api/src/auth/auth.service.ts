import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import type { Response } from "express";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly users: UsersService,
    private readonly prisma: PrismaService
  ) {}

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    const normalizedPassword = dto.password.trim().toLowerCase();
    if (!user || !user.isActive || !(await bcrypt.compare(normalizedPassword, user.passwordHash))) throw new UnauthorizedException("Invalid credentials");
    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException("Refresh token required");
    const payload = await this.jwt.verifyAsync<{ sub: string; email: string; roles: string[] }>(refreshToken, {
      secret: this.config.get("JWT_REFRESH_SECRET")
    });
    const user = await this.users.findOne(payload.sub);
    if (!user || !user.isActive || !user.refreshTokenHash || !(await bcrypt.compare(refreshToken, user.refreshTokenHash))) throw new UnauthorizedException("Invalid refresh token");
    return this.issueTokens(user);
  }

  private async issueTokens(user: any) {
    const roles = user.roles.map((item: any) => item.role.name);
    const payload = { sub: user.id, email: user.email, roles };
    const accessToken = await this.jwt.signAsync(payload, { secret: this.config.get("JWT_ACCESS_SECRET"), expiresIn: this.config.get("JWT_ACCESS_EXPIRES_IN", "15m") });
    const refreshToken = await this.jwt.signAsync(payload, { secret: this.config.get("JWT_REFRESH_SECRET"), expiresIn: this.config.get("JWT_REFRESH_EXPIRES_IN", "7d") });
    await this.prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: await bcrypt.hash(refreshToken, 12) } });
    return {
      accessToken, refreshToken,
      user: { id: user.id, email: user.email, name: user.name, roles }
    };
  }

  setCookies(response: Response, accessToken: string, refreshToken: string) {
    const secure = this.config.get("COOKIE_SECURE", "false") === "true";
    response.cookie("omsons_access_token", accessToken, { httpOnly: true, sameSite: secure ? "none" : "lax", secure, maxAge: 15 * 60 * 1000, path: "/" });
    response.cookie("omsons_refresh_token", refreshToken, { httpOnly: true, sameSite: secure ? "none" : "lax", secure, maxAge: 7 * 24 * 60 * 60 * 1000, path: "/" });
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) return;
    try { const payload = await this.jwt.verifyAsync<{ sub: string }>(refreshToken, { secret: this.config.get("JWT_REFRESH_SECRET") }); await this.prisma.user.update({ where: { id: payload.sub }, data: { refreshTokenHash: null } }); } catch { /* already expired */ }
  }

  async getCurrentUser(userId: string) {
    const user = await this.users.findOne(userId);
    if (!user || !user.isActive) throw new UnauthorizedException("Authentication required");
    return { id: user.id, email: user.email, name: user.name, roles: user.roles.map((item: any) => item.role.name) };
  }
}
